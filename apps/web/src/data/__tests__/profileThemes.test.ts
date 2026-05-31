import {
  ALL_PROFILE_THEMES as SHARED_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME as SHARED_DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
  getProfileThemeOrDefault as getSharedProfileThemeOrDefault,
  getThemesByCategory as getSharedThemesByCategory,
} from '@cgraph-dev/shared-types';
import { describe, expect, it } from 'vitest';

import {
  ALL_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME,
  PROFILE_THEME_CATEGORIES,
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
  });

  it('keeps mutable web arrays as adapter copies for legacy picker props', () => {
    expect(ALL_PROFILE_THEMES).not.toBe(SHARED_PROFILE_THEMES);
    expect(PROFILE_THEME_CATEGORIES).toEqual(SHARED_PROFILE_THEME_CATEGORIES);
    expect(PROFILE_THEME_CATEGORIES).not.toBe(SHARED_PROFILE_THEME_CATEGORIES);

    const signalThemes = getThemesByCategory('signal');

    expect(signalThemes).toEqual(getSharedThemesByCategory('signal'));
    expect(signalThemes).not.toBe(getSharedThemesByCategory('signal'));
  });
});
