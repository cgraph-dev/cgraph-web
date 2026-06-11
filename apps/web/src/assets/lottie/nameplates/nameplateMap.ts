/**
 * Nameplate Lottie asset map — Web version.
 *
 * Maps nameplate IDs to their Lottie JSON imports.
 * Image-backed nameplates render through registry imageUrl values instead.
 *
 */

import placeholder from './placeholder.json';

/**
 * Maps nameplate IDs → Lottie JSON source.
 *
 * When Lottie-backed plates are added, import them here by ID.
 */
/** Lottie JSON animation data — each entry is a parsed JSON object. */
const NAMEPLATE_LOTTIE_MAP: Record<string, Record<string, unknown>> = {};

/** Fallback source for missing nameplates */
export const NAMEPLATE_FALLBACK = placeholder;

/**
 * Resolve a Lottie source for a given nameplate ID.
 * Returns undefined for 'plate_none' or unknown IDs.
 */
export function getNameplateLottieSource(
  nameplateId: string | null
): Record<string, unknown> | undefined {
  if (!nameplateId || nameplateId === 'plate_none') return undefined;
  return NAMEPLATE_LOTTIE_MAP[nameplateId] ?? NAMEPLATE_FALLBACK;
}
