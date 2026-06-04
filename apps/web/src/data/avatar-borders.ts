/**
 * Avatar Border Definitions — 11 Lottie Borders
 *
 * Re-exports canonical border data from @cgraph-dev/animation-constants and
 * provides web-specific adapters (Tailwind CSS classes, legacy types)
 * for existing UI components.
 */

// Re-export canonical data and functions from shared package
export {
  AVATAR_BORDERS,
  getAvatarBorderById as getBorderById,
  getAvatarBordersByRarity as getBordersByRarity,
  getFreeAvatarBorders as getFreeBorders,
  getPremiumAvatarBorders as getPremiumBorders,
} from '@cgraph-dev/animation-constants';

// Re-export types — BorderRarity comes from the shared package,
// AvatarBorderConfig from the local types file for full compatibility
// with consumers that mix both import sources.
export type { BorderRarity } from '@cgraph-dev/animation-constants';
export type { AvatarBorderConfig } from '@/types/avatar-borders';

import {
  AVATAR_BORDERS,
  getAvatarBorderById,
  type AvatarBorderConfig,
  type AvatarBorderTheme,
  type AvatarBorderType,
  type BorderRarity,
} from '@cgraph-dev/animation-constants';

// Re-export AvatarBorderTheme as BorderTheme for backward compatibility
// with web consumers that import BorderTheme from this file.
export type BorderTheme = AvatarBorderTheme;

export function getAvatarBorderDisplayTypeById(
  borderId: string | null | undefined
): AvatarBorderType {
  if (!borderId) return 'none';
  return getAvatarBorderById(borderId)?.type ?? 'none';
}

/** Get borders by theme */
export function getBordersByTheme(theme: BorderTheme): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.theme === theme);
}

/**
 * Tailwind CSS class-based rarity colors for border cards.
 * Web-specific — not in the shared package.
 */
export const RARITY_COLORS: Record<
  BorderRarity,
  { bg: string; border: string; text: string; glow: string }
> = {
  free: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    glow: 'rgba(156,163,175,0.3)',
  },
  common: {
    bg: 'bg-gray-400/20',
    border: 'border-gray-400/50',
    text: 'text-gray-300',
    glow: 'rgba(209,213,219,0.3)',
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'rgba(59,130,246,0.5)',
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    glow: 'rgba(139,92,246,0.5)',
  },
  legendary: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'rgba(249,115,22,0.6)',
  },
  mythic: {
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    glow: 'rgba(236,72,153,0.7)',
  },
};

// ----------------------------------------------------------------
// Legacy adapter types for existing web UI components
// ----------------------------------------------------------------

/** Legacy animation type union expected by themed-border-card animations.ts */
export type BorderAnimationType =
  | 'none'
  | 'pulse'
  | 'glow'
  | 'rotate'
  | 'shimmer'
  | 'rainbow'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'void'
  | 'aurora'
  | 'galaxy'
  | 'pixel-pulse'
  | 'scan-line'
  | 'glitch'
  | 'sakura-fall'
  | 'wave'
  | 'energy-surge'
  | 'smoke'
  | 'neon-flicker'
  | 'holographic'
  | 'lottie';

/** Legacy BorderDefinition shape consumed by themed-border-card + sections */
export interface BorderDefinition {
  id: string;
  name: string;
  theme: BorderTheme;
  rarity: BorderRarity;
  animationType: BorderAnimationType;
  colors: string[];
  isPremium: boolean;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  description: string;
  borderWidth?: number;
  glowIntensity?: number;
  animationDuration?: number;
  lottieFile?: string;
}

/** Theme category for the browse UI */
export interface BorderThemeCategory {
  id: BorderTheme;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  borderCount: number;
}

const BORDER_ANIMATION_TYPES: ReadonlySet<string> = new Set<string>([
  'none',
  'pulse',
  'glow',
  'rotate',
  'shimmer',
  'rainbow',
  'fire',
  'ice',
  'electric',
  'void',
  'aurora',
  'galaxy',
  'pixel-pulse',
  'scan-line',
  'glitch',
  'sakura-fall',
  'wave',
  'energy-surge',
  'smoke',
  'neon-flicker',
  'holographic',
  'lottie',
]);

function isBorderAnimationType(v: string): v is BorderAnimationType {
  return BORDER_ANIMATION_TYPES.has(v);
}

/** Convert AvatarBorderConfig -> BorderDefinition */
function toBorderDefinition(b: AvatarBorderConfig): BorderDefinition {
  const colors: string[] = [b.primaryColor, b.secondaryColor, b.accentColor].filter(
    (c): c is string => Boolean(c)
  );
  const isUnlocked = b.unlockType === 'default' || !b.isPremium;
  return {
    id: b.id,
    name: b.name,
    theme: b.theme,
    rarity: b.rarity,
    animationType: isBorderAnimationType(b.type) ? b.type : 'none',
    colors,
    isPremium: b.isPremium,
    unlocked: isUnlocked,
    unlockRequirement: b.unlockRequirement?.description,
    description: b.description,
    animationDuration: b.animationDuration,
    lottieFile: b.lottieUrl,
  };
}

/** All 11 borders as legacy BorderDefinition for existing UI */
export const ALL_BORDERS: BorderDefinition[] = AVATAR_BORDERS.map(toBorderDefinition);

/** Deduplicated theme list derived from the actual 11 borders */
const themeConfig: Partial<
  Record<BorderTheme, { name: string; icon: string; accentColor: string; description: string }>
> = {
  '8bit': {
    name: 'Retro',
    icon: '\u25C6',
    accentColor: '#39ff14',
    description: 'Pixel art nostalgia',
  },

  anime: {
    name: 'Dynamic',
    icon: '\u25B2',
    accentColor: '#ffcc00',
    description: 'High-energy effects',
  },
  cyberpunk: {
    name: 'Neon',
    icon: '\u25CE',
    accentColor: '#00ffff',
    description: 'Futuristic & electric',
  },
  kawaii: { name: 'Bloom', icon: '\u273F', accentColor: '#ff69b4', description: 'Soft & colorful' },
  cosmic: {
    name: 'Cosmic',
    icon: '\u2727',
    accentColor: '#9b30ff',
    description: 'Stellar phenomena',
  },
};

/** All known theme keys from themeConfig for runtime validation */
const THEME_CONFIG_KEYS: ReadonlySet<string> = new Set(Object.keys(themeConfig));

function isBorderTheme(v: string): v is BorderTheme {
  return THEME_CONFIG_KEYS.has(v);
}

export const BORDER_THEMES: BorderThemeCategory[] = Object.entries(themeConfig)
  .filter((entry): entry is [BorderTheme, NonNullable<(typeof themeConfig)[BorderTheme]>] => {
    const [key, val] = entry;
    return isBorderTheme(key) && val !== undefined;
  })
  .map(([id, cfg]) => ({
    id,
    name: cfg.name,
    description: cfg.description,
    icon: cfg.icon,
    accentColor: cfg.accentColor,
    borderCount: AVATAR_BORDERS.filter((b) => b.theme === id).length,
  }));

/** Legacy helper — get BorderDefinition[] by theme */
export function getLegacyBordersByTheme(theme: BorderTheme): BorderDefinition[] {
  return AVATAR_BORDERS.filter((b) => b.theme === theme).map(toBorderDefinition);
}
