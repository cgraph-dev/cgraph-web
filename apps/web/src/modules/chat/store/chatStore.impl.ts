/**
 * Chat Store — Implementation (Orchestrator)
 *
 * Composes all chat store action slices into a single Zustand store.
 * Web is not a Signal-participant device (ADR-022): encrypted DM content is
 * never decrypted here. Group/forum/hub/broadcast messaging is plaintext over
 * TLS and flows through normally.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, http } from '@/lib/api-client';
import { ensureArray, normalizeMessage, normalizeConversations } from '@/lib/api-utils';
import type {
  Message,
  Conversation,
  ConversationFetchOptions,
  ChatState,
  ChatIdentityPatch,
} from './chatStore.types';
import { createMessagingActions } from './chatStore.messaging';
import { createOperationsActions } from './chatStore.operations';
import { toTypedConversation, toTypedMessage } from './chatStore.normalizers';

/**
 * Upper bound for the in-memory conversation list. The server paginates the
 * sidebar; this cap protects the client if a fetch ever returns an oversize
 * payload — matches Signal-Desktop's convention of a paged sidebar rather
 * than an unbounded in-memory list.
 */
const MAX_CONVERSATIONS = 1000;
const CONVERSATION_CACHE_TTL_MS = 30_000;
const LOCKED_WEB_PLACEHOLDER = '🔒 Open on mobile or desktop to read';
const CLOUD_DECRYPT_FAILED_PLACEHOLDER = 'Unable to decrypt this Cloud Chat message.';

let conversationFetchInFlight: Promise<void> | null = null;
let forcedConversationRefreshQueued = false;

function resetConversationFetchGuards() {
  conversationFetchInFlight = null;
  forcedConversationRefreshQueued = false;
}

function renderableMessageForWeb(msg: Message): Message {
  if (!msg.isEncrypted) {
    return msg;
  }

  if (msg.requiresMobile === false && msg.content.length > 0 && msg.decryptionFailed !== true) {
    return msg;
  }

  return {
    ...msg,
    content:
      msg.decryptionFailed === true ? CLOUD_DECRYPT_FAILED_PLACEHOLDER : LOCKED_WEB_PLACEHOLDER,
  };
}

function patchMessageIdentity(message: Message, userId: string, patch: ChatIdentityPatch): Message;
function patchMessageIdentity(message: null, userId: string, patch: ChatIdentityPatch): null;
function patchMessageIdentity(
  message: Message | null,
  userId: string,
  patch: ChatIdentityPatch
): Message | null;
function patchMessageIdentity(
  message: Message | null,
  userId: string,
  patch: ChatIdentityPatch
): Message | null {
  if (!message) return message;

  const sender = message.sender?.id === userId ? { ...message.sender, ...patch } : message.sender;
  const replyTo: Message | null = message.replyTo
    ? patchMessageIdentity(message.replyTo, userId, patch)
    : null;

  if (sender === message.sender && replyTo === message.replyTo) {
    return message;
  }

  return { ...message, sender, replyTo };
}

function patchConversationIdentity(
  conversation: Conversation,
  userId: string,
  patch: ChatIdentityPatch
): Conversation {
  const participants = conversation.participants.map((participant) =>
    participant.userId === userId || participant.user.id === userId
      ? { ...participant, user: { ...participant.user, ...patch } }
      : participant
  );

  return {
    ...conversation,
    participants,
    lastMessage: patchMessageIdentity(conversation.lastMessage, userId, patch),
  };
}

export const toConversation = toTypedConversation;

