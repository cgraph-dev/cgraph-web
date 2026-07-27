import {
  getTokensForTheme,
  hexToRgb,
} from '@cgraph-dev/design-tokens';

export {
  AURORA_TOKENS,
  BUBBLE_TOKENS,
  DARK_TOKENS,
  LIGHT_TOKENS,
  TOKEN_REGISTRY,
  contrastRatio,
  getTokensForTheme,
  hexToLuminance,
  hexToRgb,
  passesAA,
  passesAALarge,
  rgbString,
  validateAllThemeContrast,
} from '@cgraph-dev/design-tokens';
export type {
  ContrastViolation,
  SemanticTokens,
} from '@cgraph-dev/design-tokens';

/**
 * Apply the shared runtime-neutral token registry to the browser document.
 * Native clients consume the same package values through their platform renderer.
 */
export function injectSemanticTokens(themeId: string): void {
  const root = document.documentElement;

  for (const [key, value] of Object.entries(getTokensForTheme(themeId))) {
    root.style.setProperty(`--token-${key}`, value);

    const rgb = hexToRgb(value);
    if (rgb) {
      root.style.setProperty(`--token-${key}-rgb`, rgb.join(' '));
    }
  }
}
