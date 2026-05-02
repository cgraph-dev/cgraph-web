/**
 * Chat Store — Thread Slice
 *
 * Manages threaded reply state: active thread, thread messages,
 * reply counts, and thread-specific send.
 *
 * Uses a separate Zustand store to avoid cluttering the main chat store.
 * Thread messages are fetched on-demand when a thread is opened.
 *
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { normalizeToMessage } from './chatStore.normalizers';

const logger = createLogger('ThreadStore');
import type { Message } from './chatStore.types';

interface ThreadState {
  /** The root message of the currently open thread */
  activeThread: Message | null;
  /** Conversation ID of the active thread */
  activeConversationId: string | null;
  /** Messages in the active thread (chronological order) */
  threadMessages: Message[];
  /** Loading flag for thread messages */
  isLoading: boolean;
  /** Whether there are more replies to fetch */
  hasMore: boolean;
  /** Pagination cursor */
  endCursor: string | null;
  /** Per-message reply counts: messageId → count */
  replyCounts: Record<string, number>;

  // Actions
  openThread: (conversationId: string, rootMessage: Message) => Promise<void>;
  closeThread: () => void;
  fetchMoreReplies: () => Promise<void>;
  sendThreadReply: (content: string) => Promise<void>;
  addThreadMessage: (message: Message) => void;
  fetchReplyCounts: (conversationId: string, messageIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useThreadStore = create<ThreadState>()(
  devtools(
    (set, get) => ({
      activeThread: null,
      activeConversationId: null,
      threadMessages: [],
      isLoading: false,
      hasMore: false,
      endCursor: null,
      replyCounts: {},

      openThread: async (conversationId, rootMessage) => {
        set({
          activeThread: rootMessage,
          activeConversationId: conversationId,
          threadMessages: [],
          isLoading: true,
          hasMore: false,
          endCursor: null,
        });

        try {
          const res = await http.get(
            `/api/v1/conversations/${conversationId}/messages/${rootMessage.id}/replies`,
            { params: { limit: 50 } }
          );
          const replies: Message[] = (res.data?.data || [])
            .filter((r: unknown): r is Record<string, unknown> => r instanceof Object)
            .map(normalizeToMessage);

          set({
            threadMessages: replies,
            isLoading: false,
            hasMore: res.data?.meta?.has_more || false,
            endCursor: res.data?.meta?.end_cursor || null,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      closeThread: () => {
        set({
          activeThread: null,
          activeConversationId: null,
          threadMessages: [],
          isLoading: false,
          hasMore: false,
          endCursor: null,
        });
      },

      fetchMoreReplies: async () => {
        const { activeConversationId, activeThread, endCursor, isLoading } = get();
        if (!activeConversationId || !activeThread || isLoading) return;

        set({ isLoading: true });

        try {
          const res = await http.get(
            `/api/v1/conversations/${activeConversationId}/messages/${activeThread.id}/replies`,
            { params: { limit: 50, cursor: endCursor } }
          );
          const newReplies: Message[] = (res.data?.data || [])
            .filter((r: unknown): r is Record<string, unknown> => r instanceof Object)
            .map(normalizeToMessage);

          const MAX_THREAD_MESSAGES = 500;
          set((state) => {
            const merged = [...state.threadMessages, ...newReplies];
            return {
              threadMessages:
                merged.length > MAX_THREAD_MESSAGES
                  ? merged.slice(merged.length - MAX_THREAD_MESSAGES)
                  : merged,
              isLoading: false,
              hasMore: res.data?.meta?.has_more || false,
              endCursor: res.data?.meta?.end_cursor || null,
            };
          });
        } catch {
          set({ isLoading: false });
        }
      },

      sendThreadReply: async (content: string) => {
        const { activeConversationId, activeThread } = get();
        if (!activeConversationId || !activeThread) return;

        try {
          const res = await http.post(`/api/v1/conversations/${activeConversationId}/messages`, {
            content,
            reply_to_id: activeThread.id,
          });
          const msgRaw: unknown = res.data?.data;
          const message: Message = normalizeToMessage(
            msgRaw instanceof Object ? Object.fromEntries(Object.entries(msgRaw)) : {}
          );
          if (message?.id) {
            const MAX_THREAD_MESSAGES = 500;
            set((state) => {
              const updated = [...state.threadMessages, message];
              return {
                threadMessages:
                  updated.length > MAX_THREAD_MESSAGES
                    ? updated.slice(updated.length - MAX_THREAD_MESSAGES)
                    : updated,
                replyCounts: {
                  ...state.replyCounts,
                  [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
                },
              };
            });
          }
        } catch (err) {
          logger.error('Failed to send thread reply', err);
        }
      },

      addThreadMessage: (message: Message) => {
        const { activeThread } = get();
        if (!activeThread || message.replyToId !== activeThread.id) return;

        const MAX_THREAD_MESSAGES = 500;
        set((state) => {
          // Dedup
          if (state.threadMessages.some((m) => m.id === message.id)) return state;
          const updated = [...state.threadMessages, message];
          return {
            threadMessages:
              updated.length > MAX_THREAD_MESSAGES ? updated.slice(-MAX_THREAD_MESSAGES) : updated,
            replyCounts: {
              ...state.replyCounts,
              [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
            },
          };
        });
      },

      fetchReplyCounts: async (conversationId: string, messageIds: string[]) => {
        if (messageIds.length === 0) return;

        try {
          const res = await http.post(`/api/v1/conversations/${conversationId}/thread-counts`, {
            message_ids: messageIds,
          });

          const counts = res.data?.data || {};
          set((state) => ({
            replyCounts: { ...state.replyCounts, ...counts },
          }));
        } catch {
          // Silent fail — counts are non-critical UI decoration
        }
      },
      reset: () =>
        set({
          activeThread: null,
          activeConversationId: null,
          threadMessages: [],
          isLoading: false,
          hasMore: false,
          endCursor: null,
          replyCounts: {},
        }),
    }),
    { name: 'thread-store' }
  )
);
