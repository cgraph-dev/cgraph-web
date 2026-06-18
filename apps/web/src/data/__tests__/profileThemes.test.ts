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
    const signal = getProfileThemeOrDefault('signal-noir');
    const aurora = getProfileThemeOrDefault('aurora-glass');
    const retro = getProfileThemeOrDefault('retro-terminal');
    const solarpunk = getProfileThemeOrDefault('solarpunk-canopy');
    const ember = getProfileThemeOrDefault('ember-forge');
    const deepSpace = getProfileThemeOrDefault('deep-space');
    const sakura = getProfileThemeOrDefault('sakura-dream');

    expect(signal.profileBackgroundImage).toContain('profile_signal_noir');
    expect(aurora.profileBackgroundImage).toContain('profile_aurora_glass');
    expect(retro.profileBackgroundImage).toContain('profile_retro_terminal');
    expect(solarpunk.profileBackgroundImage).toContain('profile_solarpunk_canopy');
    expect(deepSpace.profileBackgroundImage).toContain('profile_deep_space');
    expect(sakura.profileBackgroundImage).toContain('profile_sakura_dream');
    expect(ember.profileBackgroundImage).toContain('profile_ember_forge');
    expect(aurora.miniProfileBackgroundImage).toContain('mini_aurora_glass');
    expect(retro.previewImage).toContain('theme_retro_terminal_preview');
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
