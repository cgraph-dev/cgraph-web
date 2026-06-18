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
