/**
 * Unified Theme Context — single ThemeProvider for the whole app.
 *
 * Merges the legacy basic ThemeProvider (light/dark/system detection +
 * CSS class toggle) with the enhanced hook API (CSS-variable injection,
 * package-backed themes, preferences persistence, accessibility settings).
 *
 * Consumers can use:
 *   - `useTheme()`         — simple API: { theme, resolvedTheme, setTheme }
 *   - `useThemeEnhanced()` — full API: theme object, preferences, all setters
 *
 * Both hooks read from the same provider.  Only ONE <ThemeProvider> is needed
 * in the component tree (wrapping <App> in main.tsx).
 */
import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSettingsStore } from '@/modules/settings/store';
import {
  type Theme as FullTheme,
  type ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/theme-engine';
import { injectSemanticTokens } from '@/lib/theme/tokens';
import { createLogger } from '@/lib/logger';
import type { ThemeContextValue } from '@/providers/theme-enhanced/types';
import { ThemeContextEnhanced } from '@/providers/theme-enhanced/hooks';

const logger = createLogger('ThemeProvider');

// Simple theme context (backward-compat API)

type SimpleTheme = 'aurora' | 'dark' | 'light' | 'bubble' | 'system';

interface SimpleThemeContextType {
  theme: SimpleTheme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: SimpleTheme) => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

// Unified Provider

interface ThemeProviderProps {
  children: ReactNode;
}

function isAppTheme(value: string): value is SimpleTheme {
  return (
    value === 'aurora' ||
    value === 'dark' ||
    value === 'light' ||
    value === 'bubble' ||
    value === 'system'
  );
}

function resolveAppTheme(theme: SimpleTheme, prefersDark: boolean): Exclude<SimpleTheme, 'system'> {
  if (theme !== 'system') return theme;
  return prefersDark ? 'aurora' : 'light';
}

/**
 * Unified ThemeProvider — single provider for the whole app.
 *
 * Delegates theme application to the ThemeEngine singleton, which handles:
 * - CSS variable injection (colors, typography, spacing)
 * - Document class management (light/dark, theme-matrix, etc.)
 * - Preference persistence (localStorage + BroadcastChannel)
 *
 * Additionally injects semantic design tokens from tokens.ts.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // --- Enhanced state (from ThemeEngine) ---
  const [theme, setThemeState] = useState<FullTheme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    themeEngine.getPreferences()
  );
  const appearance = useSettingsStore((state) => state.settings.appearance);
  const appTheme = appearance.theme;
  const updateAppearanceSettings = useSettingsStore((state) => state.updateAppearanceSettings);

  // Subscribe to theme engine changes
  useEffect(
    () =>
      themeEngine.subscribe((newTheme) => {
        setThemeState(newTheme);
        setPreferences(themeEngine.getPreferences());
      }),
    []
  );

  // Inject semantic design tokens whenever theme changes
  useEffect(() => {
    injectSemanticTokens(theme.id);
  }, [theme.id]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyAppTheme = () => {
      const themeId = resolveAppTheme(appTheme, mediaQuery.matches);
      const resolved = THEME_REGISTRY[themeId];
      if (resolved) themeEngine.applyTheme(resolved);
    };

    applyAppTheme();

    if (appTheme !== 'system') return;

    mediaQuery.addEventListener('change', applyAppTheme);
    return () => mediaQuery.removeEventListener('change', applyAppTheme);
  }, [appTheme]);

  // Keep runtime accessibility in sync without persisting an OS-only preference.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyAccessibility = () => {
      themeEngine.updateSettings({
        reduceMotion: appearance.reduceMotion || mediaQuery.matches,
        highContrast: appearance.highContrast,
      });
      setPreferences(themeEngine.getPreferences());
    };

    applyAccessibility();
    mediaQuery.addEventListener('change', applyAccessibility);
    return () => mediaQuery.removeEventListener('change', applyAccessibility);
  }, [appearance.highContrast, appearance.reduceMotion]);

  // --- Enhanced API callbacks ---
  function setTheme(themeId: string) {
    if (!isAppTheme(themeId)) return;
    void updateAppearanceSettings({ theme: themeId }).catch((error: unknown) => {
      logger.error('Failed to save app theme', error);
    });
  }

  function updateSettings(settings: Partial<ThemePreferences['settings']>) {
    themeEngine.updateSettings(settings);
    setPreferences(themeEngine.getPreferences());
  }

  /**
   * Cycle the durable CGraph app-theme setting.
   */
  function toggleDarkMode() {
    const cycle: Record<SimpleTheme, SimpleTheme> = {
      aurora: 'dark',
      dark: 'light',
      light: 'bubble',
      bubble: 'aurora',
      system: 'aurora',
    };
    setTheme(cycle[appTheme]);
  }

  function setFontScale(scale: number) {
    updateSettings({ fontScale: Math.max(0.8, Math.min(1.4, scale)) });
  }

  function setMessageDisplay(mode: 'cozy' | 'compact') {
    updateSettings({ messageDisplay: mode });
  }

  function setMessageSpacing(spacing: number) {
    updateSettings({ messageSpacing: Math.max(0.5, Math.min(2, spacing)) });
  }

  function toggleReduceMotion() {
    void updateAppearanceSettings({ reduceMotion: !appearance.reduceMotion }).catch((error: unknown) => {
      logger.error('Failed to save reduced-motion preference', error);
    });
  }

  function toggleHighContrast() {
    void updateAppearanceSettings({ highContrast: !appearance.highContrast }).catch((error: unknown) => {
      logger.error('Failed to save high-contrast preference', error);
    });
  }

  function toggleSystemPreference() {
    setTheme(appTheme === 'system' ? 'aurora' : 'system');
  }

  function createCustomTheme(newTheme: Omit<FullTheme, 'isBuiltIn'>): FullTheme {
    const created = themeEngine.createCustomTheme(newTheme);
    setPreferences(themeEngine.getPreferences());
    return created;
  }

  function deleteCustomTheme(themeId: string): boolean {
    const result = themeEngine.deleteCustomTheme(themeId);
    if (result) setPreferences(themeEngine.getPreferences());
    return result;
  }

  const isSystemPreference = appTheme === 'system';
  const resolvedBaseTheme: 'dark' | 'light' = theme.category === 'light' ? 'light' : 'dark';
  const availableThemes = getAllThemes();

  // Enhanced context value
  const enhancedValue: ThemeContextValue = {
    theme,
    preferences,
    availableThemes,
    isSystemPreference,
    resolvedBaseTheme,
    setTheme,
    updateSettings,
    toggleDarkMode,
    setFontScale,
    setMessageDisplay,
    setMessageSpacing,
    toggleReduceMotion,
    toggleHighContrast,
    toggleSystemPreference,
    createCustomTheme,
    deleteCustomTheme,
  };

  // --- Simple context value (backward-compat) ---
  const simpleTheme: SimpleTheme = appTheme;

  function setSimpleTheme(t: SimpleTheme) {
    setTheme(t);
  }

  const simpleValue: SimpleThemeContextType = {
    theme: simpleTheme,
    resolvedTheme: resolvedBaseTheme,
    setTheme: setSimpleTheme,
  };

  return (
    <SimpleThemeContext.Provider value={simpleValue}>
      <ThemeContextEnhanced.Provider value={enhancedValue}>
        {children}
      </ThemeContextEnhanced.Provider>
    </SimpleThemeContext.Provider>
  );
}

/**
 * Simple theme hook — backward-compatible API.
 * Returns { theme, resolvedTheme, setTheme } where theme is 'dark' | 'light' | 'system'.
 */
export function useTheme(): SimpleThemeContextType {
  const context = use(SimpleThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
