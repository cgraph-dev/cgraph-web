/**
 * @cgraph/design-tokens
 *
 * Platform-agnostic design tokens consumed by both
 * web clients (CSS variables) and mobile clients (JS objects).
 *
 * Only raw values live here — no framework imports.
 */

export { brand, backgrounds, text } from './brand';
export type { BrandColors, BackgroundColors, TextColors } from './brand';

export { semantic, status, rarity, rarityDark, premium, premiumDark } from './semantic';
export type { SemanticColors, StatusColors, RarityColors, PremiumColors } from './semantic';

export { glass, glowShadows } from './glass';
export type { GlassTokens, GlowShadows } from './glass';

export { spacing, radius } from './spacing';
export type { Spacing, Radius } from './spacing';

export { fontFamily, fontSize, lineHeight, fontWeight, letterSpacing } from './typography';
export type { FontFamily, FontSize, LineHeight, FontWeight, LetterSpacing } from './typography';

export { zIndex, shadows } from './layers';
export type { ZIndex, Shadows } from './layers';

export { gradients } from './gradients';
export type { Gradients } from './gradients';

export { darkTheme, lightTheme, auroraTheme, bubbleTheme, themes, applyCustomTheme } from './themes';
export type { ThemePalette, ThemeId, CustomThemeOverrides } from './themes';

export { colorPresets, ghostChatThemes, chatBubblePresets, themeProfiles } from './presets';
export type {
  ColorPresetId,
  ColorPreset,
  GhostChatTheme,
  ChatBubblePreset,
  ThemeProfile,
} from './presets';
