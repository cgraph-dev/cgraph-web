/**
 * Avatar Border Definitions — 11 Lottie Borders
 *
 * Re-exports canonical border data from @cgraph-dev/animation-constants and
 * provides web-specific adapters (Tailwind CSS classes, legacy types)
 * for existing UI components.
 */

// Re-export types — BorderRarity comes from the shared package,
// AvatarBorderConfig from the local types file for full compatibility
// with consumers that mix both import sources.
export type { BorderRarity } from '@cgraph-dev/animation-constants';
export type { AvatarBorderConfig } from '@/types/avatar-borders';

import {
  AVATAR_BORDERS as SHARED_AVATAR_BORDERS,
  type AvatarBorderConfig,
  type AvatarBorderTheme,
  type AvatarBorderType,
  type BorderRarity,
} from '@cgraph-dev/animation-constants';

// Re-export AvatarBorderTheme as BorderTheme for backward compatibility
// with web consumers that import BorderTheme from this file.
export type BorderTheme = AvatarBorderTheme;

const borderPath = (id: string, frame = 0): string =>
  `/cosmetics/pixellab/avatar-border/${id}/${id}_${frame}.png`;

const PIXELLAB_GAME_AVATAR_BORDERS: readonly AvatarBorderConfig[] = [
  {
    id: 'border_ranked_ascendant_01',
    type: 'mythic',
    name: 'Ranked Ascendant',
    description: 'A sapphire-and-gold rank crest frame for top-tier profile identity.',
    theme: 'gaming',
    rarity: 'mythic',
    unlockType: 'leaderboard',
    unlockRequirement: {
      type: 'leaderboard',
      value: 'top-100',
      description: 'Reach Ascendant leaderboard tier.',
    },
    primaryColor: '#2563eb',
    secondaryColor: '#fbbf24',
    accentColor: '#eff6ff',
    particleCount: 18,
    animationSpeed: 'normal',
    animationDuration: 4.8,
    isPremium: true,
    nodeCost: 3246,
    imageUrl: borderPath('border_ranked_ascendant_01'),
    previewUrl: borderPath('border_ranked_ascendant_01'),
    tags: ['ranked', 'leaderboard', 'sapphire', 'gold', 'pixellab'],
  },
  {
    id: 'border_ember_colossus_01',
    type: 'fire',
    name: 'Ember Colossus',
    description: 'A forged obsidian frame with molten channels and ember particles.',
    theme: 'elemental',
    rarity: 'legendary',
    unlockType: 'event',
    unlockRequirement: {
      type: 'event',
      value: 'ember-colossus',
      description: 'Unlock during the Ember Colossus event.',
    },
    primaryColor: '#fb923c',
    secondaryColor: '#7c2d12',
    accentColor: '#f97316',
    particleCount: 14,
    animationSpeed: 'slow',
    animationDuration: 5.4,
    isPremium: true,
    nodeCost: 1850,
    imageUrl: borderPath('border_ember_colossus_01'),
    previewUrl: borderPath('border_ember_colossus_01'),
    tags: ['ember', 'forge', 'event', 'fire', 'pixellab'],
  },
  {
    id: 'border_void_relay_01',
    type: 'mythic',
    name: 'Void Relay',
    description: 'A black-glass cosmic ring with violet gravity arcs.',
    theme: 'cosmic',
    rarity: 'mythic',
    unlockType: 'purchase',
    unlockRequirement: {
      type: 'nodes',
      value: 2800,
      description: 'Purchase from the premium profile shop.',
    },
    primaryColor: '#a855f7',
    secondaryColor: '#111827',
    accentColor: '#22d3ee',
    particleCount: 20,
    animationSpeed: 'normal',
    animationDuration: 5,
    isPremium: true,
    nodeCost: 2800,
    imageUrl: borderPath('border_void_relay_01'),
    previewUrl: borderPath('border_void_relay_01'),
    tags: ['void', 'cosmic', 'sci-fi', 'premium', 'pixellab'],
  },
  {
    id: 'border_solar_grove_01',
    type: 'glow',
    name: 'Solar Grove',
    description: 'An emerald filigree frame with sun-gold progression nodes.',
    theme: 'nature',
    rarity: 'epic',
    unlockType: 'achievement',
    unlockRequirement: {
      type: 'achievement',
      value: 'community-growth',
      description: 'Earned from community-growth achievements.',
    },
    primaryColor: '#16a34a',
    secondaryColor: '#facc15',
    accentColor: '#bbf7d0',
    particleCount: 12,
    animationSpeed: 'slow',
    animationDuration: 6,
    isPremium: true,
    nodeCost: 1450,
    imageUrl: borderPath('border_solar_grove_01'),
    previewUrl: borderPath('border_solar_grove_01'),
    tags: ['solarpunk', 'nature', 'achievement', 'gold', 'pixellab'],
  },
];

export const AVATAR_BORDERS: readonly AvatarBorderConfig[] = [
  ...SHARED_AVATAR_BORDERS,
  ...PIXELLAB_GAME_AVATAR_BORDERS,
];

export function getBorderById(id: string | null | undefined): AvatarBorderConfig | undefined {
  if (!id) return undefined;
  return AVATAR_BORDERS.find((border) => border.id === id);
}

export function getBordersByRarity(rarity: BorderRarity): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.rarity === rarity);
}

export function getFreeBorders(): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.unlockType === 'default' || !border.isPremium);
}

export function getPremiumBorders(): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.isPremium);
}

export function getAvatarBorderDisplayTypeById(
  borderId: string | null | undefined
): AvatarBorderType {
  if (!borderId) return 'none';
  return getBorderById(borderId)?.type ?? 'none';
}

const LEGACY_AVATAR_BORDER_DISPLAY_TYPES = [
  'none',
  'static',
  'simple-glow',
  'gentle-pulse',
  'rotating-ring',
  'dual-ring',
  'gradient-wave',
  'spark-trail',
  'prismatic',
  'neon-outline',
  'ripple',
  'heartbeat',
  'fire',
  'ice',
  'electric',
  'glow',
  'pulse',
  'rotate',
  'legendary',
  'mythic',
] as const satisfies readonly AvatarBorderType[];

const AVATAR_BORDER_DISPLAY_TYPES: ReadonlySet<string> = new Set([
  ...LEGACY_AVATAR_BORDER_DISPLAY_TYPES,
  ...AVATAR_BORDERS.map((border) => border.type),
]);

export function isAvatarBorderDisplayType(
  value: string | null | undefined
): value is AvatarBorderType {
  return typeof value === 'string' && AVATAR_BORDER_DISPLAY_TYPES.has(value);
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
  imageUrl?: string;
  previewUrl?: string;
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
    imageUrl: b.imageUrl,
    previewUrl: b.previewUrl,
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
  gaming: {
    name: 'Ranked',
    icon: '\u25C8',
    accentColor: '#fbbf24',
    description: 'Competitive rank frames',
  },
  elemental: {
    name: 'Elemental',
    icon: '\u25C7',
    accentColor: '#fb923c',
    description: 'Fire, ice, storm, and forge effects',
  },
  nature: {
    name: 'Nature',
    icon: '\u2739',
    accentColor: '#22c55e',
    description: 'Organic growth and solarpunk energy',
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
