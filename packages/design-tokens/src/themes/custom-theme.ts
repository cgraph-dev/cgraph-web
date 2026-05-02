/** Custom theme overrides for user-defined theme customization. */

import type { ThemePalette } from './types';

export interface CustomThemeOverrides {
  readonly primary?: string;
  readonly background?: string;
  readonly surface?: string;
  readonly text?: string;
  readonly accent?: string;
  readonly border?: string;
}

/** Apply custom theme overrides to a base theme palette. */
export function applyCustomTheme(
  base: ThemePalette,
  overrides: CustomThemeOverrides
): ThemePalette {
  return {
    ...base,
    ...(overrides.primary && { primary: overrides.primary }),
    ...(overrides.background && { background: overrides.background }),
    ...(overrides.surface && { surface: overrides.surface }),
    ...(overrides.text && { text: overrides.text }),
    ...(overrides.accent && { accent: overrides.accent }),
    ...(overrides.border && { border: overrides.border }),
  };
}
