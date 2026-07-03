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

type ProfileThemeAssets = Pick<
  ProfileThemeConfig,
  'previewImage' | 'profileBackgroundImage' | 'miniProfileBackgroundImage'
>;

const PROFILE_THEME_ASSETS: Record<ProfileThemeId, Required<ProfileThemeAssets>> = {
  'signal-noir': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_signal_noir_preview/theme_signal_noir_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_signal_noir/profile_signal_noir_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_signal_noir/mini_signal_noir_0.png',
  },
  'aurora-glass': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_aurora_glass_preview/theme_aurora_glass_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_aurora_glass/profile_aurora_glass_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_aurora_glass/mini_aurora_glass_0.png',
  },
  'retro-terminal': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_retro_terminal_preview/theme_retro_terminal_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_retro_terminal/profile_retro_terminal_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_retro_terminal/mini_retro_terminal_0.png',
  },
  'solarpunk-canopy': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_solarpunk_canopy_preview/theme_solarpunk_canopy_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_solarpunk_canopy/profile_solarpunk_canopy_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_solarpunk_canopy/mini_solarpunk_canopy_0.png',
  },
  'deep-space': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_deep_space_preview/theme_deep_space_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_deep_space/profile_deep_space_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_deep_space/mini_deep_space_0.png',
  },
  'sakura-dream': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_sakura_dream_preview/theme_sakura_dream_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_sakura_dream/profile_sakura_dream_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_sakura_dream/mini_sakura_dream_0.png',
  },
  'ember-forge': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_ember_forge_preview/theme_ember_forge_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_ember_forge/profile_ember_forge_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_ember_forge/mini_ember_forge_0.png',
  },
  'neon-rain-district': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_neon_rain_district_preview/theme_neon_rain_district_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_neon_rain_district/profile_neon_rain_district_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_neon_rain_district/mini_neon_rain_district_0.png',
  },
  'arcane-library': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_arcane_library_preview/theme_arcane_library_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_arcane_library/profile_arcane_library_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_arcane_library/mini_arcane_library_0.png',
  },
  'ocean-abyss-lab': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_ocean_abyss_lab_preview/theme_ocean_abyss_lab_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_ocean_abyss_lab/profile_ocean_abyss_lab_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_ocean_abyss_lab/mini_ocean_abyss_lab_0.png',
  },
  'celestial-throne': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_celestial_throne_preview/theme_celestial_throne_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_celestial_throne/profile_celestial_throne_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_celestial_throne/mini_celestial_throne_0.png',
  },
  'toxic-reactor-core': {
    previewImage:
      '/cosmetics/pixellab/profile-theme-preview/theme_toxic_reactor_core_preview/theme_toxic_reactor_core_preview_0.png',
    profileBackgroundImage:
      '/cosmetics/pixellab/profile-background/profile_toxic_reactor_core/profile_toxic_reactor_core_0.png',
    miniProfileBackgroundImage:
      '/cosmetics/pixellab/mini-profile-background/mini_toxic_reactor_core/mini_toxic_reactor_core_0.png',
  },
};

function withWebProfileThemeAssets(theme: ProfileThemeConfig): ProfileThemeConfig {
  return {
    ...theme,
    ...PROFILE_THEME_ASSETS[theme.id],
  };
}

function withWebProfileThemeBundleAssets(
  bundle: ProfileThemeBundleConfig
): ProfileThemeBundleConfig {
  return {
    ...bundle,
    ...PROFILE_THEME_ASSETS[bundle.includes.profileThemeId],
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
