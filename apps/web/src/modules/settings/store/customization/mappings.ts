/**
 * Customization ID Mappings
 *
 * Centralized mapping constants for converting between item IDs and their
 * corresponding customization types. Used throughout the app for consistent
 * type resolution.
 *
 */

// Import types directly from types file to avoid circular dep through barrel
import type { AvatarBorderType, ThemePreset } from './customizationStore.types';

// AVATAR BORDER MAPPINGS

/**
 * Maps avatar border item IDs to their animation types.
 * Used by IdentityCustomization and LivePreviewPanel for border rendering.
 */
export const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = {
  b1: 'static',
  b2: 'static',
  b3: 'static',
  b4: 'static',
  b5: 'pulse',
  b6: 'rotate',
  b7: 'glow',
  b8: 'electric',
  b9: 'rotate',
  b10: 'fire',
  b11: 'ice',
  b12: 'glow',
  b13: 'fire',
  b14: 'legendary',
  b15: 'mythic',
  b16: 'fire',
  b17: 'mythic',
  b18: 'legendary',
};

// THEME MAPPINGS

/**
 * Maps profile theme IDs to color presets.
 * Used for determining avatar border colors and profile backgrounds.
 */
export const PROFILE_THEME_TO_COLOR: Record<string, ThemePreset> = {
  'signal-noir': 'cyan',
  'aurora-glass': 'cyan',
  'retro-terminal': 'emerald',
  'solarpunk-canopy': 'gold',
  'deep-space': 'purple',
  'sakura-dream': 'pink',
  'ember-forge': 'orange',
  'profile-default': 'purple',
  'classic-purple': 'purple',
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'profile-sunset': 'orange',
  'profile-midnight': 'purple',
  'profile-cherry': 'pink',
};

/**
 * Maps theme IDs to ThemePreset for global theming.
 * Includes mappings for profile, chat, and app themes.
 */
export const THEME_ID_TO_PRESET: Record<string, ThemePreset> = {
  // Profile themes
  'signal-noir': 'cyan',
  'aurora-glass': 'cyan',
  'retro-terminal': 'emerald',
  'solarpunk-canopy': 'gold',
  'deep-space': 'purple',
  'sakura-dream': 'pink',
  'ember-forge': 'orange',
  'profile-default': 'purple',
  'classic-purple': 'purple',
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'profile-sunset': 'orange',
  'profile-midnight': 'purple',
  'profile-cherry': 'pink',
  // App themes
  'app-default': 'emerald',
  'app-dark': 'purple',
  'app-light': 'cyan',
};

// CHAT_THEME_TO_COLOR archived

// CHAT BUBBLE MAPPINGS

// BUBBLE_ID_TO_STYLE archived

// EFFECT_ID_TO_ANIMATION archived

// TITLE MAPPINGS

import { ALL_TITLES } from '@/data/titlesCollection';

/**
 * Title display configuration with name and gradient styling.
 */
export interface TitleDisplay {
  name: string;
  gradient: string;
  lottieUrl: string;
}

/**
 * Maps title IDs to display names and gradient classes.
 * Generated dynamically from the static titles collection.
 */
export const TITLE_DISPLAY_NAMES: Record<string, TitleDisplay> = Object.fromEntries(
  ALL_TITLES.map((t) => [
    t.id,
    {
      name: t.displayName,
      gradient: t.gradient,
      lottieUrl: t.lottieUrl ?? '/lottie/effects/placeholder.json',
    },
  ])
);

/**
 * Legendary and mythic title IDs for special rendering.
 */
export const LEGENDARY_TITLE_IDS = ALL_TITLES.filter(
  (t) => t.rarity === 'legendary' || t.rarity === 'mythic'
).map((t) => t.id);
export const MYTHIC_TITLE_IDS = ALL_TITLES.filter((t) => t.rarity === 'mythic').map((t) => t.id);
export const RARE_TITLE_IDS = [...LEGENDARY_TITLE_IDS] as const;

// HELPER FUNCTIONS

/**
 * Gets the border type for a given border ID.
 * Returns 'none' if the ID is not found.
 */
export function getBorderType(borderId: string | null): AvatarBorderType {
  return borderId ? (BORDER_ID_TO_TYPE[borderId] ?? 'none') : 'none';
}

/**
 * Gets the theme color preset for a given theme ID.
 * Returns 'emerald' as the default if not found.
 */
export function getThemeColor(themeId: string | null): ThemePreset {
  return themeId ? (PROFILE_THEME_TO_COLOR[themeId] ?? 'emerald') : 'emerald';
}

/**
 * Gets the theme preset for any theme ID (profile, chat, or app).
 * Returns 'emerald' as the default if not found.
 */
export function getThemePreset(themeId: string | null): ThemePreset {
  return themeId ? (THEME_ID_TO_PRESET[themeId] ?? 'emerald') : 'emerald';
}

// getBubbleStyle, getBubbleAnimation, getChatThemeColor archived

/**
 * Checks if a title ID is legendary or mythic (special rendering).
 */
export function isRareTitle(titleId: string | null): boolean {
  return titleId !== null && RARE_TITLE_IDS.includes(titleId);
}

/**
 * Gets the display configuration for a title.
 */
export function getTitleDisplay(titleId: string | null): TitleDisplay | null {
  return titleId ? (TITLE_DISPLAY_NAMES[titleId] ?? null) : null;
}

// BADGE MAPPINGS

import { ALL_BADGES } from '@/data/badgesCollection';
import type { BadgeRarity } from '@/data/badgesCollection';

/**
 * Hex colors for badge rarities, used in live preview rendering.
 */
export const BADGE_RARITY_HEX: Record<BadgeRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

/**
 * Badge display data for live preview rendering.
 */
export interface BadgeDisplay {
  icon: string;
  color: string;
  name: string;
  rarity: BadgeRarity;
  lottieUrl: string;
  animationType: 'lottie';
}

/**
 * Maps badge IDs to display data for the live preview.
 * Generated dynamically from the static badges collection.
 */
export const BADGE_DISPLAY_MAP: Record<string, BadgeDisplay> = Object.fromEntries(
  ALL_BADGES.map((b) => [
    b.id,
    {
      icon: b.icon,
      color: BADGE_RARITY_HEX[b.rarity],
      name: b.name,
      rarity: b.rarity,
      lottieUrl: b.lottieUrl ?? '/lottie/effects/placeholder.json',
      animationType: 'lottie',
    },
  ])
);

/**
 * Resolves an array of badge IDs to their display data.
 * Returns only badges that exist in the collection.
 */
export function resolveEquippedBadges(badgeIds: string[]): BadgeDisplay[] {
  return badgeIds
    .map((id) => BADGE_DISPLAY_MAP[id])
    .filter((b): b is BadgeDisplay => b !== undefined);
}
