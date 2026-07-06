/**
 * Enhanced theme hook compatibility barrel.
 *
 * The canonical provider is ThemeProvider from ./theme-context. This module
 * keeps older enhanced hook imports working without exposing a second provider.
 */
export type { ThemeContextValue } from './theme-enhanced';
export {
  ThemeContextEnhanced,
  useThemeEnhanced,
  useThemeColors,
  useHolographicTheme,
  useIsSpecialTheme,
  useReducedMotion,
} from './theme-enhanced';
