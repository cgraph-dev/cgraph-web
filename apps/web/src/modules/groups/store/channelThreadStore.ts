/**
 * Channel Thread Store
 *
 * Manages threaded reply state for group channel messages.
 * Separate from the DM thread store since channel threads use
 * different API endpoints.
 *
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChannelThreadStore');
import type { ChannelMessage } from './group-types';

interface ChannelThreadState {
  /** The parent message of the currently open thread */
  activeThread: ChannelMessage | null;
  /** Channel ID of the active thread */
  activeChannelId: string | null;
  /** Replies in the active thread (chronological order) */
  threadReplies: ChannelMessage[];
  /** Loading flag for thread replies */
  isLoading: boolean;
  /** Whether there are more replies to fetch */
  hasMore: boolean;
  /** Per-message reply counts: messageId → count */
  replyCounts: Record<string, number>;
  /** Derived: whether thread panel is open */
  isOpen: boolean;

  // Actions
  openThread: (channelId: string, message: ChannelMessage) => Promise<void>;
  closeThread: () => void;
  sendThreadReply: (content: string) => Promise<void>;
  addThreadReply: (reply: ChannelMessage) => void;
  fetchReplyCounts: (channelId: string, messageIds: string[]) => Promise<void>;
  reset: () => void;
}

/** Type guard: checks that an unknown value has the minimum shape of a ChannelMessage. */
function isChannelMessage(v: unknown): v is ChannelMessage {
  return typeof v === 'object' && v !== null && 'id' in v;
}

export const useChannelThreadStore = create<ChannelThreadState>()(
  devtools(
    (set, get) => ({
      activeThread: null,
      activeChannelId: null,
      threadReplies: [],
      isLoading: false,
      hasMore: false,
      replyCounts: {},
      get isOpen() {
        return get().activeThread !== null;
      },

      openThread: async (channelId, message) => {
        set({
          activeThread: message,
          activeChannelId: channelId,
          threadReplies: [],
          isLoading: true,
          hasMore: false,
        });

        try {
          const res = await http.get(`/api/v1/channels/${channelId}/messages/${message.id}/thread`);
          const replies: ChannelMessage[] = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.replies)
              ? res.data.replies
              : [];

          set({
            threadReplies: replies,
            isLoading: false,
            hasMore: res.data?.meta?.has_more ?? false,
          });
        } catch (error) {
          logger.error('Failed to open thread', error);
          set({ isLoading: false });
        }
      },

      closeThread: () => {
        set({
          activeThread: null,
          activeChannelId: null,
          threadReplies: [],
          isLoading: false,
          hasMore: false,
        });
      },

      sendThreadReply: async (content: string) => {
        const { activeChannelId, activeThread } = get();
        if (!activeChannelId || !activeThread) return;

        try {
          const res = await http.post(`/api/v1/channels/${activeChannelId}/messages`, {
            content,
            reply_to_id: activeThread.id,
          });
          const replyRaw: unknown = res.data?.data ?? res.data?.message ?? res.data;
          const reply: ChannelMessage | null = isChannelMessage(replyRaw) ? replyRaw : null;
          if (reply?.id) {
            set((state) => ({
              threadReplies: [...state.threadReplies, reply],
              replyCounts: {
                ...state.replyCounts,
                [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
              },
            }));
          }
        } catch (error) {
          logger.error('Failed to send channel thread reply', error);
        }
      },

      addThreadReply: (reply: ChannelMessage) => {
        const { activeThread } = get();
        if (!activeThread || reply.replyToId !== activeThread.id) return;

        set((state) => {
          if (state.threadReplies.some((r) => r.id === reply.id)) return state;
          return {
            threadReplies: [...state.threadReplies, reply],
            replyCounts: {
              ...state.replyCounts,
              [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
            },
          };
        });
      },

      fetchReplyCounts: async (channelId: string, messageIds: string[]) => {
        if (messageIds.length === 0) return;

        try {
          const res = await http.post(`/api/v1/channels/${channelId}/thread-counts`, {
            message_ids: messageIds,
          });
          const raw = res.data?.data ?? res.data?.counts;
          const counts: Record<string, number> =
            typeof raw === 'object' && raw !== null && !Array.isArray(raw)
              ? Object.fromEntries(
                  Object.entries(raw).map(([k, v]) => [k, typeof v === 'number' ? v : 0])
                )
              : {};
          set((state) => ({
            replyCounts: { ...state.replyCounts, ...counts },
          }));
        } catch (error) {
          logger.warn('Failed to fetch reply counts', error);
        }
      },

      reset: () =>
        set({
          activeThread: null,
          activeChannelId: null,
          threadReplies: [],
          isLoading: false,
          hasMore: false,
          replyCounts: {},
        }),
    }),
    { name: 'channel-thread-store' }
  )
);
