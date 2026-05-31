/**
 * Chat Store — Message Operations
 *
 * Message adding, updating, removing, editing, deletion,
 * and reaction handling (both API and socket-driven).
 *
 */

import { apiClient, http } from '@/lib/api-client';
import { ensureObject, normalizeMessage } from '@/lib/api-utils';
import { findConversationForMessage, updateMessageReactions } from './chatStore.utils';
import { useAuthStore } from '@/modules/auth/store';
import type { Message, Reaction, ChatState, EditHistory } from './chatStore.types';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

function isObjectWithKey<K extends string>(val: unknown, key: K): val is Record<K, unknown> {
  return typeof val === 'object' && val !== null && key in val;
}

/**
 * Type guard: validates that a normalized record has the minimum shape of a Message.
 * The normalizer guarantees all fields are present; this guard satisfies the type system.
 */
function hasMessageShape(val: Record<string, unknown>): boolean {
  return typeof val.id === 'string' && typeof val.content === 'string';
}

/** Extract HTTP status code from an error object (e.g. AxiosError) without type assertion. */
function extractHttpStatus(error: unknown): number | undefined {
  if (!isObjectWithKey(error, 'response')) return undefined;
  const resp = error.response;
  if (!isObjectWithKey(resp, 'status')) return undefined;
  return typeof resp.status === 'number' ? resp.status : undefined;
}

/**
 * Maximum number of messages kept in memory per conversation.
 * When exceeded, the oldest messages are pruned from the front of the array.
 * Users can still fetch older messages via "Load more" (cursor-based pagination).
 */
const MAX_MESSAGES_PER_CONVERSATION = 500;

