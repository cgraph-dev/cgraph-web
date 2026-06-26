import {
  ALL_BADGES as SHARED_BADGES,
  type BadgeDefinition,
  type BadgeRarity,
} from '@cgraph-dev/animation-constants';

export type { BadgeDefinition, BadgeRarity };

const PIXELLAB_BADGE_ASSET_ROOT = '/cosmetics/pixellab/badge';

function getBadgeImageUrl(id: string): string {
  return `${PIXELLAB_BADGE_ASSET_ROOT}/${id}/${id}_0.png`;
}

function withReleaseBadgeArt(badge: BadgeDefinition): BadgeDefinition {
  const imageUrl = getBadgeImageUrl(badge.id);

  return {
    ...badge,
    imageUrl,
    previewUrl: imageUrl,
    lottieUrl: undefined,
    animationType: 'static',
  };
}

export const ALL_BADGES: BadgeDefinition[] = SHARED_BADGES.map(withReleaseBadgeArt);

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((badge) => badge.id === id);
}

export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return ALL_BADGES.filter((badge) => badge.rarity === rarity);
}

export function getUnlockedBadges(): BadgeDefinition[] {
  return ALL_BADGES.filter((badge) => badge.unlocked);
}
