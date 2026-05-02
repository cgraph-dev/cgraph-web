/**
 * Forums schemas.
 *
 * Zod schemas for all forum-related response types: forums, boards, posts,
 * comments, polls, votes, threads, members, search results, and more.
 * Types are derived via `z.infer` so callers never need parallel interfaces.
 */
import { z } from 'zod';
import { UserBasicSchema } from './common';

// ---------------------------------------------------------------------------
// Shared author shape (used by posts, comments, threads)
// ---------------------------------------------------------------------------

export const ForumAuthorSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarBorderId: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  equippedTitleId: z.string().nullable().optional(),
  equipped_title_id: z.string().nullable().optional(),
  reputation: z.number().optional(),
});

export type ForumAuthor = z.infer<typeof ForumAuthorSchema>;

// ---------------------------------------------------------------------------
// ForumCategory
// ---------------------------------------------------------------------------

export const ForumCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  order: z.number(),
  postCount: z.number().optional(),
  post_count: z.number().optional(),
});

export type ForumCategory = z.infer<typeof ForumCategorySchema>;

// ---------------------------------------------------------------------------
// ForumModerator
// ---------------------------------------------------------------------------

export const ForumModeratorSchema = z.object({
  id: z.string(),
  forumId: z.string().optional(),
  forum_id: z.string().optional(),
  userId: z.string().optional(),
  user_id: z.string().optional(),
  username: z.string(),
  displayName: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarBorderId: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
  addedAt: z.string().optional(),
  added_at: z.string().optional(),
});

export type ForumModerator = z.infer<typeof ForumModeratorSchema>;

// ---------------------------------------------------------------------------
// Forum
// ---------------------------------------------------------------------------

export const ForumSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  iconUrl: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  customCss: z.string().nullable().optional(),
  custom_css: z.string().nullable().optional(),
  isNsfw: z.boolean().optional(),
  is_nsfw: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  is_private: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  is_public: z.boolean().optional(),
  memberCount: z.number().optional(),
  member_count: z.number().optional(),
  threadCount: z.number().optional(),
  thread_count: z.number().optional(),
  postCount: z.number().optional(),
  post_count: z.number().optional(),
  score: z.number().optional(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  hotScore: z.number().optional(),
  hot_score: z.number().optional(),
  weeklyScore: z.number().optional(),
  weekly_score: z.number().optional(),
  featured: z.boolean().optional(),
  userVote: z
    .union([z.literal(1), z.literal(-1), z.literal(0)])
    .nullable()
    .optional(),
  user_vote: z
    .union([z.literal(1), z.literal(-1), z.literal(0)])
    .nullable()
    .optional(),
  categories: z.array(ForumCategorySchema).optional(),
  moderators: z.array(ForumModeratorSchema).optional(),
  isSubscribed: z.boolean().optional(),
  is_subscribed: z.boolean().optional(),
  isMember: z.boolean().optional(),
  is_member: z.boolean().optional(),
  ownerId: z.string().nullable().optional(),
  owner_id: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
});

export type Forum = z.infer<typeof ForumSchema>;

// ---------------------------------------------------------------------------
// ForumVoteResult  (returned by voteForum)
// ---------------------------------------------------------------------------

export const ForumVoteResultSchema = z.object({
  forum: z.object({
    id: z.string(),
    score: z.number(),
    upvotes: z.number(),
    downvotes: z.number(),
    userVote: z
      .union([z.literal(1), z.literal(-1), z.literal(0)])
      .nullable()
      .optional(),
    user_vote: z
      .union([z.literal(1), z.literal(-1), z.literal(0)])
      .nullable()
      .optional(),
  }),
});