// Re-export all types for backward compatibility
export type {
  Message,
  MessageMetadata,
  Reaction,
  EditHistory,
  Conversation,
  ConversationParticipant,
  ConversationFetchOptions,
  TypingUserInfo,
  ChatState,
} from './chatStore.types';

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      archivedConversations: [],
      activeConversationId: null,
      messages: {},
      messageIdSets: {},
      isLoadingConversations: false,
      isLoadingArchivedConversations: false,
      isLoadingMessages: false,
      typingUsers: {},
      typingUsersInfo: {},
      hasMoreMessages: {},
      conversationsLastFetchedAt: null,
      readReceipts: {},
      applyUserIdentityPatch: (userId, patch) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            patchConversationIdentity(conversation, userId, patch)
          ),
          archivedConversations: state.archivedConversations.map((conversation) =>
            patchConversationIdentity(conversation, userId, patch)
          ),
          messages: Object.fromEntries(
            Object.entries(state.messages).map(([conversationId, messages]) => [
              conversationId,
              messages.map((message) => patchMessageIdentity(message, userId, patch)),
            ])
          ),
        }));
      },
      fetchConversations: async (options: ConversationFetchOptions = {}) => {
        const force = options.force === true;
        const { conversationsLastFetchedAt, isLoadingConversations } = get();
        const now = Date.now();

        if (conversationFetchInFlight) {
          if (force) forcedConversationRefreshQueued = true;
          return conversationFetchInFlight;
        }

        if (isLoadingConversations) return;
        if (
          !force &&
          conversationsLastFetchedAt &&
          now - conversationsLastFetchedAt < CONVERSATION_CACHE_TTL_MS
        ) {
          return;
        }

        const request = (async () => {
          set({ isLoadingConversations: true });
          try {
            const result = await apiClient.messaging.getConversations();
            if (!result.ok) {
              throw new Error(result.error.message);
            }
            const rawConversations: Record<string, unknown>[] = ensureArray(result.data);

            const normalizedConversations: Conversation[] = normalizeConversations(rawConversations)
              .map(toTypedConversation)
              .slice(0, MAX_CONVERSATIONS);
            set({
              conversations: normalizedConversations,
              isLoadingConversations: false,
              conversationsLastFetchedAt: now,
            });
          } catch (error: unknown) {
            set({ isLoadingConversations: false });
            throw error;
          }
        })();

        const guardedRequest = request.finally(async () => {
          if (conversationFetchInFlight !== guardedRequest) return;

          conversationFetchInFlight = null;
          if (!forcedConversationRefreshQueued) return;

          forcedConversationRefreshQueued = false;
          await get().fetchConversations({ force: true });
        });

        conversationFetchInFlight = guardedRequest;
        return guardedRequest;
      },

      fetchArchivedConversations: async () => {
        const { isLoadingArchivedConversations } = get();
        if (isLoadingArchivedConversations) return;

        set({ isLoadingArchivedConversations: true });
        try {
          const response = await http.get('/api/v1/conversations/archived');
          const rawConversations: Record<string, unknown>[] = ensureArray(response.data, 'data');
          const archivedConversations = normalizeConversations(rawConversations)
            .map(toConversation)
            .slice(0, MAX_CONVERSATIONS);
          set({
            archivedConversations,
            isLoadingArchivedConversations: false,
          });
        } catch (error: unknown) {
          set({ isLoadingArchivedConversations: false });
          throw error;
        }
      },

      fetchMessages: async (conversationId: string, before?: string) => {
        set({ isLoadingMessages: true });
        try {
          const fetchParams = before
            ? { cursor: before, limit: 50, direction: 'before' as const }
            : { limit: 50 };
          const fetchResult = await apiClient.messaging.fetch(conversationId, fetchParams);
          if (!fetchResult.ok) throw new Error(fetchResult.error.message);
          const rawMessages: Record<string, unknown>[] = ensureArray(fetchResult.data);

          const newMessages: Message[] = rawMessages.map((m) =>
            toTypedMessage(normalizeMessage(m))
          );
          const hasMore = newMessages.length === 50;

          const processedMessages = newMessages.map(renderableMessageForWeb);

          set((state) => {
            const existingIds = state.messageIdSets[conversationId] || new Set<string>();
            const newIdSet = new Set(existingIds);
            processedMessages.forEach((m) => newIdSet.add(m.id));

            // Merge messages: prepend if loading older, replace if initial fetch
            let mergedMessages = before
              ? [...processedMessages, ...(state.messages[conversationId] || [])]
              : processedMessages;

            // Enforce MAX_MESSAGES_PER_CONVERSATION to prevent unbounded memory growth.
            // When scrolling up through history, prune from the END (newest).
            // When loading fresh, prune from the START (oldest) — same as addMessage.
            const MAX_MESSAGES = 500;
            if (mergedMessages.length > MAX_MESSAGES) {
              if (before) {
                // User is scrolling up — keep oldest, prune newest (they'll re-fetch on scroll down)
                const pruneCount = mergedMessages.length - MAX_MESSAGES;
                const pruned = mergedMessages.slice(mergedMessages.length - pruneCount);
                mergedMessages = mergedMessages.slice(0, MAX_MESSAGES);
                for (const p of pruned) {
                  newIdSet.delete(p.id);
                }
              } else {
                // Initial load — keep newest, prune oldest
                const pruneCount = mergedMessages.length - MAX_MESSAGES;
                const pruned = mergedMessages.slice(0, pruneCount);
                mergedMessages = mergedMessages.slice(pruneCount);
                for (const p of pruned) {
                  newIdSet.delete(p.id);
                }
              }
            }

            return {
              messages: {
                ...state.messages,
                [conversationId]: mergedMessages,
              },
              messageIdSets: {
                ...state.messageIdSets,
                [conversationId]: newIdSet,
              },
              hasMoreMessages: {
                ...state.hasMoreMessages,
                [conversationId]: hasMore,
              },
              isLoadingMessages: false,
            };
          });

          if (!before) {
            await get().hydratePendingMessages(conversationId);
          }
        } catch (error: unknown) {
          if (!before) {
            await get().hydratePendingMessages(conversationId);
          }
          set({ isLoadingMessages: false });
          throw error;
        }
      },

      ...createMessagingActions(set, get),
      ...createOperationsActions(set, get),

      reset: () => {
        resetConversationFetchGuards();
        set({
          conversations: [],
          archivedConversations: [],
          activeConversationId: null,
          messages: {},
          messageIdSets: {},
          isLoadingConversations: false,
          isLoadingArchivedConversations: false,
          isLoadingMessages: false,
          typingUsers: {},
          typingUsersInfo: {},
          hasMoreMessages: {},
          conversationsLastFetchedAt: null,
          readReceipts: {},
        });
      },
    }),
    {
      name: 'ChatStore',
      enabled: import.meta.env.DEV,
    }
  )
);
