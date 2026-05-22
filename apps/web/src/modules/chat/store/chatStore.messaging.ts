/**
 * Chat Store — Messaging Actions
 *
 * Send and receive messages. Two DM tiers (ADR-022 / ADR-023):
 *   - `cloud`  → server-readable (AES-256-GCM + KMS). Web supported.
 *   - `secret` → post-quantum E2EE, mobile/desktop only. Web fails closed.
 *
 * `sendMessage` refuses Secret conversations on web; any encrypted inbound
 * payload is stored as a locked placeholder as defense-in-depth.
 */

import { http } from '@/lib/api-client';
import { createIdempotencyKey } from '@cgraph/utils';
import { ensureObject, normalizeMessage } from '@/lib/api-utils';
import { useAuthStore } from '@/modules/auth/store';
import { chatLogger as logger } from '@/lib/logger';
import { savePendingMessage } from '@/lib/offline/indexeddb-cache';
import { requestBackgroundSync } from '@/lib/offline/sync-registration';
import type { Message, ChatState } from './chatStore.types';

const LOCKED_PLACEHOLDER = '🔒 Open on mobile or desktop to read';
const CLOUD_DECRYPT_FAILED_PLACEHOLDER = 'Unable to decrypt this Cloud Chat message.';
const WEB_DM_UNAVAILABLE =
  'Secret Chats are post-quantum end-to-end encrypted. Open the mobile or desktop app to send one. Cloud Chats work on web.';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

const MESSAGE_TYPE_VALUES: readonly string[] = [
  'text',
  'image',
  'video',
  'file',
  'audio',
  'voice',
  'sticker',
  'gif',
  'system',
];
const MESSAGE_TYPES: ReadonlySet<string> = new Set(MESSAGE_TYPE_VALUES);

function isMessageType(v: string): v is Message['messageType'] {
  return MESSAGE_TYPES.has(v);
}

