/**
 * Constants for IdentityCustomization module
 *
 * NOTE: Mock border, title, and badge data has been removed.
 * Border, title, and badge data is now fetched from the backend API.
 */

import { RARITY_COLORS, RARITY_LABELS, RARITY_TIERS } from '@cgraph-dev/shared-types/rarity';
import type { RarityOption, Rarity } from './types';

export const RARITIES: RarityOption[] = RARITY_TIERS.map((rarity) => ({
  value: rarity,
  label: RARITY_LABELS[rarity],
  color: RARITY_COLORS[rarity],
}));

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Rarity): string {
  return RARITY_COLORS[rarity] || 'text-gray-400';
}
