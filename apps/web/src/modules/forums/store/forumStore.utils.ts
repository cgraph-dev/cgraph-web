import { ensureArray, ensureObject } from '@/lib/api-utils';
import type { Forum, Post, Comment, ForumSearchResult } from './forumStore.types';

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

function record(val: unknown): Record<string, unknown> | null {
  if (typeof val !== 'object' || val === null) return null;
  return Object.fromEntries(Object.entries(val));
}

function voteValue(val: unknown): 1 | -1 | 0 {
  if (val === 1 || val === -1) return val;
  return 0;
}

/** Map raw API response data into a typed Forum object. */
export function mapForumFromApi(raw: unknown): Forum {
  const data = record(raw) ?? {};
  const owner = record(data.owner);
  return {
    id: str(data.id),
    name: str(data.name),
    slug: str(data.slug),
    description: strOrNull(data.description),
    iconUrl: strOrNull(data.icon),
    bannerUrl: strOrNull(data.banner),
    customCss: null,
    isNsfw: bool(data.is_nsfw),
    isPrivate: bool(data.is_private),
    isPublic: !bool(data.is_private),
    memberCount: num(data.member_count),
    score: num(data.score),
    upvotes: num(data.upvotes),
    downvotes: num(data.downvotes),
    hotScore: num(data.hot_score),
    weeklyScore: num(data.weekly_score),
    featured: bool(data.featured),
    userVote: voteValue(data.user_vote),
    categories: ensureArray(data.categories, 'categories'),
    moderators: [],
    isSubscribed: bool(data.is_subscribed),
    isMember: bool(data.is_member),
    ownerId: strOrNull(owner?.id),
    createdAt: str(data.created_at),
  };
}

function voteResult(val: unknown): 1 | -1 | null {
  if (val === 1 || val === -1) return val;
  return null;
}

/** Normalize a raw API comment object to the domain Comment type. */
export function normalizeComment(raw: Record<string, unknown>, fallbackPostId = ''): Comment {
  const author = record(raw.author) ?? {};
  const children = Array.isArray(raw.children)
    ? raw.children
        .filter((c): c is Record<string, unknown> => c instanceof Object)
        .map((c) => normalizeComment(c, fallbackPostId))
    : [];
  return {
    id: str(raw.id),
    postId: str(raw.postId ?? raw.post_id) || fallbackPostId,
    authorId: str(raw.authorId ?? raw.author_id),
    parentId:
      typeof raw.parentId === 'string'
        ? raw.parentId
        : typeof raw.parent_id === 'string'
          ? raw.parent_id
          : null,
    content: str(raw.content),
    upvotes: num(raw.upvotes),
    downvotes: num(raw.downvotes),
    score: num(raw.score),
    myVote: voteResult(raw.myVote ?? raw.my_vote),
    userVote: voteResult(raw.userVote ?? raw.user_vote),
    isCollapsed: bool(raw.isCollapsed ?? raw.is_collapsed),
    depth: num(raw.depth),
    children,
    isBestAnswer: bool(raw.isBestAnswer ?? raw.is_best_answer),
    isApproved: typeof raw.isApproved === 'boolean' ? raw.isApproved : undefined,
    author: {
      id: str(author.id),
      username: typeof author.username === 'string' ? author.username : null,
      displayName:
        typeof author.displayName === 'string'
          ? author.displayName
          : typeof author.display_name === 'string'
            ? author.display_name
            : null,
      avatarUrl:
        typeof author.avatarUrl === 'string'
          ? author.avatarUrl
          : typeof author.avatar_url === 'string'
            ? author.avatar_url
            : null,
      avatarBorderId:
        typeof author.avatarBorderId === 'string'
          ? author.avatarBorderId
          : typeof author.avatar_border_id === 'string'
            ? author.avatar_border_id
            : null,
      equippedTitleId: typeof author.equippedTitleId === 'string' ? author.equippedTitleId : null,
      reputation: typeof author.reputation === 'number' ? author.reputation : undefined,
    },
    createdAt: str(raw.createdAt ?? raw.created_at),
    updatedAt: str(raw.updatedAt ?? raw.updated_at),
    editedAt:
      typeof raw.editedAt === 'string'
        ? raw.editedAt
        : typeof raw.edited_at === 'string'
          ? raw.edited_at
          : null,
    editedBy:
      typeof raw.editedBy === 'string'
        ? raw.editedBy
        : typeof raw.edited_by === 'string'
          ? raw.edited_by
          : null,
  };
}

