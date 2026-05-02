/**
 * Forum *detail* slice — single forum view, threads/posts, comments,
 * voting, polls, attachments.
 *
 * Thin selector hook over the canonical `useForumStore` (plan #19,
 * Option A). Once every detail consumer routes through this hook the
 * underlying impl can be lifted into its own store.
 */
import { useForumStore } from './forumStore';
import type {
  Comment,
  CreatePollData,
  CreatePostData,
  CreateThreadPrefixData,
  Forum,
  ForumCategory,
  PollOption,
  Post,
  PostAttachment,
  PostEditHistory,
  ThreadPrefix,
  ThreadRating,
} from './forumStore.types';

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

const selectDetailSlice = (
  s: ReturnType<typeof useForumStore.getState>
): ForumDetailSliceState => ({
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

/**
 * Selector hook returning the detail-only slice of the forum store.
 */
export function useForumDetailStore(): ForumDetailSliceState {
  return useForumStore(selectDetailSlice);
}
