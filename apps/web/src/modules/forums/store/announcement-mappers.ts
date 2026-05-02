import type { Announcement, AnnouncementScope } from './announcementStore.types';

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function strOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

function strOrUndef(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined;
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function bool(val: unknown): boolean {
  return val === true;
}

function boolOrUndef(val: unknown): boolean | undefined {
  return typeof val === 'boolean' ? val : undefined;
}

function record(val: unknown): Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) ? { ...val } : {};
}

function strArray(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : [];
}

function strArrayOrUndef(val: unknown): string[] | undefined {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : undefined;
}

const VALID_SCOPES = new Set<string>(['global', 'forum', 'category']);

function scope(val: unknown): AnnouncementScope {
  if (typeof val !== 'string' || !VALID_SCOPES.has(val)) {
    return 'global';
  }

  return val === 'forum' || val === 'category' ? val : 'global';
}

/**
 * Maps raw API response data to an Announcement object.
 */
export function mapAnnouncementFromApi(data: Record<string, unknown>): Announcement {
  const author = record(data.author);

  return {
    id: str(data.id),
    title: str(data.title) || 'Untitled',
    content: str(data.content),
    scope: scope(data.scope),
    forumId: strOrNull(data.forum_id),
    forumName: strOrUndef(data.forum_name),
    authorId: str(data.author_id) || str(author.id),
    authorUsername: str(data.author_username) || str(author.username) || 'Unknown',
    authorDisplayName: strOrNull(data.author_display_name) ?? strOrNull(author.display_name),
    authorAvatarUrl: strOrNull(data.author_avatar_url) ?? strOrNull(author.avatar_url),
    isActive: data.is_active !== false,
    startDate: str(data.start_date) || new Date().toISOString(),
    endDate: strOrNull(data.end_date),
    allowedGroups: strArray(data.allowed_groups),
    allowedGroupNames: strArrayOrUndef(data.allowed_group_names),
    priority: num(data.priority),
    allowHtml: bool(data.allow_html),
    allowBbcode: data.allow_bbcode !== false,
    showInIndex: data.show_in_index !== false,
    showInForumView: data.show_in_forum_view !== false,
    icon: strOrUndef(data.icon),
    backgroundColor: strOrUndef(data.background_color),
    textColor: strOrUndef(data.text_color),
    viewCount: num(data.view_count),
    isRead: boolOrUndef(data.is_read),
    readAt: strOrNull(data.read_at),
    createdAt: str(data.created_at) || new Date().toISOString(),
    updatedAt: str(data.updated_at) || str(data.created_at) || new Date().toISOString(),
  };
}
