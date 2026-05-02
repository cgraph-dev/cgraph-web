/**
 * Constants for IdentityCustomization module
 *
 * NOTE: Mock border, title, and badge data has been removed.
 * Border, title, and badge data is now fetched from the backend API.
 */

import type { RarityOption, Rarity } from './types';
import type { AvatarBorderType } from '@/modules/settings/store/customization/customizationStore.types';

export const RARITIES: RarityOption[] = [
  { value: 'free', label: 'Free', color: 'text-gray-500' },
  { value: 'common', label: 'Common', color: 'text-gray-400' },
  { value: 'uncommon', label: 'Uncommon', color: 'text-green-400' },
  { value: 'rare', label: 'Rare', color: 'text-blue-400' },
  { value: 'epic', label: 'Epic', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legendary', color: 'text-yellow-400' },
  { value: 'mythic', label: 'Mythic', color: 'text-pink-400' },
];

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    free: 'text-gray-500',
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };
  return colors[rarity] || 'text-gray-400';
}

/**
 * Map legacy border animation types to store AvatarBorderType
 */
export function getV2BorderType(animation: string): AvatarBorderType {
  const animationToV2: Record<string, AvatarBorderType> = {
    none: 'none',
    pulse: 'pulse',
    rotate: 'rotate',
    glow: 'glow',
    spark: 'electric',
    'gradient-rotate': 'rotate',
    flame: 'fire',
    fire: 'fire',
    shimmer: 'glow',
    drip: 'ice',
    ice: 'ice',
    particles: 'legendary',
    aurora: 'legendary',
    void: 'mythic',
    electric: 'electric',
    holographic: 'rotate',
    galaxy: 'legendary',
    'pixel-pulse': 'pulse',
    'scan-line': 'rotate',
    glitch: 'electric',
    'sakura-fall': 'legendary',
    wave: 'pulse',
    'energy-surge': 'electric',
    smoke: 'glow',
    'neon-flicker': 'electric',
    rainbow: 'rotate',
  };
  return animationToV2[animation] || 'none';
}
