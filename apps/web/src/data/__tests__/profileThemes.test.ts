import {
  ALL_PROFILE_THEMES as SHARED_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME as SHARED_DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_BUNDLE_IDS as SHARED_PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES as SHARED_PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
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
    expect(PROFILE_THEME_BUNDLES).toEqual(SHARED_PROFILE_THEME_BUNDLES);
    expect(getProfileThemeBundleById('signal-noir-founder')).toEqual(
      getSharedProfileThemeBundleById('signal-noir-founder')
    );
  });

  it('keeps mutable web arrays as adapter copies for legacy picker props', () => {
    expect(ALL_PROFILE_THEMES).not.toBe(SHARED_PROFILE_THEMES);
    expect(PROFILE_THEME_CATEGORIES).toEqual(SHARED_PROFILE_THEME_CATEGORIES);
    expect(PROFILE_THEME_CATEGORIES).not.toBe(SHARED_PROFILE_THEME_CATEGORIES);

    const signalThemes = getThemesByCategory('signal');

    expect(signalThemes).toEqual(getSharedThemesByCategory('signal'));
    expect(signalThemes).not.toBe(getSharedThemesByCategory('signal'));
  });

  it('exposes package-owned renderer assets without inventing new profile theme ids', () => {
    const aurora = getProfileThemeOrDefault('aurora-glass');
    const ember = getProfileThemeOrDefault('ember-forge');
    const deepSpace = getProfileThemeOrDefault('deep-space');

    expect(aurora.profileBackgroundImage).toContain('profile_ranked_ascendant');
    expect(aurora.miniProfileBackgroundImage).toContain('mini_ranked_ascendant');
    expect(ember.profileBackgroundImage).toContain('profile_ember_colossus');
    expect(deepSpace.profileBackgroundImage).toContain('profile_void_relay');
    expect(ALL_PROFILE_THEMES).toHaveLength(SHARED_PROFILE_THEMES.length);
  });

  it('exposes profile and mini-profile background assets for themed bundles', () => {
    expect(DEFAULT_PROFILE_THEME.profileBackgroundImage).toContain('/profile-background/');
    expect(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage).toContain('/mini-profile-background/');

    const bundle = getProfileThemeBundleById('signal-noir-founder');

    expect(bundle?.includes.profileThemeId).toBe(DEFAULT_PROFILE_THEME_ID);
    expect(bundle?.profileBackgroundImage).toBe(DEFAULT_PROFILE_THEME.profileBackgroundImage);
    expect(bundle?.miniProfileBackgroundImage).toBe(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage);
  });
});
