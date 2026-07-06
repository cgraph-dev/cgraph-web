import {
  ALL_PROFILE_THEMES as SHARED_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME as SHARED_DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_BUNDLE_IDS as SHARED_PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES as SHARED_PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
  getProfileThemeAssetManifestById,
  getProfileThemeBundleAssetManifestById,
  getProfileThemeBundleById as getSharedProfileThemeBundleById,
  getThemesByCategory as getSharedThemesByCategory,
} from '@cgraph-dev/shared-types';
import { describe, expect, it } from 'vitest';

import {
  ALL_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME,
  PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORIES,
  getProfileThemeBundleById,
  getProfileThemeOrDefault,
  getThemesByCategory,
} from '../profileThemes';

describe('profile theme catalog adapter', () => {
  it('uses the shared package catalog ids as the source of truth', () => {
    expect(ALL_PROFILE_THEMES.map((theme) => theme.id)).toEqual(
      SHARED_PROFILE_THEMES.map((theme) => theme.id)
    );
    expect(DEFAULT_PROFILE_THEME.id).toBe(SHARED_DEFAULT_PROFILE_THEME.id);
    expect(getProfileThemeOrDefault(DEFAULT_PROFILE_THEME_ID).id).toBe(DEFAULT_PROFILE_THEME_ID);
    expect(PROFILE_THEME_BUNDLE_IDS).toEqual(SHARED_PROFILE_THEME_BUNDLE_IDS);
    expect(PROFILE_THEME_BUNDLES.map((bundle) => bundle.id)).toEqual(
      SHARED_PROFILE_THEME_BUNDLES.map((bundle) => bundle.id)
    );
    expect(getProfileThemeBundleById('signal-noir-founder')?.id).toBe(
      getSharedProfileThemeBundleById('signal-noir-founder')?.id
    );
  });

  it('keeps mutable web arrays as adapter copies for legacy picker props', () => {
    expect(ALL_PROFILE_THEMES).not.toBe(SHARED_PROFILE_THEMES);
    expect(PROFILE_THEME_CATEGORIES).toEqual(SHARED_PROFILE_THEME_CATEGORIES);
    expect(PROFILE_THEME_CATEGORIES).not.toBe(SHARED_PROFILE_THEME_CATEGORIES);

    const signalThemes = getThemesByCategory('signal');
    const sharedSignalThemes = getSharedThemesByCategory('signal');

    expect(signalThemes.map((theme) => theme.id)).toEqual(
      sharedSignalThemes.map((theme) => theme.id)
    );
    expect(signalThemes).not.toBe(sharedSignalThemes);
    expect(signalThemes[0].profileBackgroundImage).toContain('profile_signal_noir');
  });

  it('exposes web renderer assets without inventing new profile theme ids', () => {
    const expectedAssetSlugs = {
      'signal-noir': 'signal_noir',
      'aurora-glass': 'aurora_glass',
      'retro-terminal': 'retro_terminal',
      'solarpunk-canopy': 'solarpunk_canopy',
      'deep-space': 'deep_space',
      'sakura-dream': 'sakura_dream',
      'ember-forge': 'ember_forge',
      'neon-rain-district': 'neon_rain_district',
      'arcane-library': 'arcane_library',
      'ocean-abyss-lab': 'ocean_abyss_lab',
      'celestial-throne': 'celestial_throne',
      'toxic-reactor-core': 'toxic_reactor_core',
    } as const;

    for (const [themeId, slug] of Object.entries(expectedAssetSlugs)) {
      const theme = getProfileThemeOrDefault(themeId);
      const manifest = getProfileThemeAssetManifestById(theme.id);

      expect(theme.previewImage).toBe(manifest?.preview.image);
      expect(theme.profileBackgroundImage).toBe(manifest?.profileBackground.image);
      expect(theme.miniProfileBackgroundImage).toBe(manifest?.miniProfileBackground.image);
      expect(theme.previewImage).toContain(`theme_${slug}_preview`);
      expect(theme.profileBackgroundImage).toContain(`profile_${slug}`);
      expect(theme.miniProfileBackgroundImage).toContain(`mini_${slug}`);
    }

    expect(ALL_PROFILE_THEMES).toHaveLength(SHARED_PROFILE_THEMES.length);
  });

  it('exposes profile and mini-profile background assets for themed bundles', () => {
    expect(DEFAULT_PROFILE_THEME.profileBackgroundImage).toContain('/profile-background/');
    expect(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage).toContain('/mini-profile-background/');

    const bundle = getProfileThemeBundleById('signal-noir-founder');
    const bundleManifest = getProfileThemeBundleAssetManifestById('signal-noir-founder');

    expect(bundle?.includes.profileThemeId).toBe(DEFAULT_PROFILE_THEME_ID);
    expect(bundle?.profileBackgroundImage).toBe(bundleManifest?.profileBackground.image);
    expect(bundle?.miniProfileBackgroundImage).toBe(bundleManifest?.miniProfileBackground.image);
    expect(bundle?.profileBackgroundImage).toContain('profile_signal_noir_founder');
    expect(bundle?.miniProfileBackgroundImage).toContain('mini_signal_noir_founder');
    expect(bundle?.profileBackgroundImage).not.toBe(DEFAULT_PROFILE_THEME.profileBackgroundImage);
    expect(bundle?.miniProfileBackgroundImage).not.toBe(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage);
  });
});