function compareMessages(left: Message, right: Message): number {
  if (typeof left.sequence === 'number' && typeof right.sequence === 'number') {
    return left.sequence - right.sequence;
  }

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

function isReactionSummary(reaction: Reaction): boolean {
  return (
    typeof reaction.count === 'number' ||
    Array.isArray(reaction.users) ||
    typeof reaction.hasReacted === 'boolean'
  );
}

function reactionUsers(reaction: Reaction): Array<{ id: string; username: string }> {
  if (reaction.users && reaction.users.length > 0) return reaction.users;
  if (reaction.user?.id) return [reaction.user];
  return [];
}

function reactionIncludesUser(
  reaction: Reaction,
  userId: string,
  options: { allowCurrentUserFlag?: boolean } = {}
): boolean {
  if (!userId) return false;
  if (reaction.userId === userId) return true;
  if (reactionUsers(reaction).some((user) => user.id === userId)) return true;
  return options.allowCurrentUserFlag === true && reaction.hasReacted === true;
}

function addUserReaction(
  reactions: Reaction[],
  nextReaction: Reaction,
  options: { allowCurrentUserFlag?: boolean } = {}
): Reaction[] {
  if (
    reactions.some(
      (reaction) =>
        reaction.emoji === nextReaction.emoji &&
        reactionIncludesUser(reaction, nextReaction.userId, options)
    )
  ) {
    return reactions;
  }

  const summaryIndex = reactions.findIndex(
    (reaction) => reaction.emoji === nextReaction.emoji && isReactionSummary(reaction)
  );

  if (summaryIndex === -1) return [...reactions, nextReaction];

  return reactions.map((reaction, index) => {
    if (index !== summaryIndex) return reaction;

    const users = reactionUsers(reaction);
    const nextUsers = users.some((user) => user.id === nextReaction.userId)
      ? users
      : [...users, nextReaction.user];
    const currentCount = Math.max(reaction.count ?? users.length, users.length);

    return {
      ...reaction,
      count: currentCount + 1,
      users: nextUsers,
      hasReacted: options.allowCurrentUserFlag === true ? true : reaction.hasReacted,
    };
  });
}

function removeUserReaction(
  reactions: Reaction[],
  emoji: string,
  userId: string,
  options: { allowCurrentUserFlag?: boolean } = {}
): Reaction[] {
  return reactions.flatMap((reaction): Reaction[] => {
    if (reaction.emoji !== emoji) return [reaction];

    if (!isReactionSummary(reaction)) {
      return reaction.userId === userId ? [] : [reaction];
    }

    if (!reactionIncludesUser(reaction, userId, options)) return [reaction];

    const users = reactionUsers(reaction);
    const nextUsers = users.filter((user) => user.id !== userId);
    const currentCount = Math.max(reaction.count ?? users.length, users.length);
    const nextCount = Math.max(currentCount - 1, 0);
    if (nextCount === 0) return [];

    const nextUser = nextUsers[0] ?? { id: '', username: 'User' };

    return [
      {
        ...reaction,
        userId: nextUser.id,
        user: nextUser,
        count: nextCount,
        users: nextUsers,
        hasReacted: options.allowCurrentUserFlag === true ? false : reaction.hasReacted,
      },
    ];
  });
}

/** Create message-related operations actions for the chat store. */
export function createMessageOpsActions(set: Set, get: Get) {
  return {
    editMessage: async (messageId: string, content: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      // Optimistic: add current content as edit history entry
      const currentMessage = (get().messages[conversationId] || []).find((m) => m.id === messageId);
      if (currentMessage) {
        const currentUserId = useAuthStore.getState().user?.id || '';
        const existingEdits = currentMessage.edits || [];
        const optimisticEdit: EditHistory = {
          id: `optimistic-${Date.now()}`,
          messageId,
          previousContent: currentMessage.content,
          editNumber: existingEdits.length + 1,
          editedById: currentUserId,
          createdAt: new Date().toISOString(),
        };
        get().updateMessage({
          ...currentMessage,
          content,
          isEdited: true,
          edits: [...existingEdits, optimisticEdit],
        });
      }

      const editResult = await apiClient.messaging.edit(conversationId, messageId, content);
      if (!editResult.ok) {
        throw new Error(editResult.error.message);
      }
      const rawMessage: Record<string, unknown> = ensureObject(editResult.data) ?? {};
      {
        // normalizeMessage returns Record<string, unknown> (no Message import to avoid circular dep)
        // Bridge at API boundary: merge normalized fields onto the existing typed Message
        const normalized = normalizeMessage(rawMessage);
        if (hasMessageShape(normalized) && currentMessage) {
          get().updateMessage({
            ...currentMessage,
            content:
              typeof normalized.content === 'string' ? normalized.content : currentMessage.content,
            isEdited:
              typeof normalized.isEdited === 'boolean'
                ? normalized.isEdited
                : currentMessage.isEdited,
            edits: Array.isArray(normalized.edits) ? normalized.edits : currentMessage.edits,
          });
        }
      }
    },

    deleteMessage: async (messageId: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      // Optimistic soft-delete: mark as deleted immediately
      get().markMessageDeleted(messageId);

      const deleteResult = await apiClient.messaging.remove(conversationId, messageId);
      if (!deleteResult.ok) {
        throw new Error(deleteResult.error.message);
      }
    },

    addReaction: async (messageId: string, emoji: string) => {
      // Optimistic update: add reaction to state before API call
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id || '';
      const username = currentUser?.username || 'User';
      const previousMessages = { ...get().messages };

      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) => {
          const newReaction: Reaction = {
            id: `${messageId}-${emoji}-${userId}`,
            emoji,
            userId,
            user: { id: userId, username },
          };
          return addUserReaction(reactions, newReaction, { allowCurrentUserFlag: true });
        });
        return { messages: { ...state.messages, ...updatedMessages } };
      });

      try {
        await http.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      } catch (error: unknown) {
        // Don't rollback on 422 — likely means reaction already exists on server
        const status = extractHttpStatus(error);
        if (status === 422 || status === 409) {
          // Optimistic state is correct, server already has this reaction
          return;
        }
        // Rollback on other errors (network, 5xx, etc.)
        set({ messages: previousMessages });
        throw error;
      }
    },

    removeReaction: async (messageId: string, emoji: string) => {
      // Optimistic update: remove reaction from state before API call
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id || '';
      const previousMessages = { ...get().messages };

      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) =>
          removeUserReaction(reactions, emoji, userId, { allowCurrentUserFlag: true })
        );
        return { messages: { ...state.messages, ...updatedMessages } };
      });

      try {
        await http.delete(`/api/v1/messages/${messageId}/reactions/${emoji}`);
      } catch (error: unknown) {
        // Don't rollback on 404/422 — reaction may already be removed on server
        const status = extractHttpStatus(error);
        if (status === 404 || status === 422) {
          return;
        }
        // Rollback on other errors
        set({ messages: previousMessages });
        throw error;
      }
    },

    addMessage: (message: Message) => {
      // Use queueMicrotask to batch rapid message updates
      queueMicrotask(() => {
        set((state) => {
          const conversationMessages = state.messages[message.conversationId] || [];
          const idSet = state.messageIdSets[message.conversationId] || new Set<string>();
          const currentUserId = useAuthStore.getState().user?.id || '';

          const optimisticMatch =
            typeof message.clientMessageId === 'string'
              ? conversationMessages.find(
                  (existingMessage) =>
                    existingMessage.id === message.clientMessageId ||
                    existingMessage.clientMessageId === message.clientMessageId
                )
              : undefined;

          const normalizedMessage =
            optimisticMatch && message.isEncrypted && message.senderId === currentUserId
              ? { ...message, content: optimisticMatch.content }
              : message;

          const baseMessages = optimisticMatch
            ? conversationMessages.filter((existingMessage) => existingMessage.id !== optimisticMatch.id)
            : conversationMessages;

          // O(1) deduplication check
          if (idSet.has(normalizedMessage.id)) {
            return state;
          }

          const newIdSet = new Set(idSet);
          if (optimisticMatch) {
            newIdSet.delete(optimisticMatch.id);
          }
          newIdSet.add(normalizedMessage.id);

          // Append the new message
          let updatedMessages = [...baseMessages, normalizedMessage].sort(compareMessages);

          // Prune oldest messages if we exceed the cap
          if (updatedMessages.length > MAX_MESSAGES_PER_CONVERSATION) {
            const pruneCount = updatedMessages.length - MAX_MESSAGES_PER_CONVERSATION;
            const pruned = updatedMessages.slice(0, pruneCount);
            updatedMessages = updatedMessages.slice(pruneCount);
            // Remove pruned IDs from the dedup set
            for (const p of pruned) {
              newIdSet.delete(p.id);
            }
          }

          // Only update lastMessage if this is the newest message
          const shouldUpdateLastMessage =
            !state.conversations.find((c) => c.id === normalizedMessage.conversationId)?.lastMessage ||
            new Date(normalizedMessage.createdAt) >
              new Date(
                state.conversations.find((c) => c.id === normalizedMessage.conversationId)?.lastMessage
                  ?.createdAt || 0
              );

          return {
            messages: {
              ...state.messages,
              [normalizedMessage.conversationId]: updatedMessages,
            },
            messageIdSets: {
              ...state.messageIdSets,
              [normalizedMessage.conversationId]: newIdSet,
            },
            conversations: shouldUpdateLastMessage
              ? state.conversations.map((conv) =>
                  conv.id === normalizedMessage.conversationId
                    ? {
                        ...conv,
                        lastMessage: normalizedMessage,
                        updatedAt: normalizedMessage.createdAt,
                      }
                    : conv
                )
              : state.conversations,
          };
        });
      });
    },

    updateMessage: (message: Message) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [message.conversationId]: (state.messages[message.conversationId] || []).map((m) =>
            m.id === message.id ? message : m
          ),
        },
      }));
    },

    removeMessage: (messageId: string, conversationId: string) => {
      set((state) => {
        const idSet = state.messageIdSets[conversationId];
        if (idSet) {
          const newIdSet = new Set(idSet);
          newIdSet.delete(messageId);
          return {
            messages: {
              ...state.messages,
              [conversationId]: (state.messages[conversationId] || []).filter(
                (m) => m.id !== messageId
              ),
            },
            messageIdSets: {
              ...state.messageIdSets,
              [conversationId]: newIdSet,
            },
          };
        }
        return {
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(
              (m) => m.id !== messageId
            ),
          },
        };
      });
    },

    /** Soft-delete a message: mark as deleted without removing from the array. */
    markMessageDeleted: (messageId: string) => {
      set((state) => {
        const newMessages = { ...state.messages };
        for (const [convId, msgs] of Object.entries(newMessages)) {
          const idx = msgs.findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            const updated = [...msgs];
            const existing = updated[idx];
            if (!existing) return state;
            updated[idx] = {
              ...existing,
              deletedAt: new Date().toISOString(),
              content: '',
            };
            newMessages[convId] = updated;
            return { messages: newMessages };
          }
        }
        return state;
      });
    },

    /** Add a reaction to a message (from socket event) */
    addReactionToMessage: (messageId: string, emoji: string, userId: string, username?: string) => {
      set((state) => {
        const isCurrentUser = userId === useAuthStore.getState().user?.id;
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) => {
          const newReaction: Reaction = {
            id: `${messageId}-${emoji}-${userId}`,
            emoji,
            userId,
            user: { id: userId, username: username || 'User' },
          };
          return addUserReaction(reactions, newReaction, {
            allowCurrentUserFlag: isCurrentUser,
          });
        });
        return { messages: { ...state.messages, ...updatedMessages } };
      });
    },

    /** Remove a reaction from a message (from socket event) */
    removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => {
      set((state) => {
        const isCurrentUser = userId === useAuthStore.getState().user?.id;
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) =>
          removeUserReaction(reactions, emoji, userId, {
            allowCurrentUserFlag: isCurrentUser,
          })
        );
        return { messages: { ...state.messages, ...updatedMessages } };
      });
    },

    /** Update a message's delivery status in the conversation's message array. */
    updateMessageStatus: (
      conversationId: string,
      messageId: string,
      status: Message['deliveryStatus']
    ) => {
      set((state) => {
        const conversationMessages = state.messages[conversationId];
        if (!conversationMessages) return state;

        return {
          messages: {
            ...state.messages,
            [conversationId]: conversationMessages.map((m) =>
              m.id === messageId ? { ...m, deliveryStatus: status } : m
            ),
          },
        };
      });
    },

    /** Add a read receipt and update message status to 'read' if reader is the conversation partner. */
    addReadReceipt: (conversationId: string, messageId: string, userId: string, readAt: string) => {
      set((state) => {
        // Update readReceipts record
        const messageReceipts = state.readReceipts[messageId] || {};
        const updatedReceipts = {
          ...state.readReceipts,
          [messageId]: { ...messageReceipts, [userId]: readAt },
        };

        // Also update the message's deliveryStatus to 'read' if the reader is not the sender
        const conversationMessages = state.messages[conversationId];
        if (!conversationMessages) {
          return { readReceipts: updatedReceipts };
        }

        const currentUserId = useAuthStore.getState().user?.id;
        return {
          readReceipts: updatedReceipts,
          messages: {
            ...state.messages,
            [conversationId]: conversationMessages.map((m) => {
              if (m.id === messageId && m.senderId === currentUserId && userId !== currentUserId) {
                return { ...m, deliveryStatus: 'read' as const };
              }
              return m;
            }),
          },
        };
      });
    },
  };
}
