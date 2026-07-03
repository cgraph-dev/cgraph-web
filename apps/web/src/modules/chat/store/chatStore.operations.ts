/**
 * Chat Store — Operations Actions
 *
 * Conversation management, typing indicators, and state management.
 * Message-level operations (add, edit, delete, reactions) are delegated
 * to chatStore.message-ops and re-exported here.
 *
 */

import { http } from '@/lib/api-client';
import { ensureObject } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatStoreOperations');
import { createMessageOpsActions } from './chatStore.message-ops';
import { useAuthStore } from '@/modules/auth/store';
import type { Conversation, ChatState } from './chatStore.types';

function updateConversationState(
  conversation: Conversation,
  updates: Partial<Conversation>
): Conversation {
  return { ...conversation, ...updates };
}

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

/** Create operations actions for the chat store. */
export function createOperationsActions(set: Set, get: Get) {
  const messageOps = createMessageOpsActions(set, get);

  // Typing auto-clear timers: `${conversationId}:${userId}` → timer
  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const conversationCreatesInFlight = new Map<string, Promise<Conversation>>();
  const TYPING_AUTO_CLEAR_MS = 6000; // Clear typing after 6s of no new event

  return {
    // Spread all message operations (edit, delete, add, update, remove, reactions)
    ...messageOps,

    setActiveConversation: (conversationId: string | null) => {
      set({ activeConversationId: conversationId });
    },

    setTypingUser: (
      conversationId: string,
      userId: string,
      isTyping: boolean,
      startedAt?: string
    ) => {
      const timerKey = `${conversationId}:${userId}`;

      // Clear any existing auto-clear timer for this user
      const existingTimer = typingTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingTimers.delete(timerKey);
      }

      // If typing, start a 6s auto-clear timer
      if (isTyping) {
        const timer = setTimeout(() => {
          typingTimers.delete(timerKey);
          // Auto-clear: set typing to false
          set((state) => {
            const currentIds = state.typingUsers[conversationId] || [];
            const currentInfo = state.typingUsersInfo[conversationId] || [];
            return {
              typingUsers: {
                ...state.typingUsers,
                [conversationId]: currentIds.filter((id) => id !== userId),
              },
              typingUsersInfo: {
                ...state.typingUsersInfo,
                [conversationId]: currentInfo.filter((u) => u.userId !== userId),
              },
            };
          });
        }, TYPING_AUTO_CLEAR_MS);
        typingTimers.set(timerKey, timer);
      }

      set((state) => {
        const currentIds = state.typingUsers[conversationId] || [];
        const currentInfo = state.typingUsersInfo[conversationId] || [];

        const updatedIds = isTyping
          ? [...new Set([...currentIds, userId])]
          : currentIds.filter((id) => id !== userId);

        const updatedInfo = isTyping
          ? [...currentInfo.filter((u) => u.userId !== userId), { userId, startedAt }]
          : currentInfo.filter((u) => u.userId !== userId);

        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: updatedIds,
          },
          typingUsersInfo: {
            ...state.typingUsersInfo,
            [conversationId]: updatedInfo,
          },
        };
      });
    },

    markAsRead: async (conversationId: string) => {
      try {
        await http.post(`/api/v1/conversations/${conversationId}/read`);

        // Update unread count
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
        }));

        // Update delivery status on messages from other users to 'read'
        const currentUserId = useAuthStore.getState().user?.id;
        if (currentUserId) {
          set((state) => {
            const conversationMessages = state.messages[conversationId];
            if (!conversationMessages) return state;

            const updatedMessages = conversationMessages.map((m) => {
              if (m.senderId !== currentUserId && m.deliveryStatus !== 'read') {
                return { ...m, deliveryStatus: 'read' as const };
              }
              return m;
            });

            return {
              messages: { ...state.messages, [conversationId]: updatedMessages },
            };
          });
        }
      } catch (error) {
        logger.warn('Failed to mark conversation as read', error);
      }
    },

    markAsUnread: async (conversationId: string) => {
      await http.post(`/api/v1/conversations/${conversationId}/unread`);
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? updateConversationState(conv, {
                unreadCount: Math.max(conv.unreadCount, 1),
              })
            : conv
        ),
        archivedConversations: state.archivedConversations.map((conv) =>
          conv.id === conversationId
            ? updateConversationState(conv, {
                unreadCount: Math.max(conv.unreadCount, 1),
              })
            : conv
        ),
      }));
    },

    archiveConversation: async (conversationId: string) => {
      await http.post(`/api/v1/conversations/${conversationId}/archive`);
      set((state) => ({
        activeConversationId:
          state.activeConversationId === conversationId ? null : state.activeConversationId,
        archivedConversations: [
          ...state.conversations
            .filter((conv) => conv.id === conversationId)
            .map((conv) => updateConversationState(conv, { isArchived: true })),
          ...state.archivedConversations.filter((conv) => conv.id !== conversationId),
        ],
        conversations: state.conversations.filter((conv) => conv.id !== conversationId),
      }));
    },

    unarchiveConversation: async (conversationId: string) => {
      await http.post(`/api/v1/conversations/${conversationId}/unarchive`);
      set((state) => ({
        conversations: [
          ...state.archivedConversations
            .filter((conv) => conv.id === conversationId)
            .map((conv) => updateConversationState(conv, { isArchived: false })),
          ...state.conversations.filter((conv) => conv.id !== conversationId),
        ],
        archivedConversations: state.archivedConversations.filter(
          (conv) => conv.id !== conversationId
        ),
      }));
    },

    pinConversation: async (conversationId: string, pinned: boolean) => {
      if (pinned) {
        await http.post(`/api/v1/conversations/${conversationId}/pin`);
      } else {
        await http.delete(`/api/v1/conversations/${conversationId}/pin`);
      }
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? updateConversationState(conv, { isPinned: pinned }) : conv
        ),
        archivedConversations: state.archivedConversations.map((conv) =>
          conv.id === conversationId ? updateConversationState(conv, { isPinned: pinned }) : conv
        ),
      }));
    },

    muteConversation: async (conversationId: string, muted: boolean) => {
      if (muted) {
        await http.post(`/api/v1/conversations/${conversationId}/mute`);
      } else {
        await http.delete(`/api/v1/conversations/${conversationId}/mute`);
      }
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? updateConversationState(conv, {
                isMuted: muted,
                mutedUntil: null,
              })
            : conv
        ),
        archivedConversations: state.archivedConversations.map((conv) =>
          conv.id === conversationId
            ? updateConversationState(conv, {
                isMuted: muted,
                mutedUntil: null,
              })
            : conv
        ),
      }));
    },

    createConversation: (
      userIds: string[],
      options?: { readonly type?: 'secret' | 'cloud' }
    ) => {
      const body: Record<string, unknown> = {
        participant_ids: userIds,
        type: options?.type ?? 'cloud',
      };
      const requestKey = JSON.stringify(body);
      const inFlight = conversationCreatesInFlight.get(requestKey);
      if (inFlight) return inFlight;

      const request = http
        .post('/api/v1/conversations', body)
        .then((response) => {
          const conversation = ensureObject<Conversation>(response.data, 'conversation');
          if (!conversation) {
            throw new Error('Failed to create conversation');
          }

          set((state) => ({
            conversations: [
              conversation,
              ...state.conversations.filter((existing) => existing.id !== conversation.id),
            ].slice(0, 200),
          }));
          return conversation;
        })
        .finally(() => {
          if (conversationCreatesInFlight.get(requestKey) === request) {
            conversationCreatesInFlight.delete(requestKey);
          }
        });

      conversationCreatesInFlight.set(requestKey, request);
      return request;
    },

    /** Add a new conversation from real-time socket event */
    addConversation: (conversation: Conversation) => {
      set((state) => {
        if (state.conversations.some((c) => c.id === conversation.id)) {
          return state;
        }
        return {
          conversations: [conversation, ...state.conversations].slice(0, 200),
        };
      });
    },

    /** Update an existing conversation from real-time socket event */
    updateConversation: (updates: Partial<Conversation> & { id: string }) => {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === updates.id ? { ...conv, ...updates } : conv
        ),
      }));
    },

    /** Get the recipient ID for a direct conversation */
    getRecipientId: (conversationId: string, currentUserId: string): string | null => {
      const { conversations } = get();
      const conversation = conversations.find((c) => c.id === conversationId);

      if (!conversation || conversation.type !== 'direct') {
        return null;
      }

      const recipient = conversation.participants.find((p) => p.userId !== currentUserId);
      return recipient?.userId || null;
    },
  };
}
