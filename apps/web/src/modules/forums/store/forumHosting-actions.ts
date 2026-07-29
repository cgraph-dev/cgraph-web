import type { StoreApi } from 'zustand';
import { createLogger } from '@/lib/logger';
const logger = createLogger('forumHostingStore');
import { apiClient } from '@/lib/api-client';
import { mapThreadFromApi, mapPostFromApi, mapMemberFromApi } from './forumHosting-mappers';

/**
 * Narrows an object to `Record<string, unknown>` for mapper consumption.
 * Uses runtime check — safe for any object returned by apiCall/Zod parse.
 */
function toRecord(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value));
}

function mergeUniqueById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map(({ id }) => id));
  return [...current, ...incoming.filter(({ id }) => !seen.has(id))];
}

import type {
  PaginationMeta,
  CreateThreadData,
  CreatePostData,
  UpdatePostData,
  ThreadListOptions,
  PostListOptions,
  MemberListOptions,
  ForumHostingState,
} from './forumHostingStore.types';

/** Creates thread-related actions for the forum hosting store. */
export function createThreadActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchRecentThreads: async (forumId: string, opts: ThreadListOptions = {}) => {
      set({ isLoadingThreads: true });
      const result = await apiClient.forums.listRecentThreads(forumId, {
        limit: opts.limit ?? 20,
        cursor: opts.cursor,
        sort: opts.sort ?? 'latest',
      });
      if (!result.ok) {
        set({ isLoadingThreads: false });
        logger.warn('Failed to fetch recent threads:', result.error.message);
        return;
      }
      const page = result.data.map((thread) => mapThreadFromApi(toRecord(thread)));
      const pageInfo = result.pageInfo;

      set((state) => {
        const threads = opts.cursor ? mergeUniqueById(state.threads, page) : page;
        return {
          threads,
          threadsMeta: {
            cursor: pageInfo?.end_cursor ?? null,
            hasNextPage: pageInfo?.has_next_page ?? page.length >= (opts.limit ?? 20),
            total: pageInfo?.total_count ?? threads.length,
          },
          isLoadingThreads: false,
        };
      });
    },

    fetchThreads: async (boardId: string, opts?: ThreadListOptions) => {
      set({ isLoadingThreads: true });
      const result = await apiClient.forums.listThreads(boardId, opts);
      if (!result.ok) {
        set({ isLoadingThreads: false });
        throw new Error(result.error.message);
      }
      const threads = result.data.map((t) => mapThreadFromApi(toRecord(t)));
      const pi = result.pageInfo;
      const meta: PaginationMeta = {
        cursor: pi?.end_cursor ?? null,
        hasNextPage: pi?.has_next_page ?? threads.length >= (opts?.limit ?? 25),
        total: pi?.total_count ?? threads.length,
      };
      set({ threads, threadsMeta: meta, isLoadingThreads: false });
    },

    fetchThread: async (threadId: string) => {
      const result = await apiClient.forums.getThread(threadId);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'fetchThread');
        throw new Error(result.error.message);
      }
      const thread = mapThreadFromApi(toRecord(result.data));
      set({ currentThread: thread });
      return thread;
    },

    createThread: async (boardId: string, data: CreateThreadData) => {
      const result = await apiClient.forums.createThread(boardId, data);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'createThread');
        throw new Error(result.error.message);
      }
      const thread = mapThreadFromApi(toRecord(result.data));
      const MAX_THREADS = 500;
      set((state) => ({ threads: [thread, ...state.threads].slice(0, MAX_THREADS) }));
      return thread;
    },

    updateThread: async (threadId: string, data: Partial<CreateThreadData>) => {
      const result = await apiClient.forums.updateThread(threadId, data);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'updateThread');
        throw new Error(result.error.message);
      }
      const thread = mapThreadFromApi(toRecord(result.data));
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? thread : t)),
        currentThread: state.currentThread?.id === threadId ? thread : state.currentThread,
      }));
      return thread;
    },

    deleteThread: async (threadId: string) => {
      const result = await apiClient.forums.deleteThread(threadId);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'deleteThread');
        throw new Error(result.error.message);
      }
      set((state) => ({
        threads: state.threads.filter((t) => t.id !== threadId),
        currentThread: state.currentThread?.id === threadId ? null : state.currentThread,
      }));
    },

    pinThread: async (threadId: string, pinned: boolean) => {
      const result = await apiClient.forums.pinThread(threadId, pinned);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'pinThread');
        throw new Error(result.error.message);
      }
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? { ...t, isPinned: pinned } : t)),
        currentThread:
          state.currentThread?.id === threadId
            ? { ...state.currentThread, isPinned: pinned }
            : state.currentThread,
      }));
    },

    lockThread: async (threadId: string, locked: boolean) => {
      const result = await apiClient.forums.lockThread(threadId, locked);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'lockThread');
        throw new Error(result.error.message);
      }
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? { ...t, isLocked: locked } : t)),
        currentThread:
          state.currentThread?.id === threadId
            ? { ...state.currentThread, isLocked: locked }
            : state.currentThread,
      }));
    },

    voteThread: async (threadId: string, value: 1 | -1) => {
      const result = await apiClient.forums.voteThread(threadId, value);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'voteThread');
        throw new Error(result.error.message);
      }
      // Note: The backend returns accurate values, could refetch thread if needed
    },
  };
}

