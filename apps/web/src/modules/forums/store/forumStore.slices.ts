import type {
  Ban,
  Comment,
  CreateBanData,
  CreatePollData,
  CreatePostData,
  CreateReportData,
  CreateThreadPrefixData,
  Forum,
  ForumCategory,
  ForumSearchFilters,
  ForumSearchResult,
  ForumState,
  LeaderboardMeta,
  LeaderboardSort,
  ModerationQueueItem,
  PollOption,
  Post,
  PostAttachment,
  PostEditHistory,
  Report,
  SortOption,
  ThreadPrefix,
  ThreadRating,
  TimeRange,
  UserWarning,
} from './forumStore.types';

export interface ForumListSliceState {
  readonly forums: readonly Forum[];
  readonly subscribedForums: readonly Forum[];
  readonly leaderboard: readonly Forum[];
  readonly leaderboardMeta: LeaderboardMeta | null;
  readonly topForums: readonly Forum[];
  readonly isLoadingForums: boolean;
  readonly isLoadingLeaderboard: boolean;
  readonly sortBy: SortOption;
  readonly timeRange: TimeRange;
  readonly searchResults: readonly ForumSearchResult[];
  readonly searchQuery: string;
  readonly searchFilters: ForumSearchFilters;
  readonly searchLoading: boolean;
  readonly searchHasMore: boolean;
  readonly searchCursor: string | undefined;

  fetchForums: () => Promise<void>;
  fetchLeaderboard: (sort?: LeaderboardSort, cursor?: string | null) => Promise<void>;
  fetchTopForums: (limit?: number, sort?: LeaderboardSort) => Promise<void>;
  subscribe: (forumId: string) => Promise<void>;
  unsubscribe: (forumId: string) => Promise<void>;
  setSortBy: (sort: SortOption) => void;
  setTimeRange: (range: TimeRange) => void;
  searchForums: (query: string, filters?: ForumSearchFilters) => Promise<void>;
  searchMore: () => Promise<void>;
  clearSearch: () => void;
}

export interface ForumDetailSliceState {
  readonly currentForum: Forum | null;
  readonly currentPost: Post | null;
  readonly posts: readonly Post[];
  readonly comments: Readonly<Record<string, readonly Comment[]>>;
  readonly threadPrefixes: readonly ThreadPrefix[];
  readonly isLoadingPosts: boolean;
  readonly isLoadingComments: boolean;
  readonly hasMorePosts: boolean;

  fetchForum: (slug: string) => Promise<Forum>;
  fetchPosts: (forumSlug?: string, cursor?: string | null) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<Comment>;
  editComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  vote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
  voteForum: (forumId: string, value: 1 | -1) => Promise<void>;
  fetchCategories: (forumId: string) => Promise<void>;
  createCategory: (
    forumId: string,
    data: { name: string; color?: string; description?: string }
  ) => Promise<void>;
  updateCategory: (
    forumId: string,
    categoryId: string,
    data: Partial<ForumCategory>
  ) => Promise<void>;
  deleteCategory: (forumId: string, categoryId: string) => Promise<void>;
  reorderCategories: (forumId: string, categoryIds: string[]) => Promise<void>;
  fetchThreadPrefixes: (forumId?: string) => Promise<void>;
  createThreadPrefix: (data: CreateThreadPrefixData) => Promise<ThreadPrefix>;
  deleteThreadPrefix: (prefixId: string) => Promise<void>;
  rateThread: (threadId: string, rating: number) => Promise<void>;
  fetchThreadRatings: (threadId: string) => Promise<readonly ThreadRating[]>;
  uploadAttachment: (file: File, postId?: string) => Promise<PostAttachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  fetchEditHistory: (postId: string) => Promise<readonly PostEditHistory[]>;
  createPoll: (threadId: string, data: CreatePollData) => Promise<{ options: PollOption[] }>;
  votePoll: (pollId: string, optionIds: string[]) => Promise<void>;
  closePoll: (pollId: string) => Promise<void>;
}

export interface ForumModerationSliceState {
  readonly moderationQueue: readonly ModerationQueueItem[];
  readonly reports: readonly Report[];

