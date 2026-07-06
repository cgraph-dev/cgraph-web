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
import {
  type Theme as FullTheme,
  type ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/theme-engine';
import { injectSemanticTokens } from '@/lib/theme/tokens';
import type { ThemeContextValue } from '@/providers/theme-enhanced/types';
import { ThemeContextEnhanced } from '@/providers/theme-enhanced/hooks';

// Simple theme context (backward-compat API)

type SimpleTheme = 'dark' | 'light' | 'system';

interface SimpleThemeContextType {
  theme: SimpleTheme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: SimpleTheme) => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

// Unified Provider

interface ThemeProviderProps {
  children: ReactNode;
  /** Optional initial theme ID */
  initialTheme?: string;
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
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // --- Enhanced state (from ThemeEngine) ---
  const [theme, setThemeState] = useState<FullTheme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    themeEngine.getPreferences()
  );

  // Subscribe to theme engine changes
  useEffect(
    () =>
      themeEngine.subscribe((newTheme) => {
        setThemeState(newTheme);
        setPreferences(themeEngine.getPreferences());
      }),
    []
  );

  // Apply initial theme if provided
  useEffect(() => {
    if (initialTheme && THEME_REGISTRY[initialTheme]) {
      themeEngine.setTheme(initialTheme);
    }
  }, [initialTheme]);

  // Inject semantic design tokens whenever theme changes
  useEffect(() => {
    injectSemanticTokens(theme.id);
  }, [theme.id]);

  // --- System preference listener ---
  useEffect(() => {
    if (!preferences.settings.respectSystemPreference) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const prefs = themeEngine.getPreferences();
      if (prefs.settings.respectSystemPreference) {
        // System dark → aurora (CGraph default dark), system light → light.
        // applyTheme() does NOT set _userExplicitlyChose (only setTheme does),
        // so future system-preference changes still apply correctly.
        const systemThemeId = mediaQuery.matches ? 'aurora' : 'light';
        const resolved = THEME_REGISTRY[systemThemeId];
        if (resolved) themeEngine.applyTheme(resolved);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.settings.respectSystemPreference]);

  // --- Reduced motion listener ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (mediaQuery.matches) themeEngine.updateSettings({ reduceMotion: true });
    };
    if (mediaQuery.matches) handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- Enhanced API callbacks ---
  function setTheme(themeId: string) {
    themeEngine.setTheme(themeId);
  }

  function updateSettings(settings: Partial<ThemePreferences['settings']>) {
    themeEngine.updateSettings(settings);
    setPreferences(themeEngine.getPreferences());
  }

  /**
   * Cycle through themes: aurora → dark → light → aurora.
   * Named `toggleDarkMode` for backward-compat; actually cycles all 3 built-in themes.
   */
  function toggleDarkMode() {
    const cycle: Record<string, string> = { aurora: 'dark', dark: 'light', light: 'aurora' };
    const nextId = cycle[theme.id] ?? 'aurora';
    themeEngine.setTheme(nextId);
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
    updateSettings({ reduceMotion: !preferences.settings.reduceMotion });
  }

  function toggleHighContrast() {
    updateSettings({ highContrast: !preferences.settings.highContrast });
  }

  function toggleSystemPreference() {
    updateSettings({ respectSystemPreference: !preferences.settings.respectSystemPreference });
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

  const isSystemPreference = preferences.settings.respectSystemPreference;
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
  const simpleTheme: SimpleTheme = isSystemPreference ? 'system' : resolvedBaseTheme;

  function setSimpleTheme(t: SimpleTheme) {
    if (t === 'system') {
      updateSettings({ respectSystemPreference: true });
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'aurora' : 'light';
      themeEngine.setTheme(sys);
    } else {
      updateSettings({ respectSystemPreference: false });
      themeEngine.setTheme(t === 'dark' ? 'aurora' : t);
    }
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