export type ForumVoteResult = z.infer<typeof ForumVoteResultSchema>;

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export const BoardSchema = z.object({
  id: z.string(),
  forumId: z.string().optional(),
  forum_id: z.string().optional(),
  parentBoardId: z.string().nullable().optional(),
  parent_board_id: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  position: z.number().optional(),
  isLocked: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  threadCount: z.number().optional(),
  thread_count: z.number().optional(),
  postCount: z.number().optional(),
  post_count: z.number().optional(),
  lastPostAt: z.string().nullable().optional(),
  last_post_at: z.string().nullable().optional(),
  lastPostTitle: z.string().nullable().optional(),
  last_post_title: z.string().nullable().optional(),
  lastPostAuthor: z.string().nullable().optional(),
  last_post_author: z.string().nullable().optional(),
  insertedAt: z.string().optional(),
  inserted_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Board = z.infer<typeof BoardSchema>;

// ---------------------------------------------------------------------------
// Thread prefix
// ---------------------------------------------------------------------------

export const ThreadPrefixSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  forums: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

export type ThreadPrefix = z.infer<typeof ThreadPrefixSchema>;

// ---------------------------------------------------------------------------
// Poll
// ---------------------------------------------------------------------------

export const PollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number(),
  voters: z.array(z.string()).optional(),
});

export type PollOption = z.infer<typeof PollOptionSchema>;

export const PollSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  thread_id: z.string().optional(),
  question: z.string(),
  options: z.array(PollOptionSchema),
  allowMultiple: z.boolean().optional(),
  allow_multiple: z.boolean().optional(),
  maxSelections: z.number().nullable().optional(),
  max_selections: z.number().nullable().optional(),
  timeout: z.string().nullable().optional(),
  public: z.boolean().optional(),
  closed: z.boolean().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
});

export type Poll = z.infer<typeof PollSchema>;

// ---------------------------------------------------------------------------
// Post attachment / edit history
// ---------------------------------------------------------------------------

export const PostAttachmentSchema = z.object({
  id: z.string(),
  postId: z.string().optional(),
  post_id: z.string().optional(),
  filename: z.string(),
  originalFilename: z.string().optional(),
  original_filename: z.string().optional(),
  fileType: z.string().optional(),
  file_type: z.string().optional(),
  fileSize: z.number().optional(),
  file_size: z.number().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  downloadUrl: z.string().optional(),
  download_url: z.string().optional(),
  downloads: z.number().optional(),
  uploadedBy: z.string().optional(),
  uploaded_by: z.string().optional(),
  uploadedAt: z.string().optional(),
  uploaded_at: z.string().optional(),
});

export type PostAttachment = z.infer<typeof PostAttachmentSchema>;

export const PostEditHistorySchema = z.object({
  id: z.string(),
  postId: z.string().optional(),
  post_id: z.string().optional(),
  editedBy: z.string().optional(),
  edited_by: z.string().optional(),
  editedByUsername: z.string().optional(),
  edited_by_username: z.string().optional(),
  previousContent: z.string().optional(),
  previous_content: z.string().optional(),
  reason: z.string().nullable().optional(),
  editedAt: z.string().optional(),
  edited_at: z.string().optional(),
});

export type PostEditHistory = z.infer<typeof PostEditHistorySchema>;

// ---------------------------------------------------------------------------
// Post  (reddit-style forum post / top-level thread)
// ---------------------------------------------------------------------------

const PostForumRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  iconUrl: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
});

