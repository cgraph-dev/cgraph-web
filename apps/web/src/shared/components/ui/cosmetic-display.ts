import { ALL_BADGES, type BadgeRarity } from '@/data/badgesCollection';
import { ALL_TITLES } from '@/data/titlesCollection';

export interface TitleDisplay {
  name: string;
  gradient: string;
  lottieUrl: string;
  imageUrl?: string;
}

const TITLE_DISPLAY_NAMES: Record<string, TitleDisplay> = Object.fromEntries(
  ALL_TITLES.map((title) => [
    title.id,
    {
      name: title.displayName,
      gradient: title.gradient,
      lottieUrl: title.lottieUrl ?? '/lottie/effects/placeholder.json',
      imageUrl: title.imageUrl ?? title.previewUrl,
    },
  ])
);

const RARE_TITLE_IDS = ALL_TITLES.filter(
  (title) => title.rarity === 'legendary' || title.rarity === 'mythic'
).map((title) => title.id);

export function isRareTitle(titleId: string | null): boolean {
  return titleId !== null && RARE_TITLE_IDS.includes(titleId);
}

export function getTitleDisplay(titleId: string | null): TitleDisplay | null {
  return titleId ? (TITLE_DISPLAY_NAMES[titleId] ?? null) : null;
}

export const BADGE_RARITY_HEX: Record<BadgeRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

export interface BadgeDisplay {
  icon: string;
  color: string;
  name: string;
  rarity: BadgeRarity;
  lottieUrl: string;
  imageUrl?: string;
  animationType: 'lottie';
}

export const BADGE_DISPLAY_MAP: Record<string, BadgeDisplay> = Object.fromEntries(
  ALL_BADGES.map((badge) => [
      badge.id,
      {
        icon: badge.icon,
        color: BADGE_RARITY_HEX[badge.rarity],
        name: badge.name,
        rarity: badge.rarity,
        lottieUrl: badge.lottieUrl ?? '/lottie/effects/placeholder.json',
        imageUrl: badge.imageUrl ?? badge.previewUrl,
        animationType: 'lottie',
      },
    ])
);

export function resolveEquippedBadges(badgeIds: string[]): BadgeDisplay[] {
  return badgeIds
    .map((id) => BADGE_DISPLAY_MAP[id])
    .filter((badge): badge is BadgeDisplay => badge !== undefined);
}
