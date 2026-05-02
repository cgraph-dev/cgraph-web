import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import {
  mapForumFromApi,
  normalizeComment,
  normalizePost,
  normalizeForumSearchResult,
} from './forumStore.utils';
import type {
  Forum,
  Post,
  Comment,
  CreatePostData,
  ForumState,
  ForumSearchFilters,
  ForumSearchResult,
} from './forumStore.types';

const logger = createLogger('ForumStore:Core');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Data-only (non-action) fields of ForumState, used for initialization and reset. */
type ForumDataState = Pick<
  ForumState,
  | 'forums'
  | 'posts'
  | 'currentPost'
  | 'currentForum'
  | 'comments'
  | 'subscribedForums'
  | 'leaderboard'
  | 'leaderboardMeta'
  | 'topForums'
  | 'isLoadingForums'
  | 'isLoadingPosts'
  | 'isLoadingComments'
  | 'isLoadingLeaderboard'
  | 'hasMorePosts'
  | 'sortBy'
  | 'timeRange'
  | 'threadPrefixes'
  | 'subscriptions'
  | 'userGroups'
  | 'moderationQueue'
  | 'reports'
  | 'multiQuoteBuffer'
  | 'searchResults'
  | 'searchQuery'
  | 'searchFilters'
  | 'searchLoading'
  | 'searchHasMore'
  | 'searchCursor'
>;

/** Initial state values for the forum store. */
export const forumInitialState: ForumDataState = {
  forums: [],
  posts: [],
  currentPost: null,
  currentForum: null,
  comments: {},
  subscribedForums: [],
  leaderboard: [],
  leaderboardMeta: null,
  topForums: [],
  isLoadingForums: false,
  isLoadingPosts: false,
  isLoadingComments: false,
  isLoadingLeaderboard: false,
  hasMorePosts: true,
  sortBy: 'hot',
  timeRange: 'day',
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  moderationQueue: [],
  reports: [],
  multiQuoteBuffer: [],
  searchResults: [],
  searchQuery: '',
  searchFilters: {},
  searchLoading: false,
  searchHasMore: false,
  searchCursor: undefined,
};

function toVote(v: unknown): 1 | -1 | 0 {
  if (v === 1 || v === -1) return v;
  return 0;
}

