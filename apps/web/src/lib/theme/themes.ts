import {
  APP_THEME_MANIFEST_BY_ID,
  DEFAULT_APP_THEME_ANIMATIONS,
  DEFAULT_APP_THEME_SPACING,
  DEFAULT_APP_THEME_TYPOGRAPHY,
  type AppThemeManifest,
} from '@cgraph-dev/design-tokens/app-theme-manifest';

import type { Theme, ThemeAnimations, ThemeSpacing, ThemeTypography } from './types';

export const DEFAULT_TYPOGRAPHY: ThemeTypography = DEFAULT_APP_THEME_TYPOGRAPHY;
export const DEFAULT_SPACING: ThemeSpacing = DEFAULT_APP_THEME_SPACING;
export const DEFAULT_ANIMATIONS: ThemeAnimations = DEFAULT_APP_THEME_ANIMATIONS;

function themeFromManifest(manifest: AppThemeManifest): Theme {
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    category: manifest.category,
    variant: manifest.variant,
    colorScheme: manifest.colorScheme,
    isBuiltIn: manifest.isBuiltIn,
    isPremium: manifest.isPremium,
    colors: manifest.colors,
    glassConfig: manifest.glassConfig,
    buttonStyle: manifest.buttonStyle,
    typography: manifest.typography,
    spacing: manifest.spacing,
    animations: manifest.animations,
    metadata: manifest.metadata,
  };
}

export const THEME_AURORA: Theme = themeFromManifest(APP_THEME_MANIFEST_BY_ID.aurora);
export const THEME_DARK: Theme = themeFromManifest(APP_THEME_MANIFEST_BY_ID.dark);
export const THEME_LIGHT: Theme = themeFromManifest(APP_THEME_MANIFEST_BY_ID.light);

const THEME_BUBBLE: Theme = themeFromManifest(APP_THEME_MANIFEST_BY_ID.bubble);

export const THEME_REGISTRY: Record<string, Theme> = {
  aurora: THEME_AURORA,
  dark: THEME_DARK,
  light: THEME_LIGHT,
  bubble: THEME_BUBBLE,
};