  pinPost: (forumId: string, postId: string) => Promise<void>;
  unpinPost: (forumId: string, postId: string) => Promise<void>;
  lockPost: (forumId: string, postId: string) => Promise<void>;
  unlockPost: (forumId: string, postId: string) => Promise<void>;
  deletePost: (forumId: string, postId: string) => Promise<void>;
  moveThread: (threadId: string, targetForumId: string) => Promise<void>;
  splitThread: (threadId: string, postIds: string[], newTitle: string) => Promise<void>;
  mergeThreads: (sourceThreadId: string, targetThreadId: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  warnUser: (userId: string, warningTypeId: string, reason: string) => Promise<UserWarning>;
  fetchUserWarnings: (userId: string) => Promise<readonly UserWarning[]>;
  banUser: (data: CreateBanData) => Promise<Ban>;
  unbanUser: (banId: string) => Promise<void>;
  fetchBans: () => Promise<readonly Ban[]>;
  fetchModerationQueue: () => Promise<void>;
  approveQueueItem: (itemId: string) => Promise<void>;
  rejectQueueItem: (itemId: string, reason?: string) => Promise<void>;
  reportItem: (data: CreateReportData) => Promise<Report>;
  fetchReports: (status?: Report['status']) => Promise<readonly Report[]>;
  assignReport: (reportId: string, moderatorId: string) => Promise<void>;
  resolveReport: (reportId: string, resolution: string) => Promise<void>;
  fetchForumModQueue: (forumId: string, status?: string) => Promise<readonly ModerationQueueItem[]>;
  takeForumModAction: (
    forumId: string,
    postId: string,
    action: 'approve' | 'remove' | 'hide'
  ) => Promise<void>;
  fetchForumAutomod: (forumId: string) => Promise<Record<string, unknown>>;
  updateForumAutomod: (
    forumId: string,
    config: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
  fetchForumModStats: (forumId: string) => Promise<Record<string, unknown>>;
}

export const selectForumListSlice = (s: ForumState): ForumListSliceState => ({
  forums: s.forums,
  subscribedForums: s.subscribedForums,
  leaderboard: s.leaderboard,
  leaderboardMeta: s.leaderboardMeta,
  topForums: s.topForums,
  isLoadingForums: s.isLoadingForums,
  isLoadingLeaderboard: s.isLoadingLeaderboard,
  sortBy: s.sortBy,
  timeRange: s.timeRange,
  searchResults: s.searchResults,
  searchQuery: s.searchQuery,
  searchFilters: s.searchFilters,
  searchLoading: s.searchLoading,
  searchHasMore: s.searchHasMore,
  searchCursor: s.searchCursor,
  fetchForums: s.fetchForums,
  fetchLeaderboard: s.fetchLeaderboard,
  fetchTopForums: s.fetchTopForums,
  subscribe: s.subscribe,
  unsubscribe: s.unsubscribe,
  setSortBy: s.setSortBy,
  setTimeRange: s.setTimeRange,
  searchForums: s.searchForums,
  searchMore: s.searchMore,
  clearSearch: s.clearSearch,
});

export const selectForumDetailSlice = (s: ForumState): ForumDetailSliceState => ({
  currentForum: s.currentForum,
  currentPost: s.currentPost,
  posts: s.posts,
  comments: s.comments,
  threadPrefixes: s.threadPrefixes,
  isLoadingPosts: s.isLoadingPosts,
  isLoadingComments: s.isLoadingComments,
  hasMorePosts: s.hasMorePosts,
  fetchForum: s.fetchForum,
  fetchPosts: s.fetchPosts,
  fetchPost: s.fetchPost,
  fetchComments: s.fetchComments,
  createPost: s.createPost,
  createComment: s.createComment,
  editComment: s.editComment,
  deleteComment: s.deleteComment,
  vote: s.vote,
  voteForum: s.voteForum,
  fetchCategories: s.fetchCategories,
  createCategory: s.createCategory,
  updateCategory: s.updateCategory,
  deleteCategory: s.deleteCategory,
  reorderCategories: s.reorderCategories,
  fetchThreadPrefixes: s.fetchThreadPrefixes,
  createThreadPrefix: s.createThreadPrefix,
  deleteThreadPrefix: s.deleteThreadPrefix,
  rateThread: s.rateThread,
  fetchThreadRatings: s.fetchThreadRatings,
  uploadAttachment: s.uploadAttachment,
  deleteAttachment: s.deleteAttachment,
  fetchEditHistory: s.fetchEditHistory,
  createPoll: s.createPoll,
  votePoll: s.votePoll,
  closePoll: s.closePoll,
});

export const selectForumModerationSlice = (s: ForumState): ForumModerationSliceState => ({
  moderationQueue: s.moderationQueue,
  reports: s.reports,
  pinPost: s.pinPost,
  unpinPost: s.unpinPost,
  lockPost: s.lockPost,
  unlockPost: s.unlockPost,
  deletePost: s.deletePost,
  moveThread: s.moveThread,
  splitThread: s.splitThread,
  mergeThreads: s.mergeThreads,
  closeThread: s.closeThread,
  reopenThread: s.reopenThread,
  warnUser: s.warnUser,
  fetchUserWarnings: s.fetchUserWarnings,
  banUser: s.banUser,
  unbanUser: s.unbanUser,
  fetchBans: s.fetchBans,
  fetchModerationQueue: s.fetchModerationQueue,
  approveQueueItem: s.approveQueueItem,
  rejectQueueItem: s.rejectQueueItem,
  reportItem: s.reportItem,
  fetchReports: s.fetchReports,
  assignReport: s.assignReport,
  resolveReport: s.resolveReport,
  fetchForumModQueue: s.fetchForumModQueue,
  takeForumModAction: s.takeForumModAction,
  fetchForumAutomod: s.fetchForumAutomod,
  updateForumAutomod: s.updateForumAutomod,
  fetchForumModStats: s.fetchForumModStats,
});
