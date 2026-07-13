/**
 * Enhanced theme context type definitions.
 */
import type { Theme, ThemePreferences } from '@/lib/theme/theme-engine';

export interface ThemeContextValue {
  /** Current active theme */
  theme: Theme;

  /** Current theme preferences */
  preferences: ThemePreferences;

  /** All available themes */
  availableThemes: Theme[];

  /** Whether system preference is being used */
  isSystemPreference: boolean;

  /** Resolved base theme (dark or light) */
  resolvedBaseTheme: 'dark' | 'light';

  /** Set active theme by ID */
  setTheme: (themeId: string) => void;

  /** Toggle between dark and light themes */
  toggleDarkMode: () => void;

  /** Toggle reduced motion */
  toggleReduceMotion: () => void;

  /** Toggle high contrast mode */
  toggleHighContrast: () => void;

  /** Toggle system preference respect */
  toggleSystemPreference: () => void;

  /** Create a custom theme */
  createCustomTheme: (theme: Omit<Theme, 'isBuiltIn'>) => Theme;

  /** Delete a custom theme */
  deleteCustomTheme: (themeId: string) => boolean;
}
