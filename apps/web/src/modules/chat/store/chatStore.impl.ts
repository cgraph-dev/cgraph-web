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
import { apiClient } from '@/lib/api-client';
import { ensureArray, normalizeMessage, normalizeConversations } from '@/lib/api-utils';
import type { Message, Conversation, ChatState, ConversationParticipant } from './chatStore.types';
import { createMessagingActions } from './chatStore.messaging';
import { createOperationsActions } from './chatStore.operations';
import { toTypedMessage } from './chatStore.normalizers';

/**
 * Upper bound for the in-memory conversation list. The server paginates the
 * sidebar; this cap protects the client if a fetch ever returns an oversize
 * payload — matches Signal-Desktop's convention of a paged sidebar rather
 * than an unbounded in-memory list.
 */
const MAX_CONVERSATIONS = 1000;
const LOCKED_WEB_PLACEHOLDER = '🔒 Open on mobile or desktop to read';
const CLOUD_DECRYPT_FAILED_PLACEHOLDER = 'Unable to decrypt this Cloud Chat message.';

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

/**
 * Converts a raw normalized conversation payload (plain Record) into a
 * typed `Conversation` domain object. Exported for unit testing.
 */
export function toConversation(raw: Record<string, unknown>): Conversation {
  const participants: ConversationParticipant[] = Array.isArray(raw.participants)
    ? raw.participants.map((p: unknown): ConversationParticipant => {
        const pr = p instanceof Object ? Object.fromEntries(Object.entries(p)) : {};
        const userRaw =
          pr.user instanceof Object ? Object.fromEntries(Object.entries(pr.user)) : {};
        return {
          id: typeof pr.id === 'string' ? pr.id : '',
          userId: typeof pr.userId === 'string' ? pr.userId : '',
          nickname: typeof pr.nickname === 'string' ? pr.nickname : null,
          isMuted: pr.isMuted === true,
          mutedUntil: typeof pr.mutedUntil === 'string' ? pr.mutedUntil : null,
          joinedAt: typeof pr.joinedAt === 'string' ? pr.joinedAt : '',
          user: {
            id: typeof userRaw.id === 'string' ? userRaw.id : '',
            username: typeof userRaw.username === 'string' ? userRaw.username : '',
            displayName: typeof userRaw.displayName === 'string' ? userRaw.displayName : null,
            avatarUrl: typeof userRaw.avatarUrl === 'string' ? userRaw.avatarUrl : null,
            status: typeof userRaw.status === 'string' ? userRaw.status : 'offline',
          },
        };
      })
    : [];
  const conversationType =
    raw.conversationType === 'secret' || raw.conversationType === 'cloud'
      ? raw.conversationType
      : undefined;
  return {
    id: typeof raw.id === 'string' ? raw.id : String(raw.id ?? ''),
    type: raw.type === 'group' ? 'group' : 'direct',
    conversationType,
    name: typeof raw.name === 'string' ? raw.name : null,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
    participants,
    lastMessage:
      raw.lastMessage instanceof Object
        ? toTypedMessage(Object.fromEntries(Object.entries(raw.lastMessage)))
        : null,
    unreadCount: typeof raw.unreadCount === 'number' ? raw.unreadCount : 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

// Re-export all types for backward compatibility
export type {
  Message,
  MessageMetadata,
  Reaction,
  EditHistory,
  Conversation,
  ConversationParticipant,
  TypingUserInfo,
  ChatState,
} from './chatStore.types';

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      messageIdSets: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      typingUsers: {},
      typingUsersInfo: {},
      hasMoreMessages: {},
      conversationsLastFetchedAt: null,
      readReceipts: {},
      requestStates: {},
      processingAction: null,
      actionError: null,
      fetchConversations: async () => {
        const { conversationsLastFetchedAt, isLoadingConversations } = get();
        const now = Date.now();
        const CACHE_TTL = 30000; // 30 seconds

        if (isLoadingConversations) return;
        if (conversationsLastFetchedAt && now - conversationsLastFetchedAt < CACHE_TTL) {
          return;
        }

        set({ isLoadingConversations: true });
        try {
          const result = await apiClient.messaging.getConversations();
          if (!result.ok) {
            throw new Error(result.error.message);
          }
          const rawConversations: Record<string, unknown>[] = ensureArray(result.data);

          const normalizedConversations: Conversation[] = normalizeConversations(rawConversations)
            .map(toConversation)
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
        } catch (error: unknown) {
          set({ isLoadingMessages: false });
          throw error;
        }
      },

      ...createMessagingActions(set, get),
      ...createOperationsActions(set, get),

      setRequestState: (conversationId, status) => {
        set((state) => ({
          requestStates: { ...state.requestStates, [conversationId]: status },
        }));
      },
      removeRequestState: (conversationId) => {
        set((state) => {
          const next = { ...state.requestStates };
          delete next[conversationId];
          return { requestStates: next };
        });
      },
      setProcessingAction: (conversationId) => set({ processingAction: conversationId }),
      setActionError: (error) => set({ actionError: error }),

      reset: () =>
        set({
          conversations: [],
          activeConversationId: null,
          messages: {},
          messageIdSets: {},
          isLoadingConversations: false,
          isLoadingMessages: false,
          typingUsers: {},
          typingUsersInfo: {},
          hasMoreMessages: {},
          conversationsLastFetchedAt: null,
          readReceipts: {},
          requestStates: {},
          processingAction: null,
          actionError: null,
        }),
    }),
    {
      name: 'ChatStore',
      enabled: import.meta.env.DEV,
    }
  )
);
