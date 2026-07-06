/**
 * Enhanced theme context hook/type exports.
 *
 * The provider is owned by ../theme-context so there is only one runtime
 * theme owner in the app tree.
 */
export type { ThemeContextValue } from './types';
export {
  ThemeContextEnhanced,
  useThemeEnhanced,
  useThemeColors,
  useHolographicTheme,
  useIsSpecialTheme,
  useReducedMotion,
} from './hooks';
