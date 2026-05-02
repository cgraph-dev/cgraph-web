import type {
  Board,
  Thread,
  ThreadPost,
  ThreadAuthor,
  ForumMember,
} from './forumHostingStore.types';
// Safe extraction helpers for untyped API response data
function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function strOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function bool(val: unknown): boolean {
  return val === true;
}

/** Type guard: narrows unknown to Record<string, unknown>. */
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

/** Narrow unknown to Record — returns empty object if not a plain object. */
function record(val: unknown): Record<string, unknown> {
  return isRecord(val) ? val : {};
}

/** Type guard: narrows unknown to Thread['threadType']. */
function isThreadType(val: unknown): val is Thread['threadType'] {
  return val === 'normal' || val === 'sticky' || val === 'announcement' || val === 'poll';
}

/** Type guard: narrows unknown to ForumMember['role']. */
function isMemberRole(val: unknown): val is ForumMember['role'] {
  return val === 'member' || val === 'moderator' || val === 'admin' || val === 'owner';
}

/** Map raw API response data into a typed Board object. */
export function mapBoardFromApi(data: unknown): Board {
  const d = record(data);
  return {
    id: str(d.id),
    forumId: str(d.forum_id),
    parentBoardId: strOrNull(d.parent_board_id),
    parentId: strOrNull(d.parent_board_id),
    name: str(d.name),
    slug: str(d.slug),
    description: strOrNull(d.description),
    icon: strOrNull(d.icon),
    position: num(d.position),
    isLocked: bool(d.is_locked),
    isHidden: bool(d.is_hidden),
    threadCount: num(d.thread_count),
    postCount: num(d.post_count),
    lastPostAt: strOrNull(d.last_post_at),
    lastPostTitle: strOrNull(d.last_post_title),
    lastPostAuthor: strOrNull(d.last_post_author),
    insertedAt: str(d.inserted_at),
    updatedAt: str(d.updated_at),
  };
}

/** Map raw API response data into a typed ThreadAuthor object. */
export function mapAuthorFromApi(data: Record<string, unknown>): ThreadAuthor {
  return {
    id: str(data.id),
    username: str(data.username),
    displayName: str(data.display_name) || str(data.username),
    avatarUrl: strOrNull(data.avatar_url),
  };
}

/** Map raw API response data into a typed Thread object. */
export function mapThreadFromApi(data: Record<string, unknown>): Thread {
  const insertedAt = str(data.inserted_at);
  const lastPostAt = strOrNull(data.last_post_at);
  const lastPoster = data.last_poster ? mapAuthorFromApi(record(data.last_poster)) : null;

  return {
    id: str(data.id),
    boardId: str(data.board_id),
    authorId: str(data.author_id),
    title: str(data.title),
    slug: str(data.slug),
    content: strOrNull(data.content),
    contentHtml: strOrNull(data.content_html),

    threadType: isThreadType(data.thread_type) ? data.thread_type : 'normal',
    isLocked: bool(data.is_locked),
    isPinned: bool(data.is_pinned),
    isHidden: bool(data.is_hidden),
    prefix: strOrNull(data.prefix),
    prefixColor: strOrNull(data.prefix_color),
    viewCount: num(data.view_count),
    replyCount: num(data.reply_count),
    score: num(data.score),
    upvotes: num(data.upvotes),
    downvotes: num(data.downvotes),
    lastPostAt: lastPostAt,
    lastReplyAt: lastPostAt,
    lastReplyBy: lastPoster?.username || null,
    author: data.author ? mapAuthorFromApi(record(data.author)) : null,
    lastPoster: lastPoster,
    createdAt: insertedAt,
    insertedAt: insertedAt,
    updatedAt: str(data.updated_at),
  };
}

/** Map raw API response data into a typed ThreadPost object. */
export function mapPostFromApi(data: Record<string, unknown>): ThreadPost {
  return {
    id: str(data.id),
    threadId: str(data.thread_id),
    authorId: str(data.author_id),
    content: str(data.content),
    contentHtml: strOrNull(data.content_html),
    isEdited: bool(data.is_edited),
    editCount: num(data.edit_count),
    editReason: strOrNull(data.edit_reason),
    editedAt: strOrNull(data.edited_at),
    isHidden: bool(data.is_hidden),
    score: num(data.score),
    upvotes: num(data.upvotes),
    downvotes: num(data.downvotes),
    position: num(data.position),
    replyToId: strOrNull(data.reply_to_id),
    author: data.author ? mapAuthorFromApi(record(data.author)) : null,
    insertedAt: str(data.inserted_at),
    updatedAt: str(data.updated_at),
  };
}

/** Map raw API response data into a typed ForumMember object. */
export function mapMemberFromApi(data: Record<string, unknown>): ForumMember {
  return {
    id: str(data.id),
    forumId: str(data.forum_id),
    userId: str(data.user_id),
    displayName: str(data.display_name) || str(data.username) || null,
    title: strOrNull(data.title),
    signature: strOrNull(data.signature),
    avatarUrl: strOrNull(data.avatar_url),
    postCount: num(data.post_count),
    threadCount: num(data.thread_count),
    reputation: num(data.reputation),

    role: isMemberRole(data.role) ? data.role : 'member',
    isBanned: bool(data.is_banned),
    joinedAt: str(data.joined_at) || str(data.inserted_at) || null,
    lastVisitAt: strOrNull(data.last_visit_at),
  };
}
