import { createLogger } from '@/lib/logger';
import { http, apiClient } from './forumStore.utils';
import type { ForumState } from './forumStore.types';

const logger = createLogger('ForumStore:Moderation');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create moderation-related actions for the forum store. */
export function createModerationActions(set: Set, _get: Get) {
  return {
    pinPost: async (forumId: string, postId: string) => {
      try {
        const result = await apiClient.forums.pinPost(forumId, postId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: true } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isPinned: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'pinPost');
        throw error;
      }
    },

    unpinPost: async (forumId: string, postId: string) => {
      try {
        const result = await apiClient.forums.unpinPost(forumId, postId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: false } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isPinned: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'unpinPost');
        throw error;
      }
    },

    lockPost: async (forumId: string, postId: string) => {
      try {
        const result = await apiClient.forums.lockPost(forumId, postId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: true } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isLocked: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'lockPost');
        throw error;
      }
    },

    unlockPost: async (forumId: string, postId: string) => {
      try {
        const result = await apiClient.forums.unlockPost(forumId, postId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: false } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isLocked: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'unlockPost');
        throw error;
      }
    },

    deletePost: async (_forumId: string, postId: string) => {
      try {
        const result = await apiClient.forums.deletePost(postId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          currentPost: state.currentPost?.id === postId ? null : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deletePost');
        throw error;
      }
    },

    moveThread: async (
      threadId: string,
      targetBoardId: string,
      leaveRedirect = true,
      redirectDays = 30
    ) => {
      try {
        await http.post(`/api/v1/threads/${threadId}/move`, {
          target_board_id: targetBoardId,
          leave_redirect: leaveRedirect,
          redirect_days: redirectDays,
        });
        set((state) => ({ posts: state.posts.filter((p) => p.id !== threadId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'moveThread');
        throw error;
      }
    },

    splitThread: async (threadId: string, postIds: string[], newTitle: string) => {
      try {
        const response = await http.post(`/api/v1/posts/${threadId}/split`, {
          post_ids: postIds,
          new_title: newTitle,
        });
        return response.data.new_thread_id;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'splitThread');
        throw error;
      }
    },

    mergeThreads: async (sourceThreadId: string, targetThreadId: string) => {
      try {
        await http.post(`/api/v1/posts/${sourceThreadId}/merge`, {
          target_thread_id: targetThreadId,
        });
        set((state) => ({ posts: state.posts.filter((p) => p.id !== sourceThreadId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'mergeThreads');
        throw error;
      }
    },

    closeThread: async (threadId: string) => {
      try {
        await http.post(`/api/v1/posts/${threadId}/close`);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === threadId ? { ...p, isLocked: true, isClosed: true } : p
          ),
          currentPost:
            state.currentPost?.id === threadId
              ? { ...state.currentPost, isLocked: true, isClosed: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'closeThread');
        throw error;
      }
    },

    reopenThread: async (threadId: string) => {
      try {
        await http.post(`/api/v1/posts/${threadId}/reopen`);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === threadId ? { ...p, isLocked: false, isClosed: false } : p
          ),
          currentPost:
            state.currentPost?.id === threadId
              ? { ...state.currentPost, isLocked: false, isClosed: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'reopenThread');
        throw error;
      }
    },

    addToMultiQuote: (postId: string) => {
      set((state) => ({
        multiQuoteBuffer: state.multiQuoteBuffer.includes(postId)
          ? state.multiQuoteBuffer
          : [...state.multiQuoteBuffer, postId].slice(-20),
      }));
    },

    removeFromMultiQuote: (postId: string) => {
      set((state) => ({
        multiQuoteBuffer: state.multiQuoteBuffer.filter((id) => id !== postId),
      }));
    },

    clearMultiQuote: () => set({ multiQuoteBuffer: [] }),

    fetchForumModQueue: async (forumId: string, status = 'pending') => {
      try {
        const response = await http.get(
          `/api/v1/forums/${forumId}/moderation/queue?status=${status}`
        );
        return response.data?.data || [];
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchForumModQueue'
        );
        throw error;
      }
    },

    takeForumModAction: async (
      forumId: string,
      postId: string,
      action: 'approve' | 'remove' | 'hide'
    ) => {
      try {
        await http.post(`/api/v1/forums/${forumId}/moderation/action`, {
          post_id: postId,
          action,
        });
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'takeForumModAction'
        );
        throw error;
      }
    },

    issueWarning: async (forumId: string, userId: string, reason: string, points: number) => {
      try {
        const response = await http.post(`/api/v1/forums/${forumId}/moderation/warn`, {
          user_id: userId,
          reason,
          points,
        });
        return response.data?.warning;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'issueWarning');
        throw error;
      }
    },

    fetchForumAutomod: async (forumId: string) => {
      try {
        const response = await http.get(`/api/v1/forums/${forumId}/moderation/automod`);
        return response.data?.data || {};
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchForumAutomod'
        );
        throw error;
      }
    },

    updateForumAutomod: async (forumId: string, rules: Record<string, unknown>) => {
      try {
        const response = await http.put(`/api/v1/forums/${forumId}/moderation/automod`, rules);
        return response.data?.data || {};
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'updateForumAutomod'
        );
        throw error;
      }
    },

    fetchForumModStats: async (forumId: string) => {
      try {
        const response = await http.get(`/api/v1/forums/${forumId}/moderation/stats`);
        return response.data?.data || { pending_count: 0, resolved_count: 0 };
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchForumModStats'
        );
        throw error;
      }
    },
  };
}
