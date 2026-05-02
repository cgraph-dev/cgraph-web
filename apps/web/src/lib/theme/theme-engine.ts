/**
 * CGraph Theme Engine
 *
 * Orchestrator that delegates CSS-variable injection to ./css-variables.ts
 * and preference persistence / cross-tab sync to ./preferences.ts.
 * Types are in ./types.ts, theme definitions in ./themes.ts.
 *
 */

import { createLogger } from '@/lib/logger';
import type { Theme, ThemePreferences } from './types';
import { THEME_AURORA, THEME_REGISTRY } from './themes';
import { injectCSSVariables, updateDocumentClasses } from './css-variables';
import { loadPreferences, savePreferences, initBroadcastChannel } from './preferences';

// Re-export everything for backward compatibility
export type {
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  Theme,
  ThemePreferences,
} from './types';
export {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ANIMATIONS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_AURORA,
  THEME_REGISTRY,
} from './themes';

const logger = createLogger('ThemeEngine');

function createServerMediaQueryList(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
    addListener() {},
    removeListener() {},
  };
}

/**
 * Detect user preference for reduced motion.
 * Respects OS-level accessibility setting.
 */
export const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : createServerMediaQueryList('(prefers-reduced-motion: reduce)');

// THEME ENGINE CLASS

/**
 * ThemeEngine handles all theme-related operations including:
 * - Theme application and CSS variable injection
 * - User preferences persistence
 * - Cross-tab synchronization
 * - Accessibility adjustments
 */
class ThemeEngineImpl {
  private currentTheme: Theme = THEME_AURORA;
  private preferences: ThemePreferences;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();
  /** True once the user explicitly picks a theme via setTheme(). */
  private _userExplicitlyChose = false;

  constructor() {
    // Defensive: constructor runs at module scope during import.
    // If any DOM/storage API is unavailable (SSR, restricted env),
    // fall back to defaults instead of crashing the import chain.
    try {
      this.preferences = loadPreferences();
      // If the user previously selected a non-default theme, honour it
      this._userExplicitlyChose = this.preferences.activeThemeId !== 'aurora';
      this.broadcastChannel = initBroadcastChannel((theme) => this.applyTheme(theme, false));
      this.applyTheme(this.getActiveTheme());
    } catch (error) {
      logger.error(
        'ThemeEngine init failed — localStorage may be unavailable (iframe / private browsing). Using defaults.',
        error
      );
      this.preferences = {
        activeThemeId: 'aurora',
        customThemes: [],
        settings: {
          syncAcrossDevices: false,
          respectSystemPreference: false,
          messageDisplay: 'cozy',
          fontScale: 1,
          messageSpacing: 1,
          reduceMotion: false,
          highContrast: false,
          backgroundEffect: 'none',
          shaderVariant: 'matrix',
          backgroundIntensity: 0.6,
        },
      };
    }
  }

  /**
   * Get the currently active theme.
   *
   * System preference only applies when no explicit user selection exists
   * (i.e. activeThemeId is still the default 'aurora'). Once the user
   * explicitly picks a theme, their choice is preserved across reloads.
   */
  getActiveTheme(): Theme {
    // 1. Check for explicit user selection first (custom or built-in)
    const customTheme = this.preferences.customThemes.find(
      (t) => t.id === this.preferences.activeThemeId
    );
    if (customTheme) return customTheme;

    const builtInTheme = THEME_REGISTRY[this.preferences.activeThemeId];

    // 2. System preference only applies when user hasn't explicitly chosen a theme.
    //    We track this via the `_userExplicitlyChose` flag set by setTheme().
    if (
      this.preferences.settings.respectSystemPreference &&
      !this._userExplicitlyChose &&
      typeof window !== 'undefined'
    ) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemThemeId = prefersDark ? 'aurora' : 'light';
      return THEME_REGISTRY[systemThemeId] ?? THEME_AURORA;
    }

    return builtInTheme ?? THEME_AURORA;
  }

  /**
   * Apply a theme to the document.
   */
  applyTheme(theme: Theme, broadcast = true): void {
    this.currentTheme = theme;
    this.preferences.activeThemeId = theme.id;

    if (typeof document !== 'undefined') {
      injectCSSVariables(theme, this.preferences.settings);
      updateDocumentClasses(theme, this.preferences.settings);
    }

    savePreferences(this.preferences);

    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'theme-change', theme });
    }

    this.notifyListeners(theme);
  }

  /**
   * Set the active theme by ID.
   * Marks the selection as explicit so system-preference won't override it.
   */
  setTheme(themeId: string): void {
    const theme =
      THEME_REGISTRY[themeId] ?? this.preferences.customThemes.find((t) => t.id === themeId);

    if (theme) {
      this._userExplicitlyChose = true;
      this.applyTheme(theme);
    } else {
      logger.error(`Theme "${themeId}" not found`);
    }
  }

  /**
   * Update theme settings.
   */
  updateSettings(settings: Partial<ThemePreferences['settings']>): void {
    this.preferences.settings = { ...this.preferences.settings, ...settings };
    savePreferences(this.preferences);
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get all available themes.
   */
  getAllThemes(): Theme[] {
    return [...Object.values(THEME_REGISTRY), ...this.preferences.customThemes];
  }

  /**
   * Get themes by category.
   */
  getThemesByCategory(category: Theme['category']): Theme[] {
    return this.getAllThemes().filter((t) => t.category === category);
  }

  /**
   * Create a custom theme.
   */
  createCustomTheme(theme: Omit<Theme, 'isBuiltIn'>): Theme {
    const newTheme: Theme = {
      ...theme,
      isBuiltIn: false,
      metadata: {
        ...theme.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    this.preferences.customThemes = this.preferences.customThemes.filter(
      (t) => t.id !== newTheme.id
    );
    this.preferences.customThemes.push(newTheme);
    savePreferences(this.preferences);

    return newTheme;
  }

  /**
   * Delete a custom theme.
   */
  deleteCustomTheme(themeId: string): boolean {
    const initialLength = this.preferences.customThemes.length;
    this.preferences.customThemes = this.preferences.customThemes.filter((t) => t.id !== themeId);

    if (this.preferences.customThemes.length < initialLength) {
      if (this.preferences.activeThemeId === themeId) {
        this.setTheme('aurora');
      }
      savePreferences(this.preferences);
      return true;
    }

    return false;
  }

  /** Get current theme. */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /** Get current preferences. */
  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  /** Subscribe to theme changes. */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Notify all listeners of theme change. */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach((listener) => {
      try {
        listener(theme);
      } catch (error) {
        logger.error('Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const themeEngine = new ThemeEngineImpl();

// Export convenience functions
export const setTheme = (themeId: string) => themeEngine.setTheme(themeId);
export const getCurrentTheme = () => themeEngine.getCurrentTheme();
export const getAllThemes = () => themeEngine.getAllThemes();
export const getThemeById = (themeId: string): Theme | undefined => THEME_REGISTRY[themeId];
export const subscribeToTheme = (listener: (theme: Theme) => void) =>
  themeEngine.subscribe(listener);