function asMessageType(v: string): Message['messageType'] {
  return isMessageType(v) ? v : 'text';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMessage(raw: unknown): raw is Message {
  if (!isRecord(raw)) return false;
  return (
    typeof raw.id === 'string' &&
    typeof raw.conversationId === 'string' &&
    typeof raw.senderId === 'string' &&
    typeof raw.content === 'string' &&
    typeof raw.isEncrypted === 'boolean' &&
    typeof raw.createdAt === 'string' &&
    typeof raw.updatedAt === 'string' &&
    raw.sender !== undefined &&
    isRecord(raw.sender) &&
    typeof raw.sender.id === 'string'
  );
}

function toMessage(raw: Record<string, unknown>): Message | null {
  return isMessage(raw) ? raw : null;
}

async function queuePendingMessage(
  clientMessageId: string,
  conversationId: string,
  content: string,
  contentType: string,
  replyToId: string | undefined,
  payload: Record<string, unknown>
): Promise<void> {
  await savePendingMessage({
    id: clientMessageId,
    clientMessageId,
    conversationId,
    content,
    contentType,
    payload,
    replyToId: replyToId ?? null,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
  });

  // Wake the SW the moment the browser regains connectivity, even if the
  // tab is closed. Falls back silently in browsers without SyncManager —
  // sync-service.ts still retries on the window `online` event.
  await requestBackgroundSync();
}

/** Create messaging actions for the chat store. */
export function createMessagingActions(_set: Set, get: Get) {
  return {
    sendMessage: async (
      conversationId: string,
      content: string,
      replyToId?: string,
      options?: { type?: string; metadata?: Record<string, unknown> }
    ) => {
      const clientMessageId = createIdempotencyKey();
      const { conversations } = get();
      const conversation = conversations.find((c) => c.id === conversationId);
      const contentType = options?.type || 'text';
      const metadata = options?.metadata || {};
      const isSecretConversation = conversation?.conversationType === 'secret';

      if (isSecretConversation) {
        throw new Error(WEB_DM_UNAVAILABLE);
      }

      const payload: Record<string, unknown> = {
        content,
        client_message_id: clientMessageId,
        content_type: contentType,
      };
      if (replyToId) payload.reply_to_id = replyToId;

      if (metadata.fileUrl) {
        payload.file_url = metadata.fileUrl;
        payload.file_name = metadata.fileName;
        payload.file_size = metadata.fileSize;
        payload.file_mime_type = metadata.fileMimeType;
        if (metadata.thumbnailUrl) payload.thumbnail_url = metadata.thumbnailUrl;
      }

      if (typeof metadata.nodes_price === 'number') {
        payload.nodes_price = metadata.nodes_price;
      }
      if (typeof metadata.nodesPrice === 'number') {
        payload.nodes_price = metadata.nodesPrice;
      }
      if (typeof metadata.is_file_locked === 'boolean') {
        payload.is_file_locked = metadata.is_file_locked;
      }
      if (typeof metadata.isFileLocked === 'boolean') {
        payload.is_file_locked = metadata.isFileLocked;
      }

      if (metadata && Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }

      const currentUser = useAuthStore.getState().user;
      const optimisticMessage: Message = {
        id: clientMessageId,
        conversationId,
        senderId: currentUser?.id || '',
        content,
        encryptedContent: null,
        isEncrypted: false,
        messageType: asMessageType(contentType),
        replyToId: replyToId || null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,
        metadata: metadata || {},
        reactions: [],
        sender: {
          id: currentUser?.id || '',
          username: currentUser?.username || '',
          displayName: currentUser?.displayName || null,
          avatarUrl: currentUser?.avatarUrl || null,
        },
        deliveryStatus: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().addMessage(optimisticMessage);

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          await queuePendingMessage(
            clientMessageId,
            conversationId,
            content,
            contentType,
            replyToId,
            payload
          );
          logger.log('Queued message for offline sync');
          return;
        }

        const response = await http.post(
          `/api/v1/conversations/${conversationId}/messages`,
          payload
        );
        const rawMessage: Record<string, unknown> = ensureObject(response.data, 'message') ?? {};
        const normalized = normalizeMessage(rawMessage);
        const message = toMessage(normalized);
        if (message) {
          get().removeMessage(clientMessageId, conversationId);
          get().addMessage({ ...message, deliveryStatus: 'sent' });
        }
      } catch (error: unknown) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          await queuePendingMessage(
            clientMessageId,
            conversationId,
            content,
            contentType,
            replyToId,
            payload
          );
          logger.log('Queued message for offline sync after connection loss');
          return;
        }

        get().updateMessageStatus(conversationId, clientMessageId, 'failed');
        logger.error('Failed to send message:', error);
        throw error;
      }
    },

    /**
     * Retry sending a failed message.
     */
    resendMessage: async (conversationId: string, failedMessageId: string) => {
      const messages = get().messages[conversationId] || [];
      const failedMsg = messages.find((m) => m.id === failedMessageId);
      if (!failedMsg || failedMsg.deliveryStatus !== 'failed') return;

      get().removeMessage(failedMessageId, conversationId);
      await get().sendMessage(conversationId, failedMsg.content, failedMsg.replyToId ?? undefined);
    },

    /**
     * Web does not send encrypted DMs (ADR-022). This action exists only so
     * the store interface stays stable for callers (e.g., socket handlers that
     * once initiated retries here). It always fails closed.
     */
    sendEncryptedMessage: async (
      _conversationId: string,
      _recipientId: string,
      _content: string,
      _replyToId?: string
    ): Promise<void> => {
      throw new Error(WEB_DM_UNAVAILABLE);
    },

    /**
     * Incoming message handler for web.
     *
     * Plaintext messages (groups, forums, hubs, broadcasts) are added as-is.
     * Encrypted messages are stored with a locked placeholder and the
     * encrypted content is never shown in the browser.
     */
    decryptAndAddMessage: async (message: Message): Promise<void> => {
      const hasServerDisplayContent =
        message.isEncrypted &&
        message.requiresMobile === false &&
        message.content.length > 0 &&
        message.decryptionFailed !== true;

      if (!message.isEncrypted || hasServerDisplayContent) {
        get().addMessage(message);
        return;
      }

      get().addMessage({
        ...message,
        content:
          message.decryptionFailed === true ? CLOUD_DECRYPT_FAILED_PLACEHOLDER : LOCKED_PLACEHOLDER,
        isEncrypted: true,
        decryptionFailed: message.decryptionFailed === true,
      });
    },
  };
}
