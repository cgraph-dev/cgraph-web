import type { User } from '@/modules/auth/store/authStore.types';

const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESERVED_TOP_LEVEL_ROUTES = new Set([
  'admin',
  'broadcasts',
  'call',
  'calls',
  'conversations',
  'cosmetics',
  'creator',
  'dashboard',
  'explore',
  'feed',
  'following',
  'friends',
  'gamification',
  'groups',
  'invite',
  'leaderboard',
  'me',
  'members',
  'messages',
  'nodes',
  'notifications',
  'onboarding',
  'premium',
  'profile',
  'pulse',
  'quests',
  'search',
  'settings',
  'social',
  'spaces',
  'titles',
  'u',
  'user',
  'vault',
]);

export type ProfileLookupMode = 'id' | 'username' | 'auto';

export function isValidProfileHandle(handle: string | undefined): handle is string {
  if (!handle) return false;
  const normalized = handle.trim().toLowerCase().replaceAll(/[\s[\]]/g, '-');
  return USERNAME_RE.test(handle) && !['undefined', 'null', 'nan', 'object-object'].includes(normalized);
}

export function isCanonicalUsername(username: string | null | undefined): username is string {
  if (!username || !USERNAME_RE.test(username)) return false;
  return !RESERVED_TOP_LEVEL_ROUTES.has(username.toLowerCase());
}

export function publicProfilePath(
  user: Pick<User, 'id' | 'username'> | { id?: string | null; username?: string | null } | null | undefined
): string {
  const username = user?.username?.trim();
  if (isCanonicalUsername(username)) return `/${encodeURIComponent(username)}`;

  const id = user?.id?.trim();
  return id ? `/user/${encodeURIComponent(id)}` : '/me/profile';
}

export function profileApiPathForHandle(handle: string, mode: ProfileLookupMode): string {
  const encoded = encodeURIComponent(handle);
  const lookupById = mode === 'id' || (mode === 'auto' && UUID_RE.test(handle));

  return lookupById ? `/api/v1/users/${encoded}` : `/api/v1/users/${encoded}/profile`;
}
