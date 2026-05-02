/**
 * Forum Store — Forum CRUD & Discovery Actions
 *
 * Create/update/delete forums, subscribe/unsubscribe,
 * leaderboard and top forums.
 *
 */

import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { mapForumFromApi, ensureArray } from './forumStore.utils';
import type {
  CreateForumData,
  UpdateForumData,
  ForumState,
  LeaderboardSort,
} from './forumStore.types';

const logger = createLogger('ForumStore:ForumCrud');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create forum CRUD and discovery actions for the forum store. */
export function createForumCrudActions(set: Set, get: Get) {
  return {
    subscribe: async (forumId: string) => {
      const result = await apiClient.forums.subscribeForum(forumId);
      if (!result.ok) throw new Error(result.error.message);
      set((state) => ({
        forums: state.forums.map((f) =>
          f.id === forumId ? { ...f, isSubscribed: true, memberCount: f.memberCount + 1 } : f
        ),
      }));
    },

    unsubscribe: async (forumId: string) => {
      const result = await apiClient.forums.unsubscribeForum(forumId);
      if (!result.ok) throw new Error(result.error.message);
      set((state) => ({
        forums: state.forums.map((f) =>
          f.id === forumId ? { ...f, isSubscribed: false, memberCount: f.memberCount - 1 } : f
        ),
      }));
    },

    fetchLeaderboard: async (sort: LeaderboardSort = 'hot', cursor: string | null = null) => {
      set({ isLoadingLeaderboard: true });
      try {
        const params = { sort, limit: 25, ...(cursor ? { cursor } : {}) };
        const result = await apiClient.forums.getLeaderboard(params);
        if (!result.ok) throw new Error(result.error.message);
        const rawForums = ensureArray<Record<string, unknown>>(result.data, 'data');
        const forums = rawForums.map(mapForumFromApi);
        const pageInfo = result.data.page_info;

        set({
          leaderboard: cursor === null ? forums : [...get().leaderboard, ...forums].slice(-500),
          leaderboardMeta: {
            cursor: typeof pageInfo?.end_cursor === 'string' ? pageInfo.end_cursor : null,
            hasNextPage:
              typeof pageInfo?.has_next_page === 'boolean' ? pageInfo.has_next_page : false,
            total: typeof pageInfo?.total_count === 'number' ? pageInfo.total_count : forums.length,
            sort,
          },
          isLoadingLeaderboard: false,
        });
      } catch (error: unknown) {
        set({ isLoadingLeaderboard: false });
        throw error;
      }
    },

    fetchTopForums: async (limit = 10, sort: LeaderboardSort = 'hot') => {
      const result = await apiClient.forums.getTopForums({ limit, sort });
      if (!result.ok) throw new Error(result.error.message);
      const forums = Array.from(result.data).map(mapForumFromApi);
      set({ topForums: forums });
    },

    createForum: async (data: CreateForumData) => {
      try {
        const result = await apiClient.forums.createForum({
          name: data.name,
          description: data.description,
          is_nsfw: data.isNsfw,
          is_private: data.isPrivate,
          category_id: data.categoryId,
          tags: data.tags,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
          allow_polls: data.allowPolls,
          allow_attachments: data.allowAttachments,
          require_approval: data.requireApproval,
        });
        if (!result.ok) throw new Error(result.error.message);
        const forum = mapForumFromApi(result.data);
        set((state) => ({ forums: [forum, ...state.forums] }));
        return forum;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'createForum');
        throw error;
      }
    },

    updateForum: async (forumId: string, data: UpdateForumData) => {
      try {
        const result = await apiClient.forums.updateForum(forumId, {
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          is_nsfw: data.isNsfw,
          icon_url: data.iconUrl,
          banner_url: data.bannerUrl,
          custom_css: data.customCss,
        });
        if (!result.ok) throw new Error(result.error.message);
        const mapped = mapForumFromApi(result.data);
        set((state) => ({ forums: state.forums.map((f) => (f.id === forumId ? mapped : f)) }));
        return mapped;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'updateForum');
        throw error;
      }
    },

    deleteForum: async (forumId: string) => {
      try {
        const result = await apiClient.forums.deleteForum(forumId);
        if (!result.ok) throw new Error(result.error.message);
        set((state) => ({ forums: state.forums.filter((f) => f.id !== forumId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteForum');
        throw error;
      }
    },
  };
}
