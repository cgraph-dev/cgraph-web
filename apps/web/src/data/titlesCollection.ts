/**
 * Compatibility adapter for the shared titles catalogue.
 *
 * Older web surfaces import `titlesCollection` and expect Tailwind classes,
 * grouped categories, and a simplified `TitleDefinition` shape. The canonical
 * catalogue now lives in `@cgraph-dev/animation-constants` so web, mobile, profile
 * cards, and settings all render the same title IDs.
 */

import {
  TITLES as SHARED_TITLES,
  TITLE_RARITY_COLORS as SHARED_TITLE_RARITY_COLORS,
} from '@cgraph-dev/animation-constants';
import type { Title } from '@cgraph-dev/animation-constants';

export type TitleRarity = (typeof SHARED_TITLES)[number]['rarity'];
export type TitleAnimationType = (typeof SHARED_TITLES)[number]['animation']['type'];
export type TitleCategoryId = (typeof SHARED_TITLES)[number]['category'];

export interface TitleDefinition {
  id: string;
  name: string;
  displayName: string;
  rarity: TitleRarity;
  category: TitleCategoryId;
  animationType: TitleAnimationType;
  gradient: string;
  colors: string[];
  lottieUrl?: string;
  isPremium: boolean;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  description: string;
}

export interface TitleCategory {
  id: TitleCategoryId;
  name: string;
  icon: string;
  titles: TitleDefinition[];
}

export const RARITY_COLORS: Record<
  TitleRarity,
  { primary: string; secondary: string; glow: string }
> = SHARED_TITLE_RARITY_COLORS;

export const TITLE_BADGE_COLORS: Record<TitleRarity, { bg: string; text: string; glow: string }> =
  {
    free: {
      bg: 'bg-gray-600/50',
      text: 'text-gray-300',
      glow: SHARED_TITLE_RARITY_COLORS.free.glow,
    },
    common: {
      bg: 'bg-gray-500/50',
      text: 'text-gray-200',
      glow: SHARED_TITLE_RARITY_COLORS.common.glow,
    },
    rare: {
      bg: 'bg-blue-600/50',
      text: 'text-blue-300',
      glow: SHARED_TITLE_RARITY_COLORS.rare.glow,
    },
    epic: {
      bg: 'bg-purple-600/50',
      text: 'text-purple-300',
      glow: SHARED_TITLE_RARITY_COLORS.epic.glow,
    },
    legendary: {
      bg: 'bg-yellow-600/50',
      text: 'text-yellow-300',
      glow: SHARED_TITLE_RARITY_COLORS.legendary.glow,
    },
    mythic: {
      bg: 'bg-gradient-to-r from-pink-500 to-purple-500',
      text: 'text-white',
      glow: SHARED_TITLE_RARITY_COLORS.mythic.glow,
    },
  };

// Backward-compatible name used by older UI code.
export const TITLE_RARITY_COLORS = TITLE_BADGE_COLORS;

const CATEGORY_META: Record<TitleCategoryId, { name: string; icon: string }> = {
  achievement: { name: 'Achievements', icon: 'Trophy' },
  premium: { name: 'Premium', icon: 'Gem' },
  event: { name: 'Events', icon: 'Sparkles' },
  leaderboard: { name: 'Leaderboard', icon: 'Crown' },
  special: { name: 'Special', icon: 'Star' },
};

const RARITY_TEXT_CLASS: Record<TitleRarity, string> = {
  free: 'text-gray-400',
  common: 'text-slate-300',
  rare: 'text-blue-300',
  epic: 'text-purple-300',
  legendary: 'text-amber-300',
  mythic: 'text-pink-300',
};

const STARTER_TITLE_IDS = new Set(['newcomer']);

function gradientClassForTitle(title: Title): string {
  return RARITY_TEXT_CLASS[title.rarity];
}

function colorsForTitle(title: Title): string[] {
  return title.gradientColors && title.gradientColors.length > 0
    ? [...title.gradientColors]
    : [title.color];
}

function isStarterTitle(title: Title): boolean {
  return (
    title.rarity === 'free' ||
    STARTER_TITLE_IDS.has(title.id) ||
    title.unlockRequirement?.toLowerCase() === 'create an account'
  );
}

function toTitleDefinition(title: Title): TitleDefinition {
  return {
    id: title.id,
    name: title.name,
    displayName: title.displayName,
    rarity: title.rarity,
    category: title.category,
    animationType: title.animation.type,
    gradient: gradientClassForTitle(title),
    colors: colorsForTitle(title),
    lottieUrl: title.lottieUrl ?? 'effects/placeholder.json',
    isPremium: Boolean(title.nodePrice && title.nodePrice > 0),
    unlocked: isStarterTitle(title),
    unlockRequirement: title.unlockRequirement,
    description: title.description,
  };
}

export const ALL_TITLES: TitleDefinition[] = SHARED_TITLES.map(toTitleDefinition);

const CATEGORY_ORDER: TitleCategoryId[] = [
  'achievement',
  'premium',
  'event',
  'leaderboard',
  'special',
];

export const TITLE_CATEGORIES: TitleCategory[] = CATEGORY_ORDER.map((category) => ({
  id: category,
  ...CATEGORY_META[category],
  titles: ALL_TITLES.filter((title) => title.category === category),
}));

/**
 * Finds a title definition by its canonical shared catalogue ID.
 */
export function getTitleById(id: string): TitleDefinition | undefined {
  return ALL_TITLES.find((title) => title.id === id);
}

/**
 * Returns all titles that belong to a shared catalogue category.
 */
export function getTitlesByCategory(category: TitleCategoryId): TitleDefinition[] {
  return ALL_TITLES.filter((title) => title.category === category);
}

/**
 * Returns all titles matching a rarity tier.
 */
export function getTitlesByRarity(rarity: TitleRarity): TitleDefinition[] {
  return ALL_TITLES.filter((title) => title.rarity === rarity);
}

/**
 * Returns titles that every user can equip without a paid inventory row.
 */
export function getUnlockedTitles(): TitleDefinition[] {
  return ALL_TITLES.filter((title) => title.unlocked);
}

/**
 * Returns titles that are priced or otherwise premium in the shared catalogue.
 */
export function getPremiumTitles(): TitleDefinition[] {
  return ALL_TITLES.filter((title) => title.isPremium);
}
