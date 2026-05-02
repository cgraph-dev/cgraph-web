/**
 * @cgraph/animation-constants
 *
 * Platform-agnostic animation constants consumed by both
 * apps/web (Framer Motion) and apps/mobile-legacy-expo (Reanimated).
 *
 * Only raw numeric / string values live here — no framework imports.
 */

export { springs, type SpringConfig } from './springs';
export { durations } from './durations';
export { stagger } from './stagger';
export { transitions, rnTransitions } from './transitions';
export { buttonPresets } from './buttons';
export {
  BORDER_THEME_PALETTES,
  AVATAR_BORDERS,
  getBorderById,
  getBordersByRarity,
  getAvatarBorderById,
  getAvatarBordersByTheme,
  getAvatarBordersByRarity,
  getFreeAvatarBorders,
  getPremiumAvatarBorders,
  type BorderRarity,
  type BorderTheme,
  type BorderRegistryEntry,
  type AvatarBorderTheme,
  type AvatarBorderType,
  type AvatarBorderConfig,
  type BorderUnlockType,
} from './borders';
export {
  NAMEPLATE_REGISTRY,
  NAMEPLATE_CATEGORIES,
  getNameplateById,
  type NameplateRarity,
  type NameplateEntry,
  type NameplateTextEffect,
  type NameplateParticleType,
  type NameplateBorderStyle,
  type NameplateCategory,
} from './registries/nameplates';
export {
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  NAME_COLORS,
  DEFAULT_DISPLAY_NAME_STYLE,
  type NameFont,
  type NameEffect,
} from './registries/displayNameStyles';
export {
  PROFILE_THEME_PRESETS,
  DEFAULT_PROFILE_THEME,
  type ProfileThemePreset,
  type ProfileTheme,
} from './registries/profileThemes';
export {
  TITLES,
  RARITY_COLORS as TITLE_RARITY_COLORS,
  getTitleById,
  getTitlesByCategory,
  getTitlesByRarity,
  getPurchasableTitles,
  getAchievementTitles,
  type Title,
  type TitleRarity,
  type TitleCategory,
  type TitleAnimation,
  type TitleAnimationType,
} from './registries/titles';
export {
  ALL_BADGES,
  getBadgeById,
  getBadgesByRarity as getBadgesByBadgeRarity,
  getUnlockedBadges,
  type BadgeDefinition,
  type BadgeRarity,
} from './registries/badges';
