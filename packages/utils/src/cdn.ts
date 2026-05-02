/**
 * CDN URL builder — constructs asset URLs from backend AssetHash values.
 *
 * Extension map matches the backend's AssetHash module:
 * - avatar, banner, badge, nameplate, profile_frame → webp
 * - border, effect → json (Lottie/animation data)
 *
 */

// Types

/** Asset types supported by the CDN. */
export type CdnAssetType =
  | 'avatar'
  | 'banner'
  | 'badge'
  | 'nameplate'
  | 'profile_frame'
  | 'border'
  | 'effect';

// Extension map (mirrors backend AssetHash)

const EXTENSION_MAP: Readonly<Record<CdnAssetType, string>> = {
  avatar: 'webp',
  banner: 'webp',
  badge: 'webp',
  nameplate: 'webp',
  profile_frame: 'webp',
  border: 'json',
  effect: 'json',
};

/** Default CDN base URL when none is provided. */
const DEFAULT_CDN_BASE = 'https://cdn.cgraph.org';

// Hash validation

/**
 * 64-char lowercase hex string (SHA-256 hash).
 * Also accepts 32-char (MD5) and 40-char (SHA-1) for backwards compat.
 */
const HASH_PATTERN = /^[0-9a-f]{32,64}$/;

/**
 * Checks whether a string is a valid asset hash.
 *
 * @param hash - The candidate hash string.
 * @returns `true` if the hash is a valid hex string of 32–64 chars.
 */
export function isValidHash(hash: string): boolean {
  return HASH_PATTERN.test(hash);
}

// URL builder

/**
 * Builds a CDN URL from an asset hash and type.
 *
 * @param hash       - The asset hash (hex string from backend).
 * @param type       - The asset type determining file extension.
 * @param cdnBaseUrl - Optional CDN base URL override (no trailing slash).
 * @returns The full CDN URL, or `null` if the hash is invalid / empty.
 */
export function buildCdnUrl(
  hash: string | null | undefined,
  type: CdnAssetType,
  cdnBaseUrl?: string
): string | null {
  if (!hash || !isValidHash(hash)) {
    return null;
  }

  const ext = EXTENSION_MAP[type];
  const base = cdnBaseUrl ?? DEFAULT_CDN_BASE;
  // Strip trailing slash from base to avoid double-slash
  const normalizedBase = base.replace(/\/+$/, '');

  return `${normalizedBase}/${type}/${hash}.${ext}`;
}

// Hash extractor

/**
 * URL pattern: {base}/{type}/{hash}.{ext}
 * Captures the hash segment from a CDN URL.
 */
const CDN_URL_HASH_PATTERN = /\/([0-9a-f]{32,64})\.[a-z]+$/;

/**
 * Extracts the asset hash from a CDN URL.
 *
 * @param url - A CDN URL previously built by `buildCdnUrl`.
 * @returns The hex hash string, or `null` if the URL doesn't match.
 */
export function extractHash(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const match = CDN_URL_HASH_PATTERN.exec(url);
  return match?.[1] ?? null;
}
