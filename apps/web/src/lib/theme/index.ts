/**
 * Theme System - Index
 *
 * Central export for the CGraph theming system.
 *
 */

// Types
export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  ThemePreferences,
  ThemeVariant,
  ThemeGlassConfig,
  ThemeButtonStyle,
} from './types';

// Theme definitions
export {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ANIMATIONS,
  THEME_AURORA,
  THEME_DARK,
  THEME_LIGHT,
  THEME_REGISTRY,
} from './themes';

// Engine
export {
  themeEngine,
  getAllThemes,
  getThemeById,
  setTheme,
  getCurrentTheme,
  subscribeToTheme,
  prefersReducedMotion,
} from './theme-engine';

// Tokens (single source of truth)
export {
  TOKEN_REGISTRY,
  getTokensForTheme,
  injectSemanticTokens,
  contrastRatio,
  passesAA,
  passesAALarge,
  hexToLuminance,
  hexToRgb,
  rgbString,
} from './tokens';
export type { SemanticTokens } from './tokens';
