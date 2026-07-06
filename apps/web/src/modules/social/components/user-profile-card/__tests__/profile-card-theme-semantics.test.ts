import { describe, expect, it } from 'vitest';
import {
  PROFILE_THEME_ASSET_MANIFESTS,
  PROFILE_RENDERING_ANCHORS,
  PROFILE_RENDERING_SURFACE_IDS,
  getProfileThemeAssetManifestById,
} from '@cgraph-dev/shared-types';

import {
  ALL_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_IDS,
} from '@/data/profileThemes';

import { ACCENT_THEMES, normalizeAccentThemeId } from '../constants';

describe('profile card theme semantics', () => {
  it('derives every profile card accent theme from the shared profile-theme catalog', () => {
    expect(Object.keys(ACCENT_THEMES)).toEqual([...PROFILE_THEME_IDS]);

    for (const theme of ALL_PROFILE_THEMES) {
      const accentTheme = ACCENT_THEMES[theme.id];

      expect(accentTheme).toBeDefined();
      expect(accentTheme.accent).toBe(theme.accentPrimary);
      expect(accentTheme.banner).toContain(theme.backgroundGradient[0]);
      expect(accentTheme.banner).toContain(
        theme.backgroundGradient[theme.backgroundGradient.length - 1]
      );
      expect(accentTheme.rgb).toMatch(/^\d+,\d+,\d+$/);
      expect(accentTheme.assetManifest).toBe(getProfileThemeAssetManifestById(theme.id));
      expect(accentTheme.profileBackgroundImage).toBe(
        accentTheme.assetManifest.profileBackground.image
      );
      expect(accentTheme.miniProfileBackgroundImage).toBe(
        accentTheme.assetManifest.miniProfileBackground.image
      );
    }
  });

  it('normalizes profile card theme ids through the shared package guard', () => {
    expect(normalizeAccentThemeId(DEFAULT_PROFILE_THEME_ID)).toBe(DEFAULT_PROFILE_THEME_ID);
    expect(normalizeAccentThemeId('deep-space')).toBe('deep-space');
    expect(normalizeAccentThemeId('profile-default')).toBeUndefined();
    expect(normalizeAccentThemeId(null)).toBeUndefined();
  });

  it('exposes full and mini profile backgrounds for themed profile bundles', () => {
    const signalNoir = ACCENT_THEMES[DEFAULT_PROFILE_THEME_ID];

    expect(signalNoir.bundleId).toBe('signal-noir-founder');
    expect(signalNoir.profileBackgroundImage).toContain('/profile-background/');
    expect(signalNoir.miniProfileBackgroundImage).toContain('/mini-profile-background/');
  });

  it('keeps profile theme rendering structure owned by shared anchors', () => {
    expect(PROFILE_THEME_ASSET_MANIFESTS).toHaveLength(ALL_PROFILE_THEMES.length);
    expect(PROFILE_RENDERING_ANCHORS.map(({ id }) => id)).toEqual([
      ...PROFILE_RENDERING_SURFACE_IDS,
    ]);

    for (const theme of ALL_PROFILE_THEMES) {
      expect(ACCENT_THEMES[theme.id].profileBackgroundImage).toBeDefined();

      for (const anchor of PROFILE_RENDERING_ANCHORS) {
        expect(anchor.profileTheme.movesStructure).toBe(false);
        expect(anchor.slots).toContain('profile-theme');
        expect(anchor.slots).toContain('avatar');
        expect(anchor.avatar.statusAttachedTo).toBe('avatar-container');
      }
    }
  });
});