export const PostSchema = z.object({
  id: z.string(),
  forumId: z.string().optional(),
  forum_id: z.string().optional(),
  authorId: z.string().optional(),
  author_id: z.string().optional(),
  title: z.string(),
  content: z.string(),
  postType: z.enum(['text', 'link', 'image', 'video', 'poll']).optional(),
  post_type: z.enum(['text', 'link', 'image', 'video', 'poll']).optional(),
  linkUrl: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  mediaUrls: z.array(z.string()).optional(),
  media_urls: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  isNsfw: z.boolean().optional(),
  is_nsfw: z.boolean().optional(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  score: z.number().optional(),
  hotScore: z.number().optional(),
  hot_score: z.number().optional(),
  commentCount: z.number().optional(),
  comment_count: z.number().optional(),
  myVote: z
    .union([z.literal(1), z.literal(-1)])
    .nullable()
    .optional(),
  my_vote: z
    .union([z.literal(1), z.literal(-1)])
    .nullable()
    .optional(),
  category: ForumCategorySchema.nullable().optional(),
  prefix: ThreadPrefixSchema.nullable().optional(),
  views: z.number().optional(),
  rating: z.number().nullable().optional(),
  ratingCount: z.number().nullable().optional(),
  rating_count: z.number().nullable().optional(),
  myRating: z.number().nullable().optional(),
  my_rating: z.number().nullable().optional(),
  isClosed: z.boolean().optional(),
  is_closed: z.boolean().optional(),
  attachments: z.array(PostAttachmentSchema).optional(),
  editHistory: z.array(PostEditHistorySchema).optional(),
  edit_history: z.array(PostEditHistorySchema).optional(),
  isApproved: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  poll: PollSchema.nullable().optional(),
  isContentGated: z.boolean().optional(),
  is_content_gated: z.boolean().optional(),
  gatePriceNodes: z.number().nullable().optional(),
  gate_price_nodes: z.number().nullable().optional(),
  gatePreviewChars: z.number().nullable().optional(),
  gate_preview_chars: z.number().nullable().optional(),
  promotionType: z.enum(['boost', 'highlight', 'spotlight', 'bump']).nullable().optional(),
  promotion_type: z.enum(['boost', 'highlight', 'spotlight', 'bump']).nullable().optional(),
  promotionExpiresAt: z.string().nullable().optional(),
  promotion_expires_at: z.string().nullable().optional(),
  author: ForumAuthorSchema,
  forum: PostForumRefSchema.optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
  editedAt: z.string().nullable().optional(),
  edited_at: z.string().nullable().optional(),
  editedBy: z.string().nullable().optional(),
  edited_by: z.string().nullable().optional(),
});

export type Post = z.infer<typeof PostSchema>;

// ---------------------------------------------------------------------------
// Post feed page (cursor-paginated)
// ---------------------------------------------------------------------------

export const PostPageSchema = z.object({
  posts: z.array(PostSchema).optional(),
  data: z.array(PostSchema).optional(),
  page_info: z
    .object({
      has_next_page: z.boolean(),
      has_previous_page: z.boolean().optional(),
      start_cursor: z.string().nullable().optional(),
      end_cursor: z.string().nullable().optional(),
      total_count: z.number().optional(),
    })
    .optional(),
});

export type PostPage = z.infer<typeof PostPageSchema>;

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export const CommentSchema: z.ZodType<{
  readonly id: string;
  readonly postId?: string;
  readonly post_id?: string;
  readonly authorId?: string;
  readonly author_id?: string;
  readonly parentId: string | null;
  readonly parent_id?: string | null;
  readonly content: string;
  readonly upvotes?: number;
  readonly downvotes?: number;
  readonly score?: number;
  readonly myVote?: 1 | -1 | null;
  readonly my_vote?: 1 | -1 | null;
  readonly userVote?: 1 | -1 | null;
  readonly user_vote?: 1 | -1 | null;
  readonly isCollapsed?: boolean;
  readonly is_collapsed?: boolean;
  readonly depth?: number;
  readonly children?: readonly unknown[];
  readonly isBestAnswer?: boolean;
  readonly is_best_answer?: boolean;
  readonly attachments?: readonly unknown[];
  readonly editHistory?: readonly unknown[];
  readonly edit_history?: readonly unknown[];
  readonly isApproved?: boolean;
  readonly is_approved?: boolean;
  readonly author: z.infer<typeof ForumAuthorSchema>;
  readonly createdAt?: string;
  readonly created_at?: string;
  readonly updatedAt?: string;
  readonly updated_at?: string;
  readonly editedAt?: string | null;
  readonly edited_at?: string | null;
  readonly editedBy?: string | null;
  readonly edited_by?: string | null;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    postId: z.string().optional(),
    post_id: z.string().optional(),
    authorId: z.string().optional(),
    author_id: z.string().optional(),
    parentId: z.string().nullable(),
    parent_id: z.string().nullable().optional(),
    content: z.string(),
    upvotes: z.number().optional(),
    downvotes: z.number().optional(),
    score: z.number().optional(),
    myVote: z
      .union([z.literal(1), z.literal(-1)])
      .nullable()
      .optional(),
    my_vote: z
      .union([z.literal(1), z.literal(-1)])
      .nullable()
      .optional(),
    userVote: z
      .union([z.literal(1), z.literal(-1)])
      .nullable()
      .optional(),
    user_vote: z
      .union([z.literal(1), z.literal(-1)])
      .nullable()
      .optional(),
    isCollapsed: z.boolean().optional(),
    is_collapsed: z.boolean().optional(),
    depth: z.number().optional(),
    children: z.array(CommentSchema).optional().default([]),
    isBestAnswer: z.boolean().optional(),
    is_best_answer: z.boolean().optional(),
    attachments: z.array(PostAttachmentSchema).optional(),
    editHistory: z.array(PostEditHistorySchema).optional(),
    edit_history: z.array(PostEditHistorySchema).optional(),
    isApproved: z.boolean().optional(),
    is_approved: z.boolean().optional(),
    author: ForumAuthorSchema,
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional(),
    editedAt: z.string().nullable().optional(),
    edited_at: z.string().nullable().optional(),
    editedBy: z.string().nullable().optional(),
    edited_by: z.string().nullable().optional(),
  })
);