/** Creates post-related actions for the forum hosting store. */
export function createPostActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchPosts: async (threadId: string, opts?: PostListOptions) => {
      set({ isLoadingPosts: true });
      const result = await apiClient.forums.listThreadPosts(threadId, opts);
      if (!result.ok) {
        set({ isLoadingPosts: false });
        throw new Error(result.error.message);
      }
      const posts = result.data.map((p) => mapPostFromApi(toRecord(p)));
      const pi = result.pageInfo;
      const meta: PaginationMeta = {
        cursor: pi?.end_cursor ?? null,
        hasNextPage: pi?.has_next_page ?? posts.length >= (opts?.limit ?? 25),
        total: pi?.total_count ?? posts.length,
      };
      set({ posts, postsMeta: meta, isLoadingPosts: false });
    },

    createPost: async (threadId: string, data: CreatePostData) => {
      const result = await apiClient.forums.createThreadPost(threadId, data);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'createPost');
        throw new Error(result.error.message);
      }
      const post = mapPostFromApi(toRecord(result.data));
      const MAX_POSTS = 500;
      set((state) => ({ posts: [...state.posts, post].slice(-MAX_POSTS) }));
      return post;
    },

    updatePost: async (threadId: string, postId: string, data: UpdatePostData) => {
      const result = await apiClient.forums.updateThreadPost(threadId, postId, data);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'updatePost');
        throw new Error(result.error.message);
      }
      const post = mapPostFromApi(toRecord(result.data));
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? post : p)),
      }));
      return post;
    },

    deletePost: async (threadId: string, postId: string) => {
      const result = await apiClient.forums.deleteThreadPost(threadId, postId);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'deletePost');
        throw new Error(result.error.message);
      }
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
      }));
    },

    votePost: async (postId: string, value: 1 | -1) => {
      // Capture previous state for rollback via functional set
      let previousPosts: ForumHostingState['posts'] | undefined;
      set((state) => {
        previousPosts = state.posts;
        return {
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            let { upvotes, downvotes } = p;
            if (value === 1) upvotes++;
            if (value === -1) downvotes++;
            return { ...p, upvotes, downvotes, score: upvotes - downvotes };
          }),
        };
      });

      const result = await apiClient.forums.voteThreadPost(postId, value);
      if (!result.ok) {
        // Rollback on error
        if (previousPosts) {
          set({ posts: previousPosts });
        }
        logger.error(new Error(result.error.message), 'votePost');
        throw new Error(result.error.message);
      }
    },
  };
}

/** Creates member-related actions for the forum hosting store. */
export function createMemberActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchMembers: async (forumId: string, opts: MemberListOptions = {}) => {
      set({ isLoadingMembers: true });
      const result = await apiClient.forums.listMembers(forumId, opts);
      if (!result.ok) {
        set({ isLoadingMembers: false });
        throw new Error(result.error.message);
      }
      const members = result.data.map((m) => mapMemberFromApi(toRecord(m)));
      const pi = result.pageInfo;
      set((state) => {
        const nextMembers = opts.cursor ? mergeUniqueById(state.members, members) : members;
        return {
          members: nextMembers,
          membersMeta: {
            cursor: pi?.end_cursor ?? null,
            hasNextPage: pi?.has_next_page ?? members.length >= (opts.limit ?? 25),
            total: pi?.total_count ?? nextMembers.length,
          },
          isLoadingMembers: false,
        };
      });
    },
  };
}
