/**
 * Forums endpoints.
 *
 * Endpoints under /api/v1/forums, /api/v1/posts, /api/v1/comments, /api/v1/forum-polls.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapPayload(value: unknown, keys: readonly string[]): unknown {
  if (!isRecord(value)) return value;
  for (const key of keys) {
    if (key in value) return value[key];
  }
  return value;
}

function unwrapListPayload(value: unknown, keys: readonly string[]): unknown {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return value;
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return value;
}

const ForumEntitySchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    owner_id: z.string().optional(),
    icon_url: z.string().nullable().optional(),
    banner_url: z.string().nullable().optional(),
    is_public: z.boolean().optional(),
    member_count: z.number().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const ForumSchema = z.preprocess((value) => unwrapPayload(value, ['forum', 'data']), ForumEntitySchema);

const BoardEntitySchema = z
  .object({
    id: z.string(),
    forum_id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    position: z.number().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const BoardSchema = z.preprocess((value) => unwrapPayload(value, ['board', 'data']), BoardEntitySchema);

const PostEntitySchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().nullable().optional(),
    author_id: z.string().optional(),
    board_id: z.string().optional(),
    forum_id: z.string().optional(),
    score: z.number().optional(),
    comment_count: z.number().optional(),
    pinned: z.boolean().optional(),
    locked: z.boolean().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const PostSchema = z.preprocess(
  (value) => unwrapPayload(value, ['post', 'thread', 'data']),
  PostEntitySchema
);

const CommentEntitySchema = z
  .object({
    id: z.string(),
    content: z.string().optional(),
    author_id: z.string().optional(),
    post_id: z.string().optional(),
    parent_id: z.string().nullable().optional(),
    score: z.number().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const CommentSchema = z.preprocess(
  (value) => unwrapPayload(value, ['comment', 'data']),
  CommentEntitySchema
);

const VoteResultSchema = z
  .object({
    score: z.number().optional(),
    user_vote: z.number().nullable().optional(),
  })
  .passthrough();

const PollResultSchema = z
  .object({
    id: z.string().optional(),
    options: z
      .array(
        z
          .object({
            id: z.string(),
            text: z.string().optional(),
            vote_count: z.number().optional(),
          })
          .passthrough()
      )
      .optional(),
    closed: z.boolean().optional(),
    total_votes: z.number().optional(),
  })
  .passthrough();

const SubscriptionEntitySchema = z
  .object({
    id: z.string(),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    entity_type: z.string().optional(),
    entityType: z.string().optional(),
    entity_id: z.string().optional(),
    entityId: z.string().optional(),
    notification_mode: z.string().optional(),
    notificationMode: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

const SubscriptionSchema = z.preprocess(
  (value) => unwrapPayload(value, ['subscription', 'data']),
  SubscriptionEntitySchema
);

export type Subscription = z.infer<typeof SubscriptionSchema>;

const ForumMemberApiSchema = z
  .object({
    id: z.string(),
    user_id: z.string().optional(),
    forum_id: z.string().optional(),
    role: z.string().optional(),
    joined_at: z.string().nullable().optional(),
    username: z.string().optional(),
  })
  .passthrough();

const PageInfoSchema = z
  .object({
    has_next_page: z.boolean().optional(),
    has_previous_page: z.boolean().optional(),
    end_cursor: z.string().nullable().optional(),
    start_cursor: z.string().nullable().optional(),
    total_count: z.number().optional(),
  })
  .passthrough();

const PostPageResponseSchema = z
  .object({
    posts: z.array(PostSchema).optional(),
    data: z.array(PostSchema).optional(),
    results: z.array(PostSchema).optional(),
    page_info: PageInfoSchema.optional(),
    cursor: z.string().nullable().optional(),
    has_more: z.boolean().optional(),
  })
  .passthrough();

type PostPageResponse = z.infer<typeof PostPageResponseSchema>;

const ForumVoteResponseSchema = z
  .object({
    forum: z
      .object({
        score: z.number().optional(),
        upvotes: z.number().optional(),
        downvotes: z.number().optional(),
        user_vote: z.number().nullable().optional(),
        userVote: z.number().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

type ForumVoteResponse = z.infer<typeof ForumVoteResponseSchema>;

const LeaderboardResponseSchema = z
  .object({
    data: z.array(ForumSchema).optional(),
    page_info: PageInfoSchema.optional(),
  })
  .passthrough();

type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type Forum = z.infer<typeof ForumSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type VoteResult = z.infer<typeof VoteResultSchema>;
/** @deprecated Use `VoteResult` instead. */
export type ForumVoteResult = VoteResult;
export type PollResult = z.infer<typeof PollResultSchema>;
/** @deprecated Use `PollResult` instead. */
export type PollVoteResult = PollResult;
export type Thread = Post;
export type ThreadPost = Post;