/** Create core CRUD + voting actions for the forum store. */
export function createCoreActions(set: Set, get: Get) {
  return {
    fetchForums: async () => {
      set({ isLoadingForums: true });
      const result = await apiClient.forums.listForums();
      if (!result.ok) {
        set({ isLoadingForums: false });
        logger.error(new Error(result.error.message), 'fetchForums');
        return;
      }
      const forums = result.data.map((f) => mapForumFromApi(Object.fromEntries(Object.entries(f))));
      set({ forums, isLoadingForums: false });
    },

    fetchForum: async (slug: string) => {
      const result = await apiClient.forums.getForum(slug);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'fetchForum');
        throw new Error(result.error.message);
      }
      const forum = mapForumFromApi(Object.fromEntries(Object.entries(result.data)));
      set((state) => ({
        currentForum: forum,
        forums: state.forums.some((f) => f.id === forum.id)
          ? state.forums.map((f) => (f.id === forum.id ? forum : f))
          : [...state.forums, forum].slice(-200),
      }));
      return forum;
    },

    fetchPosts: async (forumSlug?: string, cursor: string | null = null) => {
      set({ isLoadingPosts: true });
      const { sortBy, timeRange } = get();
      const params = {
        sort: sortBy,
        limit: 25,
        ...(cursor ? { cursor } : {}),
        ...(sortBy === 'top' ? { time: timeRange } : {}),
      };
      const result = await apiClient.forums.listPosts(forumSlug, params);
      if (!result.ok) {
        set({ isLoadingPosts: false });
        logger.error(new Error(result.error.message), 'fetchPosts');
        throw new Error(result.error.message);
      }
      const page = result.data;
      const rawPostsArr: unknown[] = Array.isArray(page.posts ?? page.data ?? [])
        ? [...(page.posts ?? page.data ?? [])]
        : [];
      const newPosts: Post[] = rawPostsArr
        .filter((p): p is Record<string, unknown> => p instanceof Object)
        .map((p) => normalizePost(p));
      const hasNextPage = page.page_info?.has_next_page ?? newPosts.length === 25;
      const MAX_POSTS = 500;
      set((state) => {
        const merged = cursor === null ? newPosts : [...state.posts, ...newPosts];
        return {
          posts: merged.length > MAX_POSTS ? merged.slice(merged.length - MAX_POSTS) : merged,
          hasMorePosts: hasNextPage,
          isLoadingPosts: false,
        };
      });
    },

    fetchPost: async (postId: string) => {
      const result = await apiClient.forums.getPost(postId);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'fetchPost');
        return;
      }
      const rawPost = result.data;
      const postRec: Record<string, unknown> =
        rawPost instanceof Object ? Object.fromEntries(Object.entries(rawPost)) : {};
      const currentPost: Post = normalizePost(postRec);
      set({ currentPost });
    },

    fetchComments: async (postId: string) => {
      set({ isLoadingComments: true });
      const result = await apiClient.forums.listComments(postId);
      if (!result.ok) {
        set({ isLoadingComments: false });
        logger.error(new Error(result.error.message), 'fetchComments');
        throw new Error(result.error.message);
      }
      const MAX_COMMENTS_PER_POST = 500;
      const MAX_COMMENT_POSTS = 50;
      const rawComments: unknown[] = Array.isArray(result.data) ? [...result.data] : [];
      const newComments: Comment[] = rawComments
        .filter((c): c is Record<string, unknown> => c instanceof Object)
        .map((c) => normalizeComment(c, postId));
      set((state) => {
        const updated = {
          ...state.comments,
          [postId]:
            newComments.length > MAX_COMMENTS_PER_POST
              ? newComments.slice(0, MAX_COMMENTS_PER_POST)
              : newComments,
        };
        // Evict oldest post comment entries if the dict grows too large
        const keys = Object.keys(updated);
        if (keys.length > MAX_COMMENT_POSTS) {
          const toRemove = keys.slice(0, keys.length - MAX_COMMENT_POSTS);
          for (const key of toRemove) {
            delete updated[key];
          }
        }
        return { comments: updated, isLoadingComments: false };
      });
    },

    createPost: async (data: CreatePostData) => {
      const payload: Record<string, unknown> = {
        forum_id: data.forumId,
        title: data.title,
        content: data.content,
        post_type: data.postType,
        link_url: data.linkUrl,
        media_urls: data.mediaUrls,
        category_id: data.categoryId,
        is_nsfw: data.isNsfw,
      };

      if (data.prefixId) payload.prefix_id = data.prefixId;
      if (data.attachmentIds?.length) payload.attachment_ids = data.attachmentIds;

      if (data.postType === 'poll' && data.poll) {
        payload.poll = {
          question: data.poll.question,
          options: data.poll.options.filter((opt) => opt.trim() !== ''),
          allow_multiple: data.poll.allowMultiple || false,
          is_public: data.poll.isPublic || false,
          expires_at: data.poll.expiresAt,
        };
      }

      const result = await apiClient.forums.createPostDirect(payload);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'createPost');
        throw new Error(result.error.message);
      }
      const rawPost = result.data;
      const postRec: Record<string, unknown> =
        rawPost instanceof Object ? Object.fromEntries(Object.entries(rawPost)) : {};
      const post: Post = normalizePost(
        postRec,
        typeof data.forumId === 'string' ? data.forumId : ''
      );
      set((state) => ({ posts: [post, ...state.posts] }));
      return post;
    },

    createComment: async (postId: string, content: string, parentId?: string) => {
      const result = await apiClient.forums.createComment(postId, {
        content,
        parent_id: parentId,
      });
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'createComment');
        throw new Error(result.error.message);
      }
      const rawComment = result.data;
      const commentRec: Record<string, unknown> =
        rawComment instanceof Object ? Object.fromEntries(Object.entries(rawComment)) : {};
      const comment: Comment = normalizeComment(commentRec, postId);
      const MAX_COMMENTS_PER_POST = 500;
      set((state) => {
        const postComments = state.comments[postId] || [];
        if (parentId) {
          return { comments: { ...state.comments, [postId]: postComments } };
        }
        const updated = [comment, ...postComments];
        return {
          comments: {
            ...state.comments,
            [postId]:
              updated.length > MAX_COMMENTS_PER_POST
                ? updated.slice(0, MAX_COMMENTS_PER_POST)
                : updated,
          },
        };
      });
      return comment;
    },

    vote: async (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => {
      const previousPosts = get().posts;
      const previousCurrentPost = get().currentPost;

      if (type === 'post') {
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== id) return p;
            const oldVote = p.myVote;
            let upvotes = p.upvotes;
            let downvotes = p.downvotes;
            if (oldVote === 1) upvotes--;
            if (oldVote === -1) downvotes--;
            if (value === 1) upvotes++;
            if (value === -1) downvotes++;
            return { ...p, myVote: value, upvotes, downvotes, score: upvotes - downvotes };
          }),
          currentPost:
            state.currentPost?.id === id
              ? { ...state.currentPost, myVote: value }
              : state.currentPost,
        }));
      }

      let result;
      if (type === 'post') {
        result =
          value === null
            ? await apiClient.forums.unvotePost(id)
            : await apiClient.forums.votePost(id, value);
      } else {
        result =
          value === null
            ? await apiClient.forums.unvoteComment(id)
            : await apiClient.forums.voteComment(id, value);
      }

      if (!result.ok) {
        if (type === 'post') {
          set({ posts: previousPosts, currentPost: previousCurrentPost });
        }
        logger.error(new Error(result.error.message), 'vote');
        throw new Error(result.error.message);
      }
    },

    voteForum: async (forumId: string, value: 1 | -1) => {
      const result = await apiClient.forums.voteForum(forumId, value);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'voteForum');
        throw new Error(result.error.message);
      }
      const voteData = result.data.forum;

      const updateForum = (forum: Forum) => {
        if (forum.id !== forumId) return forum;
        return {
          ...forum,
          score: voteData.score ?? forum.score ?? 0,
          upvotes: voteData.upvotes ?? forum.upvotes ?? 0,
          downvotes: voteData.downvotes ?? forum.downvotes ?? 0,
          userVote: toVote(voteData.user_vote ?? voteData.userVote ?? 0),
        };
      };

      set((state) => ({
        forums: state.forums.map(updateForum),
        leaderboard: state.leaderboard.map(updateForum),
        topForums: state.topForums.map(updateForum),
      }));
    },

    setSortBy: (sort: ForumState['sortBy']) => set({ sortBy: sort, posts: [], hasMorePosts: true }),
    setTimeRange: (range: ForumState['timeRange']) =>
      set({ timeRange: range, posts: [], hasMorePosts: true }),

    searchForums: async (query: string, filters?: ForumSearchFilters) => {
      set({ searchLoading: true, searchQuery: query, searchFilters: filters || {} });
      const result = await apiClient.forums.searchForums({
        q: query,
        ...(filters?.type && filters.type !== 'all' ? { type: filters.type } : {}),
        ...(filters?.forumId ? { forum_id: filters.forumId } : {}),
        ...(filters?.boardId ? { board_id: filters.boardId } : {}),
        ...(filters?.authorId ? { author_id: filters.authorId } : {}),
        ...(filters?.dateFrom ? { date_from: filters.dateFrom } : {}),
        ...(filters?.dateTo ? { date_to: filters.dateTo } : {}),
        ...(filters?.sort ? { sort: filters.sort } : {}),
      });
      if (!result.ok) {
        set({ searchLoading: false });
        logger.error(new Error(result.error.message), 'searchForums');
        throw new Error(result.error.message);
      }
      const page = result.data;
      const rawResultsArr: unknown[] = Array.isArray(page.data ?? page.results ?? [])
        ? [...(page.data ?? page.results ?? [])]
        : [];
      const results: ForumSearchResult[] = rawResultsArr
        .filter((r): r is Record<string, unknown> => r instanceof Object)
        .map(normalizeForumSearchResult);
      const nextCursor = page.page_info?.end_cursor ?? undefined;
      const hasMore = page.page_info?.has_next_page ?? false;
      set({
        searchResults: results,
        searchCursor: nextCursor ?? undefined,
        searchHasMore: hasMore,
        searchLoading: false,
      });
    },

    searchMore: async () => {
      const { searchQuery, searchFilters, searchCursor, searchHasMore } = get();
      if (!searchHasMore || !searchCursor) return;
      set({ searchLoading: true });
      const result = await apiClient.forums.searchForums({
        q: searchQuery,
        cursor: searchCursor,
        ...(searchFilters?.type && searchFilters.type !== 'all'
          ? { type: searchFilters.type }
          : {}),
        ...(searchFilters?.forumId ? { forum_id: searchFilters.forumId } : {}),
      });
      if (!result.ok) {
        set({ searchLoading: false });
        logger.error(new Error(result.error.message), 'searchMore');
        throw new Error(result.error.message);
      }
      const page = result.data;
      const rawMoreArr: unknown[] = Array.isArray(page.data ?? page.results ?? [])
        ? [...(page.data ?? page.results ?? [])]
        : [];
      const results: ForumSearchResult[] = rawMoreArr
        .filter((r): r is Record<string, unknown> => r instanceof Object)
        .map(normalizeForumSearchResult);
      const nextCursor = page.page_info?.end_cursor ?? undefined;
      const hasMore = page.page_info?.has_next_page ?? false;
      const MAX_SEARCH_RESULTS = 500;
      set((state) => {
        const merged = [...state.searchResults, ...results];
        return {
          searchResults:
            merged.length > MAX_SEARCH_RESULTS ? merged.slice(0, MAX_SEARCH_RESULTS) : merged,
          searchCursor: nextCursor ?? undefined,
          searchHasMore: merged.length < MAX_SEARCH_RESULTS && hasMore,
          searchLoading: false,
        };
      });
    },

    clearSearch: () =>
      set({
        searchResults: [],
        searchQuery: '',
        searchFilters: {},
        searchCursor: undefined,
        searchHasMore: false,
      }),

    editComment: async (postId: string, commentId: string, content: string) => {
      const result = await apiClient.forums.putComment(commentId, { content });
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'editComment');
        throw new Error(result.error.message);
      }
      const updatedRaw = result.data;
      const updatedRec: Record<string, unknown> =
        updatedRaw instanceof Object ? Object.fromEntries(Object.entries(updatedRaw)) : {};
      const updated: Comment = normalizeComment(updatedRec, postId);
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] || []).map((c) =>
            c.id === commentId ? { ...c, ...updated } : c
          ),
        },
      }));
    },

    deleteComment: async (postId: string, commentId: string) => {
      const result = await apiClient.forums.deleteComment(commentId);
      if (!result.ok) {
        logger.error(new Error(result.error.message), 'deleteComment');
        throw new Error(result.error.message);
      }
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] || []).filter((c) => c.id !== commentId),
        },
      }));
    },
  };
}
