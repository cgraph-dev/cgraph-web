import type { GifResult } from './types';

export interface GifSearchPage {
  readonly gifs: GifResult[];
  readonly next: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function httpsUrl(value: unknown): string | null {
  const candidate = nonEmptyString(value);
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function dimensions(value: unknown): readonly [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [width, height] = value;
  if (
    typeof width !== 'number' ||
    !Number.isFinite(width) ||
    width <= 0 ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return null;
  }
  return [width, height];
}

function normalizeGif(value: unknown): GifResult | null {
  if (!isRecord(value) || !isRecord(value.media)) return null;

  const id = nonEmptyString(value.id);
  const media = value.media;
  const full = isRecord(media.gif) ? media.gif : null;
  const preview = isRecord(media.tinygif)
    ? media.tinygif
    : isRecord(media.preview)
      ? media.preview
      : null;
  const url = httpsUrl(full?.url);
  const previewUrl = httpsUrl(preview?.url) ?? url;
  const size = dimensions(full?.dims) ?? dimensions(preview?.dims);

  if (!id || !url || !previewUrl || !size) return null;

  return {
    id,
    title: nonEmptyString(value.title) ?? 'GIF',
    url,
    previewUrl,
    width: size[0],
    height: size[1],
    source: 'klipy',
  };
}

/** Normalizes the authenticated CGraph GIF API response into renderable provider media. */
export function normalizeGifSearchResponse(value: unknown): GifSearchPage {
  const body = isRecord(value) && isRecord(value.data) ? value.data : value;
  if (!isRecord(body) || !Array.isArray(body.gifs)) {
    return { gifs: [], next: null };
  }

  return {
    gifs: body.gifs.map(normalizeGif).filter((gif): gif is GifResult => gif !== null),
    next: nonEmptyString(body.next),
  };
}
