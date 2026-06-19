import { getMediaBaseUrl } from './backend-url';

const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:/i;

/**
 * Resolves backend media paths into browser-loadable URLs.
 *
 * The backend commonly returns relative paths such as `/uploads/avatars/...`.
 * In production those paths must load from the backend media host, while blob,
 * data, and absolute URLs must pass through unchanged.
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  const rawUrl = typeof url === 'string' ? url.trim() : '';
  if (!rawUrl) return undefined;

  if (ABSOLUTE_URL_RE.test(rawUrl)) {
    return rawUrl;
  }

  const mediaBaseUrl = getMediaBaseUrl();
  const base = mediaBaseUrl.endsWith('/') ? mediaBaseUrl.slice(0, -1) : mediaBaseUrl;
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;

  return `${base}${path}`;
}

export function resolveAvatarUrl(url: string | undefined | null): string | null {
  return resolveMediaUrl(url) ?? null;
}

const AVATAR_URL_FIELDS = ['avatarUrl', 'avatar_url', 'avatar_hash', 'from_avatar_url'] as const;

/**
 * Extracts an avatar URL from common backend/socket user payload shapes.
 *
 * Some endpoints still use `avatar_hash` for the stored media path while newer
 * endpoints return `avatar_url`/`avatarUrl`. Keep that compatibility here so
 * account settings, live previews, profile cards, and refresh hydration all
 * render the same canonical avatar.
 */
export function resolveAvatarUrlFromRecord(
  record: Record<string, unknown> | null | undefined,
  extraFields: readonly string[] = []
): string | null {
  if (!record) return null;

  for (const field of [...AVATAR_URL_FIELDS, ...extraFields]) {
    const value = record[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      return resolveAvatarUrl(value);
    }
  }

  return null;
}