export type Comment = z.infer<typeof CommentSchema>;

// ---------------------------------------------------------------------------
// Vote result
// ---------------------------------------------------------------------------

export const VoteResultSchema = z.object({
  score: z.number().optional(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  myVote: z
    .union([z.literal(1), z.literal(-1)])
    .nullable()
    .optional(),
  my_vote: z
    .union([z.literal(1), z.literal(-1)])
    .nullable()
    .optional(),
});

export type VoteResult = z.infer<typeof VoteResultSchema>;

// ---------------------------------------------------------------------------
// Poll vote result
// ---------------------------------------------------------------------------

export const PollVoteResultSchema = z.object({
  poll: PollSchema.optional(),
  options: z.array(PollOptionSchema).optional(),
});

export type PollVoteResult = z.infer<typeof PollVoteResultSchema>;

// ---------------------------------------------------------------------------
// Thread (MyBB-style, lives in a board)
// ---------------------------------------------------------------------------

const ThreadAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarBorderId: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
});

export const ThreadSchema = z.object({
  id: z.string(),
  boardId: z.string().optional(),
  board_id: z.string().optional(),
  authorId: z.string().optional(),
  author_id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  content: z.string().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  content_html: z.string().nullable().optional(),
  threadType: z.enum(['normal', 'sticky', 'announcement', 'poll']).optional(),
  thread_type: z.enum(['normal', 'sticky', 'announcement', 'poll']).optional(),
  isLocked: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  prefix: z.string().nullable().optional(),
  prefixColor: z.string().nullable().optional(),
  prefix_color: z.string().nullable().optional(),
  viewCount: z.number().optional(),
  view_count: z.number().optional(),
  replyCount: z.number().optional(),
  reply_count: z.number().optional(),
  score: z.number().optional(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  lastPostAt: z.string().nullable().optional(),
  last_post_at: z.string().nullable().optional(),
  lastReplyAt: z.string().nullable().optional(),
  last_reply_at: z.string().nullable().optional(),
  lastReplyBy: z.string().nullable().optional(),
  last_reply_by: z.string().nullable().optional(),
  author: ThreadAuthorSchema.nullable().optional(),
  lastPoster: ThreadAuthorSchema.nullable().optional(),
  last_poster: ThreadAuthorSchema.nullable().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  insertedAt: z.string().optional(),
  inserted_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Thread = z.infer<typeof ThreadSchema>;

// ---------------------------------------------------------------------------
// ThreadPost (reply inside a thread)
// ---------------------------------------------------------------------------

export const ThreadPostSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  thread_id: z.string().optional(),
  authorId: z.string().optional(),
  author_id: z.string().optional(),
  content: z.string(),
  contentHtml: z.string().nullable().optional(),
  content_html: z.string().nullable().optional(),
  isEdited: z.boolean().optional(),
  is_edited: z.boolean().optional(),
  editCount: z.number().optional(),
  edit_count: z.number().optional(),
  editReason: z.string().nullable().optional(),
  edit_reason: z.string().nullable().optional(),
  editedAt: z.string().nullable().optional(),
  edited_at: z.string().nullable().optional(),
  isHidden: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  score: z.number().optional(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  position: z.number().optional(),
  replyToId: z.string().nullable().optional(),
  reply_to_id: z.string().nullable().optional(),
  author: ThreadAuthorSchema.nullable().optional(),
  insertedAt: z.string().optional(),
  inserted_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ThreadPost = z.infer<typeof ThreadPostSchema>;

// ---------------------------------------------------------------------------
// ForumMember
// ---------------------------------------------------------------------------

export const ForumMemberSchema = z.object({
  id: z.string(),
  forumId: z.string().optional(),
  forum_id: z.string().optional(),
  userId: z.string().optional(),
  user_id: z.string().optional(),
  displayName: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarBorderId: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  postCount: z.number().optional(),
  post_count: z.number().optional(),
  threadCount: z.number().optional(),
  thread_count: z.number().optional(),
  reputation: z.number().optional(),
  role: z.enum(['member', 'moderator', 'admin', 'owner']).optional(),
  isBanned: z.boolean().optional(),
  is_banned: z.boolean().optional(),
  joinedAt: z.string().nullable().optional(),
  joined_at: z.string().nullable().optional(),
  lastVisitAt: z.string().nullable().optional(),
  last_visit_at: z.string().nullable().optional(),
});

export type ForumMember = z.infer<typeof ForumMemberSchema>;

// ---------------------------------------------------------------------------
// ForumSearchResult
// ---------------------------------------------------------------------------

export const ForumSearchResultSchema = z.object({
  type: z.enum(['thread', 'post', 'comment']),
  id: z.string(),
  title: z.string().optional(),
  contentPreview: z.string().optional(),
  content_preview: z.string().optional(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    avatar: z.string().optional(),
    avatarUrl: z.string().optional(),
    avatar_url: z.string().optional(),
  }),
  forum: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  board: z.object({ id: z.string(), name: z.string(), slug: z.string() }).optional(),
  score: z.number().optional(),
  rank: z.number().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export type ForumSearchResult = z.infer<typeof ForumSearchResultSchema>;

export const ForumSearchPageSchema = z.object({
  data: z.array(ForumSearchResultSchema).optional(),
  results: z.array(ForumSearchResultSchema).optional(),
  page_info: z
    .object({
      has_next_page: z.boolean(),
      end_cursor: z.string().nullable().optional(),
      total_count: z.number().optional(),
    })
    .optional(),
});

export type ForumSearchPage = z.infer<typeof ForumSearchPageSchema>;

// ---------------------------------------------------------------------------
// Leaderboard entry (forum with ranking metadata)
// ---------------------------------------------------------------------------

export const LeaderboardEntrySchema = ForumSchema;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardPageSchema = z.object({
  forums: z.array(ForumSchema).optional(),
  data: z.array(ForumSchema).optional(),
  page_info: z
    .object({
      has_next_page: z.boolean(),
      end_cursor: z.string().nullable().optional(),
      total_count: z.number().optional(),
    })
    .optional(),
});

export type LeaderboardPage = z.infer<typeof LeaderboardPageSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const ForumSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  user_id: z.string().optional(),
  entityType: z.enum(['thread', 'forum']).optional(),
  entity_type: z.enum(['thread', 'forum']).optional(),
  entityId: z.string().optional(),
  entity_id: z.string().optional(),
  notificationMode: z.enum(['none', 'email', 'instant', 'digest']).optional(),
  notification_mode: z.enum(['none', 'email', 'instant', 'digest']).optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
});

export type ForumSubscription = z.infer<typeof ForumSubscriptionSchema>;

// ---------------------------------------------------------------------------
// Ack (empty / boolean success)
// ---------------------------------------------------------------------------

export const ForumAckSchema = z.unknown();
export type ForumAck = z.infer<typeof ForumAckSchema>;

// ---------------------------------------------------------------------------
// UserBasic re-export for convenience
// ---------------------------------------------------------------------------

export { UserBasicSchema };
