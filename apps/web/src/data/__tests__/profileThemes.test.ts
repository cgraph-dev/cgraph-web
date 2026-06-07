import {
  ALL_PROFILE_THEMES as SHARED_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME as SHARED_DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_BUNDLE_IDS as SHARED_PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES as SHARED_PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
  getProfileThemeOrDefault as getSharedProfileThemeOrDefault,
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
  it('uses the shared package catalog as the source of truth', () => {
    expect(ALL_PROFILE_THEMES).toEqual(SHARED_PROFILE_THEMES);
    expect(DEFAULT_PROFILE_THEME).toEqual(SHARED_DEFAULT_PROFILE_THEME);
    expect(getProfileThemeOrDefault(DEFAULT_PROFILE_THEME_ID)).toEqual(
      getSharedProfileThemeOrDefault(DEFAULT_PROFILE_THEME_ID)
    );
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

  it('exposes profile and mini-profile background assets for themed bundles', () => {
    expect(DEFAULT_PROFILE_THEME.profileBackgroundImage).toContain('/profile-background/');
    expect(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage).toContain('/mini-profile-background/');

    const bundle = getProfileThemeBundleById('signal-noir-founder');

    expect(bundle?.includes.profileThemeId).toBe(DEFAULT_PROFILE_THEME_ID);
    expect(bundle?.profileBackgroundImage).toBe(DEFAULT_PROFILE_THEME.profileBackgroundImage);
    expect(bundle?.miniProfileBackgroundImage).toBe(DEFAULT_PROFILE_THEME.miniProfileBackgroundImage);
  });
});
