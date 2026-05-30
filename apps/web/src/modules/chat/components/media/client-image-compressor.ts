/**
 * Client-side image pre-compression utility.
 *
 * Resizes images larger than 4096px on any edge before upload, strips EXIF
 * metadata (except orientation), and converts to WebP (with JPEG fallback).
 * Runs off the main thread via OffscreenCanvas when available.
 *
 * Matches Signal's client-side pre-processing pipeline — large phone photos
 * (12 MP, ~8 MB) compress to ~500 KB WebP before leaving the device.
 */

import type { CompressOptions, CompressedImage } from '@cgraph-dev/shared-types';
import { logger } from '@/lib/logger';

const DEFAULT_MAX_DIMENSION = 4096;
const DEFAULT_QUALITY = 0.85;
const SIZE_THRESHOLD = 5 * 1024 * 1024; // 5 MB

/**
 * Determines whether a file should be pre-compressed before upload.
 *
 * Returns true if the image exceeds 4096px on any edge or is larger than 5 MB.
 * Requires loading the image to check dimensions, so this is async.
 */
export async function shouldCompress(file: File): Promise<boolean> {
  if (file.size > SIZE_THRESHOLD) return true;

  try {
    const bitmap = await createImageBitmap(file);
    const needs = bitmap.width > DEFAULT_MAX_DIMENSION || bitmap.height > DEFAULT_MAX_DIMENSION;
    bitmap.close();
    return needs;
  } catch {
    return false;
  }
}

/**
 * Compresses an image file for upload.
 *
 * - Resizes to fit within `maxDimension` (default 4096) on longest edge
 * - Strips EXIF metadata (canvas re-draw inherently strips it)
 * - Preserves orientation (browser handles EXIF orientation on `createImageBitmap`)
 * - Outputs WebP if supported, falls back to JPEG at quality 0.85
 */
export async function compressImage(file: File, opts?: CompressOptions): Promise<CompressedImage> {
  const maxDim = opts?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = opts?.quality ?? DEFAULT_QUALITY;
  const preferredFormat = opts?.format ?? 'webp';

  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Calculate target dimensions (maintain aspect ratio)
  let targetW = origW;
  let targetH = origH;

  if (origW > maxDim || origH > maxDim) {
    if (origW >= origH) {
      targetW = maxDim;
      targetH = Math.round((origH / origW) * maxDim);
    } else {
      targetH = maxDim;
      targetW = Math.round((origW / origH) * maxDim);
    }
  }

  // Draw to canvas (strips EXIF, applies orientation)
  const blob = await renderToBlob(bitmap, targetW, targetH, quality, preferredFormat);
  bitmap.close();

  const result: CompressedImage = {
    blob,
    width: targetW,
    height: targetH,
    originalSize: file.size,
    compressedSize: blob.size,
  };

  logger.info('client_precompression', {
    platform: 'web',
    original_size: file.size,
    compressed_size: blob.size,
    width: targetW,
    height: targetH,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Internal — rendering
// ---------------------------------------------------------------------------

async function renderToBlob(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  format: 'webp' | 'jpeg'
): Promise<Blob> {
  // Prefer OffscreenCanvas (runs off main thread in supported browsers)
  if (typeof OffscreenCanvas !== 'undefined') {
    return renderOffscreen(bitmap, width, height, quality, format);
  }

  return renderOnscreen(bitmap, width, height, quality, format);
}

async function renderOffscreen(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  format: 'webp' | 'jpeg'
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get OffscreenCanvas 2d context');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  // Try WebP first, fall back to JPEG
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

  try {
    return await canvas.convertToBlob({ type: mimeType, quality });
  } catch {
    // WebP not supported — fall back to JPEG
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
}

async function renderOnscreen(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  format: 'webp' | 'jpeg'
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // WebP not supported — retry as JPEG
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) resolve(jpegBlob);
              else reject(new Error('Canvas toBlob failed'));
            },
            'image/jpeg',
            quality
          );
        }
      },
      mimeType,
      quality
    );
  });
}
