/**
 * Profile theme catalog adapter.
 *
 * The runtime-neutral catalog lives in @cgraph-dev/shared-types. Web keeps only
 * renderer-specific Tailwind class mappings here.
 */

import {
  ALL_PROFILE_THEMES as SHARED_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME as SHARED_DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORIES as PROFILE_THEME_CATEGORY_IDS,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
  PROFILE_THEME_IDS,
  getProfileThemeBundleById as getSharedProfileThemeBundleById,
  getProfileThemeBundlesByTheme as getSharedProfileThemeBundlesByTheme,
  isProfileThemeId,
  isProfileThemeBundleId,
} from '@cgraph-dev/shared-types';
import type {
  ProfileThemeBundleConfig,
  ProfileThemeBundleId,
  ProfileThemeCategory,
  ProfileThemeCategoryInfo,
  ProfileThemeConfig,
  ProfileThemeId,
  ProfileThemeTier,
} from '@cgraph-dev/shared-types';

export {
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_BUNDLE_IDS,
  PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORY_IDS,
  PROFILE_THEME_IDS,
  isProfileThemeBundleId,
  isProfileThemeId,
};

type ProfileThemeAssetOverride = Pick<
  ProfileThemeConfig,
  'previewImage' | 'profileBackgroundImage' | 'miniProfileBackgroundImage'
>;

const PROFILE_THEME_ASSET_OVERRIDES: Partial<Record<ProfileThemeId, ProfileThemeAssetOverride>> =
  {
    'aurora-glass': {
      previewImage:
        '/cosmetics/pixellab/profile-theme-preview/theme_ranked_ascendant_preview/theme_ranked_ascendant_preview_0.png',
      profileBackgroundImage:
        '/cosmetics/pixellab/profile-background/profile_ranked_ascendant/profile_ranked_ascendant_0.png',
      miniProfileBackgroundImage:
        '/cosmetics/pixellab/mini-profile-background/mini_ranked_ascendant/mini_ranked_ascendant_0.png',
    },
    'deep-space': {
      previewImage:
        '/cosmetics/pixellab/profile-theme-preview/theme_void_relay_preview/theme_void_relay_preview_0.png',
      profileBackgroundImage:
        '/cosmetics/pixellab/profile-background/profile_void_relay/profile_void_relay_0.png',
      miniProfileBackgroundImage:
        '/cosmetics/pixellab/mini-profile-background/mini_void_relay/mini_void_relay_0.png',
    },
    'ember-forge': {
      previewImage:
        '/cosmetics/pixellab/profile-theme-preview/theme_ember_colossus_preview/theme_ember_colossus_preview_0.png',
      profileBackgroundImage:
        '/cosmetics/pixellab/profile-background/profile_ember_colossus/profile_ember_colossus_0.png',
      miniProfileBackgroundImage:
        '/cosmetics/pixellab/mini-profile-background/mini_ember_colossus/mini_ember_colossus_0.png',
    },
  };

export const ALL_PROFILE_THEMES: ProfileThemeConfig[] = SHARED_PROFILE_THEMES.map((theme) => ({
  ...theme,
  ...PROFILE_THEME_ASSET_OVERRIDES[theme.id],
}));

export const DEFAULT_PROFILE_THEME: ProfileThemeConfig =
  ALL_PROFILE_THEMES.find((theme) => theme.id === SHARED_DEFAULT_PROFILE_THEME.id) ??
  SHARED_DEFAULT_PROFILE_THEME;
export const PROFILE_THEME_CATEGORY_INFO: ProfileThemeCategoryInfo[] = [
  ...SHARED_PROFILE_THEME_CATEGORIES,
];
export const PROFILE_THEME_CATEGORIES = PROFILE_THEME_CATEGORY_INFO;

export function getThemesByCategory(category: ProfileThemeCategory): ProfileThemeConfig[] {
  return ALL_PROFILE_THEMES.filter((theme) => theme.category === category);
}

export function getThemeById(id: string | null | undefined): ProfileThemeConfig | undefined {
  if (!isProfileThemeId(id)) return undefined;
  return ALL_PROFILE_THEMES.find((theme) => theme.id === id);
}

export function getProfileThemeOrDefault(id: string | null | undefined): ProfileThemeConfig {
  return getThemeById(id) ?? DEFAULT_PROFILE_THEME;
}

export function getProfileThemeBundleById(
  id: string | null | undefined
): ProfileThemeBundleConfig | undefined {
  return getSharedProfileThemeBundleById(id);
}

export function getProfileThemeBundlesByTheme(
  themeId: ProfileThemeId
): readonly ProfileThemeBundleConfig[] {
  return getSharedProfileThemeBundlesByTheme(themeId);
}

export type {
  ProfileThemeBundleConfig,
  ProfileThemeBundleId,
  ProfileThemeCategory,
  ProfileThemeCategoryInfo,
  ProfileThemeConfig,
  ProfileThemeId,
  ProfileThemeTier,
};

export const TIER_COLORS: Record<
  ProfileThemeTier,
  { bg: string; text: string; border: string; glow: string }
> = {
  free: {
    bg: 'bg-white/10',
    text: 'text-white',
    border: 'border-white/20',
    glow: 'rgba(255,255,255,0.18)',
  },
  premium: {
    bg: 'bg-gradient-to-r from-purple-600 to-pink-500',
    text: 'text-white',
    border: 'border-purple-300/70',
    glow: 'rgba(168,85,247,0.5)',
  },
  enterprise: {
    bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    text: 'text-white',
    border: 'border-yellow-200/80',
    glow: 'rgba(251,191,36,0.6)',
  },
};