// ---------------------------------------------------------------------------
// Wiki Schemas
// ---------------------------------------------------------------------------

const WikiToggleResponseSchema = z
  .object({
    id: z.string(),
    is_wiki: z.boolean(),
    wiki_enabled_at: z.string().nullable().optional(),
    version: z.number(),
  })
  .passthrough();

const WikiEditResponseSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    version: z.number(),
    last_editor: z
      .object({
        id: z.string(),
        username: z.string().nullable(),
      })
      .passthrough()
      .nullable()
      .optional(),
    revision: z
      .object({
        number: z.number(),
        edit_type: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

const RevisionEditorSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  })
  .passthrough()
  .nullable();

const RevisionSchema = z
  .object({
    number: z.number(),
    editor: RevisionEditorSchema.optional(),
    edit_type: z.string(),
    reason: z.string().nullable().optional(),
    hidden: z.boolean().optional(),
    created_at: z.string(),
  })
  .passthrough();

const RevisionListSchema = z.array(RevisionSchema);

const DiffHunkSchema = z.object({
  type: z.enum(['equal', 'insert', 'delete']),
  text: z.string(),
});

const DiffResponseSchema = z
  .object({
    from_revision: z.number(),
    to_revision: z.number(),
    hunks: z.array(DiffHunkSchema),
  })
  .passthrough();

const RollbackResponseSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    version: z.number(),
    revision: z
      .object({
        number: z.number(),
        edit_type: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

export type WikiToggleResponse = z.infer<typeof WikiToggleResponseSchema>;
export type WikiEditResponse = z.infer<typeof WikiEditResponseSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type DiffHunk = z.infer<typeof DiffHunkSchema>;
export type DiffResponse = z.infer<typeof DiffResponseSchema>;
export type RollbackResponse = z.infer<typeof RollbackResponseSchema>;

export interface PostPage {
  readonly posts: Post[];
  readonly cursor: string | null;
  readonly has_more: boolean;
}

export type Poll = PollResult;

// ---------------------------------------------------------------------------
// Topic Schemas (grouping layer above threads — Discourse pattern)
// ---------------------------------------------------------------------------

const TopicCreatorSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable().optional(),
  })
  .passthrough();

const ForumTopicSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    status: z.enum(['open', 'closed', 'archived', 'unlisted']),
    pinned: z.boolean(),
    pinned_at: z.string().nullable().optional(),
    pinned_until: z.string().nullable().optional(),
    pinned_globally: z.boolean().optional(),
    thread_count: z.number(),
    participant_count: z.number(),
    view_count: z.number(),
    last_activity_at: z.string().nullable().optional(),
    hot_score: z.number(),
    board_id: z.string().optional(),
    created_by: TopicCreatorSchema.nullable().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const TopicThreadDetailSchema = z
  .object({
    topic_id: z.string(),
    thread_id: z.string(),
    position: z.number(),
    added_at: z.string().nullable().optional(),
    thread: z
      .object({
        id: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
        reply_count: z.number().optional(),
        view_count: z.number().optional(),
        last_post_at: z.string().nullable().optional(),
        is_pinned: z.boolean().optional(),
        is_locked: z.boolean().optional(),
        author: TopicCreatorSchema.nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const TopicListResponseSchema = z
  .object({
    data: z.array(ForumTopicSchema),
    meta: PageInfoSchema.optional(),
  })
  .passthrough();

const TopicThreadListResponseSchema = z
  .object({
    data: z.array(TopicThreadDetailSchema),
    meta: PageInfoSchema.optional(),
  })
  .passthrough();

type TopicThreadListResponse = z.infer<typeof TopicThreadListResponseSchema>;

const TopicMergeResponseSchema = z
  .object({
    data: z
      .object({
        merged_into: z.string(),
        threads_moved: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

const TopicThreadAssocSchema = z
  .object({
    data: z
      .object({
        topic_id: z.string(),
        thread_id: z.string(),
        position: z.number(),
        added_at: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type ForumTopic = z.infer<typeof ForumTopicSchema>;
export type TopicThreadDetail = z.infer<typeof TopicThreadDetailSchema>;
export type TopicListResponse = z.infer<typeof TopicListResponseSchema>;
export type TopicMergeResponse = z.infer<typeof TopicMergeResponseSchema>;

export interface TopicListParams extends ForumCursorParams {
  readonly status?: string;
  readonly sort?: string;
}

export interface TopicCreateParams {
  readonly title: string;
  readonly description?: string;
  readonly thread_ids?: readonly string[];
}

export interface TopicPinParams {
  readonly pinned_until?: string;
  readonly globally?: boolean;
}

export interface ThreadPrefix {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
}

export interface ForumMember {
  readonly id: string;
  readonly user_id: string;
  readonly forum_id: string;
  readonly role?: string;
  readonly joined_at?: string;
}

export interface ForumSearchPage {
  readonly results: Post[];
  readonly cursor: string | null;
  readonly has_more: boolean;
}

export interface LeaderboardPage {
  readonly entries: Array<{
    readonly user_id: string;
    readonly username?: string;
    readonly score: number;
    readonly rank: number;
  }>;
  readonly cursor: string | null;
  readonly has_more: boolean;
}

export interface ForumSubscription {
  readonly id: string;
  readonly forum_id: string;
  readonly user_id: string;
  readonly tier_id?: string;
  readonly status: string;
  readonly created_at?: string;
}

export interface ForumAck {
  readonly forum_id: string;
  readonly last_read_at: string;
}

export interface ForumCursorParams {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ThreadListParams extends ForumCursorParams {
  readonly board_id?: string;
  readonly sort?: string;
}

export interface PostFeedParams extends ForumCursorParams {
  readonly sort?: string;
  readonly filter?: string;
}

export interface MemberListParams extends ForumCursorParams {
  readonly role?: string;
}

export interface ForumSearchParams extends ForumCursorParams {
  readonly query: string;
  readonly board_id?: string;
}

export interface FacetedSearchParams extends ForumCursorParams {
  readonly q: string;
  readonly board_id?: string;
  readonly author?: string;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly tags?: string;
  readonly has_attachments?: boolean;
  readonly min_score?: number;
  readonly sort?: string;
  readonly per_page?: number;
}

// ---------------------------------------------------------------------------
// List schemas
// ---------------------------------------------------------------------------

const ForumListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['forums', 'data', 'results']),
  z.array(ForumSchema)
);
const BoardListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['boards', 'data', 'results']),
  z.array(BoardSchema)
);
const PostListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['posts', 'threads', 'data', 'results']),
  z.array(PostSchema)
);
const CommentListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['comments', 'data', 'results']),
  z.array(CommentSchema)
);
const SubscriptionListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['subscriptions', 'data', 'results']),
  z.array(SubscriptionSchema)
);
const ForumMemberListSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['members', 'data', 'results']),
  z.array(ForumMemberApiSchema)
);

const EmptySchema = z
  .preprocess((value) => value ?? {}, z.object({}).passthrough())
  .transform((): Record<string, never> => ({}));

/** Flexible param type that accepts both interfaces and plain records. */
type Params = Record<string, unknown> | object;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates forums endpoints bound to the provided Axios instance. */
export function createForumsEndpoints(http: AxiosInstance) {
  return {
    async listForums(params?: Params): Promise<ApiResult<Forum[]>> {
      return apiCall(() => http.get('/api/v1/forums', { params }), ForumListSchema);
    },
    async getForum(id: string): Promise<ApiResult<Forum>> {
      return apiCall(() => http.get(`/api/v1/forums/${id}`), ForumSchema);
    },
    async createForum(data: Params): Promise<ApiResult<Forum>> {
      return apiCall(() => http.post('/api/v1/forums', data), ForumSchema);
    },
    async updateForum(id: string, data: Params): Promise<ApiResult<Forum>> {
      return apiCall(() => http.patch(`/api/v1/forums/${id}`, data), ForumSchema);
    },
    async deleteForum(id: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/forums/${id}`), EmptySchema);
    },
    async listBoards(forumId: string, params?: Params): Promise<ApiResult<Board[]>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/boards`, { params }),
        BoardListSchema
      );
    },
    async getBoard(forumId: string, boardId: string): Promise<ApiResult<Board>> {
      return apiCall(() => http.get(`/api/v1/forums/${forumId}/boards/${boardId}`), BoardSchema);
    },
    async createBoard(forumId: string, data: Params): Promise<ApiResult<Board>> {
      return apiCall(() => http.post(`/api/v1/forums/${forumId}/boards`, data), BoardSchema);
    },
    async updateBoard(forumId: string, boardId: string, data: Params): Promise<ApiResult<Board>> {
      return apiCall(
        () => http.patch(`/api/v1/forums/${forumId}/boards/${boardId}`, data),
        BoardSchema
      );
    },
    async deleteBoard(forumId: string, boardId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/forums/${forumId}/boards/${boardId}`), EmptySchema);
    },
    async listThreads(forumId: string, params?: Params): Promise<ApiResult<Post[]>> {
      return apiCall(() => http.get(`/api/v1/forums/${forumId}/posts`, { params }), PostListSchema);
    },
    async getPost(postId: string): Promise<ApiResult<Post>> {
      return apiCall(() => http.get(`/api/v1/posts/${postId}`), PostSchema);
    },
    async createPost(forumId: string, data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.post(`/api/v1/forums/${forumId}/posts`, data), PostSchema);
    },
    async updatePost(postId: string, data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.patch(`/api/v1/posts/${postId}`, data), PostSchema);
    },
    async deletePost(postId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/posts/${postId}`), EmptySchema);
    },
    async pinPost(
      forumId: string,
      postId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/posts/${postId}/pin`),
        EmptySchema
      );
    },
    async unpinPost(
      forumId: string,
      postId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/posts/${postId}/unpin`),
        EmptySchema
      );
    },
    async lockPost(
      forumId: string,
      postId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/posts/${postId}/lock`),
        EmptySchema
      );
    },
    async unlockPost(
      forumId: string,
      postId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/posts/${postId}/unlock`),
        EmptySchema
      );
    },
    async createPostDirect(data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.post('/api/v1/posts', data), PostSchema);
    },
    async unvotePost(postId: string): Promise<ApiResult<VoteResult>> {
      return apiCall(() => http.delete(`/api/v1/posts/${postId}/vote`), VoteResultSchema);
    },
    async unvoteComment(commentId: string): Promise<ApiResult<VoteResult>> {
      return apiCall(() => http.delete(`/api/v1/comments/${commentId}/vote`), VoteResultSchema);
    },
    async voteForum(forumId: string, value: 1 | -1): Promise<ApiResult<ForumVoteResponse>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/vote`, { value }),
        ForumVoteResponseSchema
      );
    },
    async searchForums(params: Params): Promise<ApiResult<PostPageResponse>> {
      return apiCall(() => http.get('/api/v1/forums/search', { params }), PostPageResponseSchema);
    },
    async searchForumFaceted(
      forumId: string,
      params: Params
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/search`, { params }),
        z.record(z.unknown())
      );
    },
    async putComment(
      commentId: string,
      data: { readonly content: string }
    ): Promise<ApiResult<Comment>> {
      return apiCall(() => http.put(`/api/v1/comments/${commentId}`, data), CommentSchema);
    },
    async listComments(postId: string, params?: Params): Promise<ApiResult<Comment[]>> {
      return apiCall(
        () => http.get(`/api/v1/posts/${postId}/comments`, { params }),
        CommentListSchema
      );
    },
    async createComment(
      postId: string,
      data: { readonly content: string; readonly parent_id?: string }
    ): Promise<ApiResult<Comment>> {
      return apiCall(() => http.post(`/api/v1/posts/${postId}/comments`, data), CommentSchema);
    },
    async updateComment(
      commentId: string,
      data: { readonly content: string }
    ): Promise<ApiResult<Comment>> {
      return apiCall(() => http.patch(`/api/v1/comments/${commentId}`, data), CommentSchema);
    },
    async deleteComment(commentId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/comments/${commentId}`), EmptySchema);
    },
    async votePost(postId: string, value: 1 | -1): Promise<ApiResult<VoteResult>> {
      return apiCall(() => http.post(`/api/v1/posts/${postId}/vote`, { value }), VoteResultSchema);
    },
    async voteComment(commentId: string, value: 1 | -1): Promise<ApiResult<VoteResult>> {
      return apiCall(
        () => http.post(`/api/v1/comments/${commentId}/vote`, { value }),
        VoteResultSchema
      );
    },
    async votePoll(pollId: string, optionIds: readonly string[]): Promise<ApiResult<PollResult>> {
      return apiCall(
        () => http.post(`/api/v1/forum-polls/${pollId}/vote`, { option_ids: optionIds }),
        PollResultSchema
      );
    },
    async closePoll(pollId: string): Promise<ApiResult<PollResult>> {
      return apiCall(() => http.post(`/api/v1/forum-polls/${pollId}/close`), PollResultSchema);
    },
    async listRecentThreads(forumId: string, params?: Params): Promise<ApiResult<Post[]>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/threads/recent`, { params }),
        PostListSchema
      );
    },
    async getThread(threadId: string): Promise<ApiResult<Post>> {
      return apiCall(() => http.get(`/api/v1/threads/${threadId}`), PostSchema);
    },
    async createThread(boardId: string, data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.post(`/api/v1/boards/${boardId}/threads`, data), PostSchema);
    },
    async updateThread(threadId: string, data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.patch(`/api/v1/threads/${threadId}`, data), PostSchema);
    },
    async deleteThread(threadId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/threads/${threadId}`), EmptySchema);
    },
    async pinThread(
      threadId: string,
      pinned: boolean
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.post(`/api/v1/threads/${threadId}/pin`, { pinned }), EmptySchema);
    },
    async lockThread(
      threadId: string,
      locked: boolean
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.post(`/api/v1/threads/${threadId}/lock`, { locked }), EmptySchema);
    },
    async voteThread(threadId: string, value: 1 | -1): Promise<ApiResult<VoteResult>> {
      return apiCall(
        () => http.post(`/api/v1/threads/${threadId}/vote`, { value }),
        VoteResultSchema
      );
    },
    async listThreadPosts(threadId: string, params?: Params): Promise<ApiResult<Post[]>> {
      return apiCall(
        () => http.get(`/api/v1/threads/${threadId}/posts`, { params }),
        PostListSchema
      );
    },
    async createThreadPost(threadId: string, data: Params): Promise<ApiResult<Post>> {
      return apiCall(() => http.post(`/api/v1/threads/${threadId}/posts`, data), PostSchema);
    },
    async updateThreadPost(
      threadId: string,
      postId: string,
      data: Params
    ): Promise<ApiResult<Post>> {
      return apiCall(
        () => http.patch(`/api/v1/threads/${threadId}/posts/${postId}`, data),
        PostSchema
      );
    },
    async deleteThreadPost(
      threadId: string,
      postId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/threads/${threadId}/posts/${postId}`), EmptySchema);
    },
    async voteThreadPost(postId: string, value: 1 | -1): Promise<ApiResult<VoteResult>> {
      return apiCall(
        () => http.post(`/api/v1/thread-posts/${postId}/vote`, { value }),
        VoteResultSchema
      );
    },
    // ----- Wiki endpoints -----
    async toggleWiki(postId: string, enabled: boolean): Promise<ApiResult<WikiToggleResponse>> {
      return apiCall(
        () => http.put(`/api/v1/posts/${postId}/wiki`, { enabled }),
        WikiToggleResponseSchema
      );
    },
    async editWiki(
      postId: string,
      data: { readonly content: string; readonly reason?: string }
    ): Promise<ApiResult<WikiEditResponse>> {
      return apiCall(
        () => http.put(`/api/v1/posts/${postId}/wiki/edit`, data),
        WikiEditResponseSchema
      );
    },
    async listRevisions(
      postId: string,
      params?: { readonly cursor?: string; readonly per_page?: number }
    ): Promise<ApiResult<Revision[]>> {
      return apiCall(
        () => http.get(`/api/v1/posts/${postId}/revisions`, { params }),
        RevisionListSchema
      );
    },
    async getRevisionDiff(
      postId: string,
      from: number,
      to: number
    ): Promise<ApiResult<DiffResponse>> {
      return apiCall(
        () =>
          http.get(`/api/v1/posts/${postId}/revisions/diff`, {
            params: { from, to },
          }),
        DiffResponseSchema
      );
    },
    async rollbackRevision(
      postId: string,
      revisionNumber: number
    ): Promise<ApiResult<RollbackResponse>> {
      return apiCall(
        () => http.post(`/api/v1/posts/${postId}/revisions/${revisionNumber}/rollback`),
        RollbackResponseSchema
      );
    },

    async listPosts(forumSlug?: string, params?: Params): Promise<ApiResult<PostPageResponse>> {
      const url = forumSlug ? `/api/v1/forums/${forumSlug}/feed` : '/api/v1/posts/feed';
      return apiCall(() => http.get(url, { params }), PostPageResponseSchema);
    },
    async subscribeForum(forumId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.post(`/api/v1/forums/${forumId}/subscribe`), EmptySchema);
    },
    async unsubscribeForum(forumId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/forums/${forumId}/subscribe`), EmptySchema);
    },
    async subscribeThread(
      threadId: string,
      notificationMode: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () =>
          http.post(`/api/v1/threads/${threadId}/subscribe`, {
            notification_mode: notificationMode,
          }),
        EmptySchema
      );
    },
    async unsubscribeThread(threadId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/threads/${threadId}/subscribe`), EmptySchema);
    },
    async updateSubscription(
      subscriptionId: string,
      notificationMode: string
    ): Promise<ApiResult<Subscription>> {
      return apiCall(
        () =>
          http.patch(`/api/v1/subscriptions/${subscriptionId}`, {
            notification_mode: notificationMode,
          }),
        SubscriptionSchema
      );
    },
    async listSubscriptions(): Promise<ApiResult<Subscription[]>> {
      return apiCall(() => http.get('/api/v1/subscriptions'), SubscriptionListSchema);
    },
    async getLeaderboard(params?: Params): Promise<ApiResult<LeaderboardResponse>> {
      return apiCall(
        () => http.get('/api/v1/forums/leaderboard', { params }),
        LeaderboardResponseSchema
      );
    },
    async getTopForums(params?: Params): Promise<ApiResult<Forum[]>> {
      return apiCall(() => http.get('/api/v1/forums/top', { params }), ForumListSchema);
    },
    async listMembers(
      forumId: string,
      params?: Params
    ): Promise<ApiResult<z.infer<typeof ForumMemberApiSchema>[]>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/members`, { params }),
        ForumMemberListSchema
      );
    },

    // -----------------------------------------------------------------------
    // Topics (grouping layer above threads)
    // -----------------------------------------------------------------------

    async listTopics(
      forumId: string,
      boardId: string,
      params?: Params
    ): Promise<ApiResult<TopicListResponse>> {
      return apiCall(
        () =>
          http.get(`/api/v1/forums/${forumId}/boards/${boardId}/topics`, {
            params,
          }),
        TopicListResponseSchema
      );
    },
    async createTopic(
      forumId: string,
      boardId: string,
      data: TopicCreateParams
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/boards/${boardId}/topics`, data),
        ForumTopicSchema
      );
    },
    async getTopic(forumId: string, topicIdOrSlug: string): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/topics/${topicIdOrSlug}`),
        ForumTopicSchema
      );
    },
    async updateTopic(
      forumId: string,
      topicId: string,
      data: Params
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.put(`/api/v1/forums/${forumId}/topics/${topicId}`, data),
        ForumTopicSchema
      );
    },
    async deleteTopic(forumId: string, topicId: string): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.delete(`/api/v1/forums/${forumId}/topics/${topicId}`),
        ForumTopicSchema
      );
    },
    async listTopicThreads(
      forumId: string,
      topicId: string,
      params?: Params
    ): Promise<ApiResult<TopicThreadListResponse>> {
      return apiCall(
        () =>
          http.get(`/api/v1/forums/${forumId}/topics/${topicId}/threads`, {
            params,
          }),
        TopicThreadListResponseSchema
      );
    },
    async addThreadToTopic(
      forumId: string,
      topicId: string,
      threadId: string
    ): Promise<ApiResult<z.infer<typeof TopicThreadAssocSchema>>> {
      return apiCall(
        () =>
          http.post(`/api/v1/forums/${forumId}/topics/${topicId}/threads`, {
            thread_id: threadId,
          }),
        TopicThreadAssocSchema
      );
    },
    async removeThreadFromTopic(
      forumId: string,
      topicId: string,
      threadId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.delete(`/api/v1/forums/${forumId}/topics/${topicId}/threads/${threadId}`),
        EmptySchema
      );
    },
    async pinTopic(
      forumId: string,
      topicId: string,
      data?: TopicPinParams
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/topics/${topicId}/pin`, data ?? {}),
        ForumTopicSchema
      );
    },
    async unpinTopic(forumId: string, topicId: string): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/topics/${topicId}/unpin`),
        ForumTopicSchema
      );
    },
    async closeTopic(
      forumId: string,
      topicId: string,
      reason?: string
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () =>
          http.post(`/api/v1/forums/${forumId}/topics/${topicId}/close`, {
            reason,
          }),
        ForumTopicSchema
      );
    },
    async reopenTopic(forumId: string, topicId: string): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/topics/${topicId}/reopen`),
        ForumTopicSchema
      );
    },
    async mergeTopics(
      forumId: string,
      sourceTopicId: string,
      targetTopicId: string
    ): Promise<ApiResult<TopicMergeResponse>> {
      return apiCall(
        () =>
          http.post(`/api/v1/forums/${forumId}/topics/${sourceTopicId}/merge`, {
            target_topic_id: targetTopicId,
          }),
        TopicMergeResponseSchema
      );
    },
    async moveTopic(
      forumId: string,
      topicId: string,
      targetBoardId: string
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () =>
          http.post(`/api/v1/forums/${forumId}/topics/${topicId}/move`, {
            target_board_id: targetBoardId,
          }),
        ForumTopicSchema
      );
    },
    async splitTopic(
      forumId: string,
      topicId: string,
      threadIds: readonly string[],
      title: string
    ): Promise<ApiResult<ForumTopic>> {
      return apiCall(
        () =>
          http.post(`/api/v1/forums/${forumId}/topics/${topicId}/split`, {
            thread_ids: threadIds,
            title,
          }),
        ForumTopicSchema
      );
    },
    async setTopicNotificationLevel(
      forumId: string,
      topicId: string,
      level: number
    ): Promise<ApiResult<{ data: { notification_level: number } }>> {
      return apiCall(
        () => http.put(`/api/v1/forums/${forumId}/topics/${topicId}/notification-level`, { level }),
        z.object({ data: z.object({ notification_level: z.number() }) })
      );
    },
  };
}
