import { describe, expect, it } from 'vitest';
import { ALL_BADGES } from '@/data/badgesCollection';
import { ALL_TITLES } from '@/data/titlesCollection';
import {
  BADGE_DISPLAY_MAP,
  getTitleDisplay,
  isRareTitle,
  resolveEquippedBadges,
} from '../cosmetic-display';

describe('cosmetic display adapter', () => {
  it('resolves title display data from the package-backed title catalog', () => {
    const title = ALL_TITLES[0]!;

    expect(getTitleDisplay(title.id)).toEqual({
      name: title.displayName,
      gradient: title.gradient,
      lottieUrl: title.lottieUrl ?? '/lottie/effects/placeholder.json',
    });
    expect(getTitleDisplay(null)).toBeNull();
    expect(getTitleDisplay('missing-title')).toBeNull();
  });

  it('marks legendary and mythic titles as rare display titles', () => {
    const rareTitle = ALL_TITLES.find(
      (title) => title.rarity === 'legendary' || title.rarity === 'mythic'
    )!;
    const regularTitle = ALL_TITLES.find(
      (title) => title.rarity !== 'legendary' && title.rarity !== 'mythic'
    )!;

    expect(isRareTitle(rareTitle.id)).toBe(true);
    expect(isRareTitle(regularTitle.id)).toBe(false);
    expect(isRareTitle(null)).toBe(false);
  });

  it('resolves badge display data from the package-backed badge catalog', () => {
    const badge = ALL_BADGES[0]!;

    expect(BADGE_DISPLAY_MAP[badge.id]).toMatchObject({
      icon: badge.icon,
      name: badge.name,
      rarity: badge.rarity,
      lottieUrl: badge.lottieUrl ?? '/lottie/effects/placeholder.json',
      animationType: 'lottie',
    });
    expect(resolveEquippedBadges([badge.id, 'missing-badge'])).toEqual([
      BADGE_DISPLAY_MAP[badge.id],
    ]);
  });
});
