export type { ThemePalette, ThemeId } from './types';
export { applyCustomTheme } from './custom-theme';
export type { CustomThemeOverrides } from './custom-theme';

export { darkTheme } from './dark';
export { lightTheme } from './light';
export { auroraTheme } from './aurora';
export { bubbleTheme } from './bubble';

import { darkTheme } from './dark';
import { lightTheme } from './light';
import { auroraTheme } from './aurora';
import { bubbleTheme } from './bubble';
import type { ThemePalette, ThemeId } from './types';

export const themes: Record<ThemeId, ThemePalette> = {
  dark: darkTheme,
  light: lightTheme,
  aurora: auroraTheme,
  bubble: bubbleTheme,
};