/** Normalize a raw API post object to the domain Post type. */
export function normalizePost(raw: Record<string, unknown>, fallbackForumId = ''): Post {
  const postTypeRaw = raw.postType ?? raw.post_type;
  const postType: Post['postType'] =
    postTypeRaw === 'link' ||
    postTypeRaw === 'image' ||
    postTypeRaw === 'video' ||
    postTypeRaw === 'poll'
      ? postTypeRaw
      : 'text';
  const author = record(raw.author) ?? {};
  return {
    id: str(raw.id),
    forumId: str(raw.forumId ?? raw.forum_id) || fallbackForumId,
    authorId: str(raw.authorId ?? raw.author_id),
    title: str(raw.title),
    content: str(raw.content),
    postType,
    linkUrl:
      typeof raw.linkUrl === 'string'
        ? raw.linkUrl
        : typeof raw.link_url === 'string'
          ? raw.link_url
          : null,
    mediaUrls: Array.isArray(raw.mediaUrls)
      ? raw.mediaUrls.filter((u): u is string => typeof u === 'string')
      : [],
    isPinned: bool(raw.isPinned ?? raw.is_pinned),
    isLocked: bool(raw.isLocked ?? raw.is_locked),
    isNsfw: bool(raw.isNsfw ?? raw.is_nsfw),
    upvotes: num(raw.upvotes),
    downvotes: num(raw.downvotes),
    score: num(raw.score),
    hotScore: num(raw.hotScore ?? raw.hot_score),
    commentCount: num(raw.commentCount ?? raw.comment_count),
    myVote: voteResult(raw.myVote ?? raw.my_vote),
    category: record(raw.category)
      ? {
          id: str((record(raw.category) ?? {}).id),
          name: str((record(raw.category) ?? {}).name),
          slug: str((record(raw.category) ?? {}).slug),
          color: str((record(raw.category) ?? {}).color) || undefined,
          order: num((record(raw.category) ?? {}).order),
          postCount: num(
            (record(raw.category) ?? {}).postCount ?? (record(raw.category) ?? {}).post_count
          ),
        }
      : null,
    views: num(raw.views),
    author: {
      id: str(author.id),
      username: typeof author.username === 'string' ? author.username : null,
      displayName:
        typeof author.displayName === 'string'
          ? author.displayName
          : typeof author.display_name === 'string'
            ? author.display_name
            : null,
      avatarUrl:
        typeof author.avatarUrl === 'string'
          ? author.avatarUrl
          : typeof author.avatar_url === 'string'
            ? author.avatar_url
            : null,
      avatarBorderId: typeof author.avatarBorderId === 'string' ? author.avatarBorderId : null,
      equippedTitleId: typeof author.equippedTitleId === 'string' ? author.equippedTitleId : null,
      reputation: typeof author.reputation === 'number' ? author.reputation : undefined,
    },
    forum: (() => {
      const f = record(raw.forum) ?? {};
      return {
        id: str(f.id),
        name: str(f.name),
        slug: str(f.slug),
        iconUrl:
          typeof f.iconUrl === 'string'
            ? f.iconUrl
            : typeof f.icon_url === 'string'
              ? f.icon_url
              : null,
      };
    })(),
    isContentGated: bool(raw.isContentGated ?? raw.is_content_gated),
    gatePriceNodes:
      typeof raw.gatePriceNodes === 'number'
        ? raw.gatePriceNodes
        : typeof raw.gate_price_nodes === 'number'
          ? raw.gate_price_nodes
          : undefined,
    gatePreviewChars:
      typeof raw.gatePreviewChars === 'number'
        ? raw.gatePreviewChars
        : typeof raw.gate_preview_chars === 'number'
          ? raw.gate_preview_chars
          : undefined,
    createdAt: str(raw.createdAt ?? raw.created_at),
    updatedAt: str(raw.updatedAt ?? raw.updated_at),
  };
}

/** Normalize a raw API search result to the domain ForumSearchResult type. */
export function normalizeForumSearchResult(raw: Record<string, unknown>): ForumSearchResult {
  const typeRaw = raw.type;
  const type: ForumSearchResult['type'] =
    typeRaw === 'post' || typeRaw === 'comment' ? typeRaw : 'thread';
  const author = record(raw.author) ?? {};
  const forum = record(raw.forum) ?? {};
  return {
    type,
    id: str(raw.id),
    title: typeof raw.title === 'string' ? raw.title : undefined,
    contentPreview: str(raw.contentPreview ?? raw.content_preview),
    author: {
      id: str(author.id),
      username: str(author.username),
      avatar: typeof author.avatar === 'string' ? author.avatar : undefined,
    },
    forum: {
      id: str(forum.id),
      name: str(forum.name),
      slug: str(forum.slug),
    },
    board: record(raw.board)
      ? {
          id: str((record(raw.board) ?? {}).id),
          name: str((record(raw.board) ?? {}).name),
          slug: str((record(raw.board) ?? {}).slug),
        }
      : undefined,
    score: num(raw.score),
    rank: num(raw.rank),
    createdAt: str(raw.createdAt ?? raw.created_at),
    highlights: Array.isArray(raw.highlights)
      ? raw.highlights.filter((h): h is string => typeof h === 'string')
      : undefined,
  };
}

// Re-export API helpers for use in slices
export { http, apiClient } from '@/lib/api-client';
export { ensureArray, ensureObject };
