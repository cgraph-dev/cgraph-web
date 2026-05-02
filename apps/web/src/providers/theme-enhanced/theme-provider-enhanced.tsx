/**
 * Enhanced Theme Context Provider
 *
 * React context provider for the CGraph theming system.
 * Provides theme state, settings, and utilities to all components.
 */

import { useEffect, useState, type ReactNode } from 'react';
import {
  type Theme,
  type ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/theme-engine';
import type { ThemeContextValue } from './types';
import { ThemeContextEnhanced } from './hooks';

interface ThemeProviderEnhancedProps {
  children: ReactNode;
  /** Initial theme ID (optional) */
  initialTheme?: string;
}

/**
 * Theme Provider Enhanced — context provider wrapper.
 */
export function ThemeProviderEnhanced({ children, initialTheme }: ThemeProviderEnhancedProps) {
  const [theme, setThemeState] = useState<Theme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    themeEngine.getPreferences()
  );

  // Subscribe to theme changes
  useEffect(() => {
    return themeEngine.subscribe((newTheme) => {
      setThemeState(newTheme);
      setPreferences(themeEngine.getPreferences());
    });
  }, []);

  // Apply initial theme if provided
  useEffect(() => {
    if (initialTheme && THEME_REGISTRY[initialTheme]) {
      themeEngine.setTheme(initialTheme);
    }
  }, [initialTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!preferences.settings.respectSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const prefs = themeEngine.getPreferences();
      if (prefs.settings.respectSystemPreference) {
        const systemTheme = mediaQuery.matches ? 'aurora' : 'light';
        themeEngine.setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.settings.respectSystemPreference]);

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      if (mediaQuery.matches) {
        themeEngine.updateSettings({ reduceMotion: true });
      }
    };

    // Check initial value
    if (mediaQuery.matches) {
      handleChange();
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Set theme by ID
  function setTheme(themeId: string) {
    themeEngine.setTheme(themeId);
  }

  // Update settings
  function updateSettings(settings: Partial<ThemePreferences['settings']>) {
    themeEngine.updateSettings(settings);
    setPreferences(themeEngine.getPreferences());
  }

  // Toggle dark mode
  function toggleDarkMode() {
    const currentCategory = theme.category;
    const newThemeId = currentCategory === 'dark' ? 'light' : 'dark';
    themeEngine.setTheme(newThemeId);
  }

  // Set font scale
  function setFontScale(scale: number) {
    const clampedScale = Math.max(0.8, Math.min(1.4, scale));
    updateSettings({ fontScale: clampedScale });
  }

  // Set message display
  function setMessageDisplay(mode: 'cozy' | 'compact') {
    updateSettings({ messageDisplay: mode });
  }

  // Set message spacing
  function setMessageSpacing(spacing: number) {
    const clampedSpacing = Math.max(0.5, Math.min(2, spacing));
    updateSettings({ messageSpacing: clampedSpacing });
  }

  // Toggle reduced motion
  function toggleReduceMotion() {
    updateSettings({ reduceMotion: !preferences.settings.reduceMotion });
  }

  // Toggle high contrast
  function toggleHighContrast() {
    updateSettings({ highContrast: !preferences.settings.highContrast });
  }

  // Toggle system preference
  function toggleSystemPreference() {
    updateSettings({ respectSystemPreference: !preferences.settings.respectSystemPreference });
  }

  // Create custom theme
  function createCustomTheme(newTheme: Omit<Theme, 'isBuiltIn'>): Theme {
    const created = themeEngine.createCustomTheme(newTheme);
    setPreferences(themeEngine.getPreferences());
    return created;
  }

  // Delete custom theme
  function deleteCustomTheme(themeId: string): boolean {
    const result = themeEngine.deleteCustomTheme(themeId);
    if (result) {
      setPreferences(themeEngine.getPreferences());
    }
    return result;
  }

  // Compute derived values
  const isSystemPreference = preferences.settings.respectSystemPreference;
  const resolvedBaseTheme = theme.category === 'light' ? 'light' : 'dark';
  const availableThemes = getAllThemes();

  const value: ThemeContextValue = {
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

  return <ThemeContextEnhanced.Provider value={value}>{children}</ThemeContextEnhanced.Provider>;
}
