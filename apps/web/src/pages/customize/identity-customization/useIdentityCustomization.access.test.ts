import { describe, expect, it } from 'vitest';

import {
  getOwnedNameplateIdsForCustomization,
  hasPremiumAccessForCustomization,
  isBorderUnlockedForCustomization,
  isTitleUnlockedForCustomization,
} from './useIdentityCustomization';

describe('identity customization premium access', () => {
  it('treats owner-granted premium as customization access', () => {
    expect(hasPremiumAccessForCustomization({ isPremium: true, subscription: null })).toBe(true);
    expect(
      hasPremiumAccessForCustomization({
        isPremium: false,
        subscription: { tier: 'enterprise', status: 'active' },
      })
    ).toBe(true);
  });

  it('unlocks premium catalog borders without requiring an inventory row', () => {
    expect(
      isBorderUnlockedForCustomization(
        { id: 'aurora', unlocked: false, isPremium: true },
        new Set(),
        true
      )
    ).toBe(true);
  });

  it('unlocks premium catalog titles without requiring an inventory row', () => {
    expect(
      isTitleUnlockedForCustomization(
        { id: 'founder', unlocked: false, isPremium: false, category: 'premium' },
        new Set(),
        true
      )
    ).toBe(true);
  });

  it('adds premium nameplates to the owned nameplate list', () => {
    const owned = getOwnedNameplateIdsForCustomization(new Set(), true);
    expect(owned.length).toBeGreaterThan(
      getOwnedNameplateIdsForCustomization(new Set(), false).length
    );
  });
});
