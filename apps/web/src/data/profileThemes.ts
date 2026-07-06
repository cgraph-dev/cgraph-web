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
  PROFILE_THEME_BUNDLES as SHARED_PROFILE_THEME_BUNDLES,
  PROFILE_THEME_CATEGORIES as PROFILE_THEME_CATEGORY_IDS,
  PROFILE_THEME_CATEGORY_INFO as SHARED_PROFILE_THEME_CATEGORIES,
  PROFILE_THEME_IDS,
  getProfileThemeAssetManifestOrDefault,
  getProfileThemeBundleAssetManifestById,
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
  PROFILE_THEME_CATEGORY_IDS,
  PROFILE_THEME_IDS,
  isProfileThemeBundleId,
  isProfileThemeId,
};

function withWebProfileThemeAssets(theme: ProfileThemeConfig): ProfileThemeConfig {
  const manifest = getProfileThemeAssetManifestOrDefault(theme.id);

  return {
    ...theme,
    previewImage: manifest.preview.image,
    profileBackgroundImage: manifest.profileBackground.image,
    miniProfileBackgroundImage: manifest.miniProfileBackground.image,
  };
}

function withWebProfileThemeBundleAssets(
  bundle: ProfileThemeBundleConfig
): ProfileThemeBundleConfig {
  const manifest = getProfileThemeBundleAssetManifestById(bundle.id);
  if (!manifest) return bundle;

  return {
    ...bundle,
    previewImage: manifest.preview.image,
    profileBackgroundImage: manifest.profileBackground.image,
    miniProfileBackgroundImage: manifest.miniProfileBackground.image,
  };
}

export const ALL_PROFILE_THEMES: ProfileThemeConfig[] =
  SHARED_PROFILE_THEMES.map(withWebProfileThemeAssets);

export const PROFILE_THEME_BUNDLES: ProfileThemeBundleConfig[] =
  SHARED_PROFILE_THEME_BUNDLES.map(withWebProfileThemeBundleAssets);

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
  if (!isProfileThemeBundleId(id)) return undefined;
  return PROFILE_THEME_BUNDLES.find((bundle) => bundle.id === id);
}

export function getProfileThemeBundlesByTheme(
  themeId: ProfileThemeId
): readonly ProfileThemeBundleConfig[] {
  return PROFILE_THEME_BUNDLES.filter(
    (bundle) => bundle.themeId === themeId || bundle.includes.profileThemeId === themeId
  );
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
};
