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
import { createIdempotencyKey } from '@cgraph-dev/utils';
import { ensureObject, normalizeMessage } from '@/lib/api-utils';
import { useAuthStore } from '@/modules/auth/store';
import { chatLogger as logger } from '@/lib/logger';
import {
  getPendingMessagesForConversation,
  removePendingMessage,
  savePendingMessage,
  updatePendingMessageStatus,
  type PendingMessage,
} from '@/lib/offline/indexeddb-cache';
import { requestBackgroundSync } from '@/lib/offline/sync-registration';
import type { Message, ChatState } from './chatStore.types';

const LOCKED_PLACEHOLDER = '🔒 Open on mobile or desktop to read';
const CLOUD_DECRYPT_FAILED_PLACEHOLDER = 'Unable to decrypt this Cloud Chat message.';
const WEB_DM_UNAVAILABLE =
  'Secret Chats are post-quantum end-to-end encrypted. Open the mobile or desktop app to send one. Cloud Chats work on web.';
const conversationSendTails = new Map<string, Promise<void>>();

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

function isRetryableTransportFailure(error: unknown): boolean {
  if (!isRecord(error) || !isRecord(error.response)) return true;
  return typeof error.response.status === 'number' && error.response.status >= 500;
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

function metadataForTransport(metadata: Record<string, unknown>): Record<string, unknown> {
  const { localPreviewUrl: _localPreviewUrl, ...transportMetadata } = metadata;
  return transportMetadata;
}

async function runInConversationSendQueue<T>(
  conversationId: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = conversationSendTails.get(conversationId) ?? Promise.resolve();
  let release!: () => void;
  const tail = new Promise<void>((resolve) => {
    release = resolve;
  });

  conversationSendTails.set(conversationId, tail);
  await previous;

  try {
    return await task();
  } finally {
    release();
    if (conversationSendTails.get(conversationId) === tail) {
      conversationSendTails.delete(conversationId);
    }
  }
}

async function queuePendingMessage(
  accountId: string,
  clientMessageId: string,
  conversationId: string,
  content: string,
  contentType: string,
  replyToId: string | undefined,
  payload: Record<string, unknown>,
  requestBackground: boolean
): Promise<void> {
  await savePendingMessage({
    id: clientMessageId,
    accountId,
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

  if (requestBackground) {
    // Wake the SW when connectivity returns. The window sync service remains
    // the fallback for browsers without SyncManager.
    await requestBackgroundSync();
  }
}

function pendingMessageToLocalMessage(pending: PendingMessage, currentUser: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>): Message {
  const metadata = isRecord(pending.payload?.metadata) ? pending.payload.metadata : {};
  const timestamp = new Date(pending.createdAt).toISOString();

  return {
    id: pending.clientMessageId,
    clientMessageId: pending.clientMessageId,
    conversationId: pending.conversationId,
    senderId: currentUser.id,
    content: pending.content,
    encryptedContent: null,
    isEncrypted: false,
    messageType: asMessageType(pending.contentType),
    replyToId: pending.replyToId ?? null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata,
    reactions: [],
    sender: {
      id: currentUser.id,
      username: currentUser.username || '',
      displayName: currentUser.displayName || null,
      avatarUrl: currentUser.avatarUrl || null,
    },
    deliveryStatus: pending.status === 'failed' ? 'failed' : 'sending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function sendPendingMessage(get: Get, pending: PendingMessage): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await requestBackgroundSync();
    return;
  }

  await updatePendingMessageStatus(pending.id, 'sending');
  get().updateMessageStatus(pending.conversationId, pending.clientMessageId, 'sending');

  try {
    const response = await http.post(
      `/api/v1/conversations/${pending.conversationId}/messages`,
      pending.payload
    );
    const rawMessage: Record<string, unknown> = ensureObject(response.data, 'message') ?? {};
    const normalized = normalizeMessage(rawMessage);
    const message = toMessage(normalized);
    if (!message) {
      throw new Error('Message response did not include a valid message');
    }

    get().addMessage({
      ...message,
      clientMessageId: message.clientMessageId ?? pending.clientMessageId,
      deliveryStatus: 'sent',
    });

    try {
      await removePendingMessage(pending.id);
    } catch (cleanupError) {
      logger.warn('Sent message outbox cleanup failed:', cleanupError);
    }
  } catch (error: unknown) {
    if (
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      isRetryableTransportFailure(error)
    ) {
      await updatePendingMessageStatus(pending.id, 'pending');
      await requestBackgroundSync();
      return;
    }

    await updatePendingMessageStatus(pending.id, 'failed', 'Message send failed.');
    get().updateMessageStatus(pending.conversationId, pending.clientMessageId, 'failed');
    logger.error('Failed to send message:', error);
    throw error;
  }
}

/** Create messaging actions for the chat store. */
export function createMessagingActions(set: Set, get: Get) {
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
      const transportMetadata = metadataForTransport(metadata);
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

      if (typeof metadata.uploadId === 'string' && metadata.uploadId.length > 0) {
        payload.upload_id = metadata.uploadId;
      } else if (metadata.fileUrl) {
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

      if (Object.keys(transportMetadata).length > 0) {
        payload.metadata = transportMetadata;
      }

      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) {
        throw new Error('An authenticated account is required to send a message.');
      }

      await queuePendingMessage(
        currentUser.id,
        clientMessageId,
        conversationId,
        content,
        contentType,
        replyToId,
        payload,
        false
      );

      const optimisticMessage: Message = {
        id: clientMessageId,
        clientMessageId,
        conversationId,
        senderId: currentUser.id,
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
          id: currentUser.id,
          username: currentUser.username || '',
          displayName: currentUser.displayName || null,
          avatarUrl: currentUser.avatarUrl || null,
        },
        deliveryStatus: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().addMessage(optimisticMessage);

      const pending: PendingMessage = {
        id: clientMessageId,
        accountId: currentUser.id,
        clientMessageId,
        conversationId,
        content,
        contentType,
        payload,
        replyToId: replyToId ?? null,
        createdAt: Date.now(),
        status: 'pending',
        retryCount: 0,
      };

      return runInConversationSendQueue(conversationId, () => sendPendingMessage(get, pending));
    },

    /**
     * Retry sending a failed message.
     */
    resendMessage: async (conversationId: string, failedMessageId: string) => {
      const messages = get().messages[conversationId] || [];
      const failedMsg = messages.find((m) => m.id === failedMessageId);
      if (!failedMsg || failedMsg.deliveryStatus !== 'failed') return;

      const accountId = useAuthStore.getState().user?.id;
      if (!accountId) return;

      const pendingMessages = await getPendingMessagesForConversation(accountId, conversationId);
      const pending = pendingMessages.find((message) => message.clientMessageId === failedMessageId);
      if (!pending || pending.status !== 'failed') return;

      await updatePendingMessageStatus(pending.id, 'pending');
      get().updateMessageStatus(conversationId, failedMessageId, 'sending');
      await runInConversationSendQueue(conversationId, () => sendPendingMessage(get, pending));
    },

    hydratePendingMessages: async (conversationId: string) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) return;

      let pendingMessages: PendingMessage[];
      try {
        pendingMessages = await getPendingMessagesForConversation(currentUser.id, conversationId);
      } catch (error) {
        logger.warn('Pending message hydration failed:', error);
        return;
      }

      if (pendingMessages.length === 0) return;

      set((state) => {
        const existing = state.messages[conversationId] || [];
        const knownClientMessageIds = new Set(
          existing.map((message) => message.clientMessageId ?? message.id)
        );
        const additions = pendingMessages
          .filter((pending) => !knownClientMessageIds.has(pending.clientMessageId))
          .map((pending) => pendingMessageToLocalMessage(pending, currentUser));

        if (additions.length === 0) return state;

        const messageIdSet = new Set(state.messageIdSets[conversationId] || []);
        for (const message of additions) {
          messageIdSet.add(message.id);
        }

        return {
          messages: {
            ...state.messages,
            [conversationId]: [...existing, ...additions].sort((left, right) =>
              left.createdAt.localeCompare(right.createdAt)
            ),
          },
          messageIdSets: {
            ...state.messageIdSets,
            [conversationId]: messageIdSet,
          },
        };
      });
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
