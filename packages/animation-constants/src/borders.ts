/**
 * Border animation constants — shared across web and mobile.
 *
 * Defines the canonical 11-border catalogue with rarity tiers,
 * theme palettes, and Lottie playback configuration.
 *
 * Includes both the compact BorderRegistryEntry (animation layer)
 * and the full AvatarBorderConfig (cosmetics catalog) for cross-platform use.
 *
 */

/** Rarity tier for avatar borders */
export type BorderRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Visual theme for avatar borders (UPPERCASE — animation layer) */
export type BorderTheme = '8BIT' | 'ANIME' | 'CYBERPUNK' | 'KAWAII' | 'COSMIC';

/**
 * Visual theme for avatar borders (lowercase — cosmetics catalog).
 * Superset of BorderTheme with additional theme categories.
 */
export type AvatarBorderTheme =
  | 'free'
  | 'premium'
  | 'enterprise'
  | 'legendary'
  | 'mythic'
  | '8bit'
  | 'chinese'
  | 'anime'
  | 'cyberpunk'
  | 'japanese'
  | 'kawaii'
  | 'steampunk'
  | 'vaporwave'
  | 'cosmic'
  | 'elemental'
  | 'fantasy'
  | 'nature'
  | 'tribal'
  | 'geometric'
  | 'gothic'
  | 'holographic'
  | 'scifi'
  | 'minimal'
  | 'gaming'
  | 'seasonal'
  | 'achievement';

/** Border display type */
export type AvatarBorderType =
  // Legacy CSS types (customization store compatibility)
  | 'none'
  | 'static'
  | 'simple-glow'
  | 'gentle-pulse'
  | 'rotating-ring'
  | 'dual-ring'
  | 'gradient-wave'
  | 'spark-trail'
  | 'prismatic'
  | 'neon-outline'
  | 'ripple'
  | 'heartbeat'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'glow'
  | 'pulse'
  | 'rotate'
  | 'legendary'
  | 'mythic'
  // Lottie (animated JSON borders)
  | 'lottie';

/** How a border can be unlocked */
export type BorderUnlockType =
  | 'default'
  | 'subscription'
  | 'achievement'
  | 'leaderboard'
  | 'event'
  | 'purchase'
  | 'level'
  | 'prestige';

/** Full avatar border configuration for the cosmetics catalog */
export interface AvatarBorderConfig {
  /** Unique identifier */
  id: string;
  /** Border type */
  type: AvatarBorderType;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Theme category */
  theme: AvatarBorderTheme;
  /** Rarity tier */
  rarity: BorderRarity;
  /** How to unlock */
  unlockType: BorderUnlockType;
  /** Unlock requirement details */
  unlockRequirement?: {
    type: 'subscription' | 'achievement' | 'level' | 'nodes' | 'leaderboard' | 'event';
    value: string | number;
    description: string;
  };
  /** Primary color */
  primaryColor: string;
  /** Secondary color (optional) */
  secondaryColor?: string;
  /** Accent color (optional) */
  accentColor?: string;
  /** Number of particles/effects */
  particleCount?: number;
  /** Animation speed */
  animationSpeed?: 'slow' | 'normal' | 'fast';
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Is premium/paid */
  isPremium: boolean;
  /** Node cost (if purchasable) */
  nodeCost?: number;
  /** Preview image URL */
  previewUrl?: string;
  /** Tags for filtering */
  tags: string[];
  /** Lottie animation URL (CDN-hosted JSON) */
  lottieUrl?: string;
  /** Lottie asset ID for referencing backend manifest */
  lottieAssetId?: string;
  /** Lottie playback configuration */
  lottieConfig?: {
    loop?: boolean;
    speed?: number;
    segment?: [number, number];
  };
}

/** Fixed hex color arrays per theme */
export const BORDER_THEME_PALETTES: Record<BorderTheme, readonly string[]> = {
  '8BIT': ['#00ff41', '#ff00ff', '#00ffff', '#ffff00'],
  ANIME: ['#ff6b9d', '#c44dff', '#44d4ff', '#fffb87'],
  CYBERPUNK: ['#00f5ff', '#ff0055', '#7b2fff', '#1a0a2e'],
  KAWAII: ['#ffb3d9', '#b3ecff', '#ffe4b5', '#c8f7c5'],
  COSMIC: ['#0d0d2b', '#4b0082', '#7b2fff', '#c0f0ff', '#ffffff'],
} as const;

/** Particle shape used by border overlay effects */
export type BorderParticleShape = 'orb' | 'spark' | 'diamond' | 'none';

/** Rotation direction for animated borders */
export type BorderRotationDirection = 'cw' | 'ccw';

/** A single entry in the canonical border registry (compact, animation-layer) */
export interface BorderRegistryEntry {
  /** Unique ID, e.g. 'border_cosmic_legendary_01' */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Rarity tier */
  readonly rarity: BorderRarity;
  /** Visual theme */
  readonly theme: BorderTheme;
  /** Rotation direction (alternates within tier) */
  readonly rotationDirection: BorderRotationDirection;
  /** Particle shape — only LEGENDARY/MYTHIC have particles */
  readonly particleShape: BorderParticleShape;
  /** Lottie JSON filename (no path) */
  readonly lottieFile: string;
}

const BORDER_REGISTRY: readonly BorderRegistryEntry[] = [
  {
    id: 'border_8bit_common_01',
    name: 'Pixel Ring',
    rarity: 'common',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    // Use the free-tier 8bit asset since no `8bit_common_01.json` ships
    // in apps/web/public/lottie/borders. Mirrors what the cosmetics
    // catalogue actually has on disk.
    lottieFile: '8bit_free_01.json',
  },
  {
    id: 'border_kawaii_common_01',
    name: 'Pastel Circle',
    rarity: 'common',
    theme: 'KAWAII',
    rotationDirection: 'ccw',
    particleShape: 'none',
    // Same — no kawaii_common asset ships; fall back to the free-tier
    // pastel circle so the renderer doesn't 404 on the JSON fetch.
    lottieFile: 'kawaii_free_01.json',
  },

  {
    id: 'border_cyberpunk_common_01',
    name: 'Neon Trace',
    rarity: 'common',
    theme: 'CYBERPUNK',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_common_01.json',
  },
  {
    id: 'border_cosmic_common_01',
    name: 'Starlight Band',
    rarity: 'common',
    theme: 'COSMIC',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cosmic_common_01.json',
  },

  {
    id: 'border_anime_rare_01',
    name: 'Sakura Drift',
    rarity: 'rare',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'anime_rare_01.json',
  },
  {
    id: 'border_cyberpunk_rare_01',
    name: 'Circuit Loop',
    rarity: 'rare',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_rare_01.json',
  },

  {
    id: 'border_8bit_epic_01',
    name: 'Glitch Frame',
    rarity: 'epic',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_epic_01.json',
  },
  {
    id: 'border_cyberpunk_epic_01',
    name: 'Holo Grid',
    rarity: 'epic',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_epic_01.json',
  },

  {
    id: 'border_cosmic_legendary_01',
    name: 'Supernova',
    rarity: 'legendary',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'spark',
    lottieFile: 'cosmic_legendary_01.json',
  },

  {
    id: 'border_cyberpunk_mythic_01',
    name: 'Digital Ascension',
    rarity: 'mythic',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'cyberpunk_mythic_01.json',
  },

  {
    id: 'border_special_avatar_frame',
    name: 'Avatar Frame',
    rarity: 'mythic',
    theme: 'COSMIC',
    rotationDirection: 'cw',
    particleShape: 'spark',
    // Filename on disk is kebab-case; the registry referenced
    // a space-separated form that 404s.
    lottieFile: 'avatar-frame.json',
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Full AvatarBorder catalog (11 Lottie borders)                     */
/* ------------------------------------------------------------------ */

export const AVATAR_BORDERS: AvatarBorderConfig[] = [
  {
    id: 'border_8bit_common_01',
    type: 'lottie',
    name: 'Pixel Ring',
    description: 'A retro pixel-art ring with subtle pulse glow.',
    theme: '8bit',
    rarity: 'common',
    unlockType: 'default',
    primaryColor: '#00ff41',
    secondaryColor: '#ff00ff',
    accentColor: '#00ffff',
    isPremium: false,
    tags: ['8bit', 'retro', 'common', 'pixel'],
    lottieUrl: '/lottie/borders/8bit_free_01.json',
    lottieConfig: { loop: true, speed: 1 },
  },
  {
    id: 'border_kawaii_common_01',
    type: 'lottie',
    name: 'Pastel Circle',
    description: 'A dreamy pastel ring with soft pink pulse.',
    theme: 'kawaii',
    rarity: 'common',
    unlockType: 'default',
    primaryColor: '#ffb3d9',
    secondaryColor: '#b3ecff',
    accentColor: '#ffe4b5',
    isPremium: false,
    tags: ['kawaii', 'cute', 'common', 'pastel'],
    lottieUrl: '/lottie/borders/kawaii_free_01.json',
    lottieConfig: { loop: true, speed: 1 },
  },

  {
    id: 'border_cyberpunk_common_01',
    type: 'lottie',
    name: 'Neon Trace',
    description: 'A subtle neon outline pulsing with cyber energy.',
    theme: 'cyberpunk',
    rarity: 'common',
    unlockType: 'default',
    primaryColor: '#00f5ff',
    secondaryColor: '#ff0055',
    accentColor: '#7b2fff',
    isPremium: false,
    tags: ['cyberpunk', 'neon', 'common', 'trace'],
    lottieUrl: '/lottie/borders/cyberpunk_common_01.json',
    lottieConfig: { loop: true, speed: 1 },
  },
  {
    id: 'border_cosmic_common_01',
    type: 'lottie',
    name: 'Starlight Band',
    description: 'A cosmic ring speckled with distant starlight.',
    theme: 'cosmic',
    rarity: 'common',
    unlockType: 'default',
    primaryColor: '#0d0d2b',
    secondaryColor: '#4b0082',
    accentColor: '#7b2fff',
    isPremium: false,
    tags: ['cosmic', 'space', 'common', 'stars'],
    lottieUrl: '/lottie/borders/cosmic_common_01.json',
    lottieConfig: { loop: true, speed: 1 },
  },

  {
    id: 'border_anime_rare_01',
    type: 'lottie',
    name: 'Sakura Drift',
    description: 'A softly rotating anime ring with sakura essence.',
    theme: 'anime',
    rarity: 'rare',
    unlockType: 'level',
    unlockRequirement: { type: 'level', value: 8, description: 'Reach Level 8' },
    primaryColor: '#ff6b9d',
    secondaryColor: '#c44dff',
    accentColor: '#44d4ff',
    isPremium: true,
    tags: ['anime', 'sakura', 'rare', 'drifting'],
    lottieUrl: '/lottie/borders/anime_rare_01.json',
    lottieConfig: { loop: true, speed: 0.6 },
  },
  {
    id: 'border_cyberpunk_rare_01',
    type: 'lottie',
    name: 'Circuit Loop',
    description: 'A spinning circuit-board loop in electric cyan.',
    theme: 'cyberpunk',
    rarity: 'rare',
    unlockType: 'level',
    unlockRequirement: { type: 'level', value: 10, description: 'Reach Level 10' },
    primaryColor: '#00f5ff',
    secondaryColor: '#ff0055',
    accentColor: '#7b2fff',
    isPremium: true,
    tags: ['cyberpunk', 'circuit', 'rare', 'loop'],
    lottieUrl: '/lottie/borders/cyberpunk_rare_01.json',
    lottieConfig: { loop: true, speed: 0.6 },
  },

  {
    id: 'border_8bit_epic_01',
    type: 'lottie',
    name: 'Glitch Frame',
    description: 'Dual counter-rotating rings with a glitchy 8-bit pulse.',
    theme: '8bit',
    rarity: 'epic',
    unlockType: 'achievement',
    unlockRequirement: {
      type: 'achievement',
      value: 'retro_master',
      description: 'Unlock the Retro Master achievement',
    },
    primaryColor: '#00ff41',
    secondaryColor: '#ff00ff',
    accentColor: '#ffff00',
    isPremium: true,
    tags: ['8bit', 'glitch', 'epic', 'retro'],
    lottieUrl: '/lottie/borders/8bit_epic_01.json',
    lottieConfig: { loop: true, speed: 0.8 },
  },
  {
    id: 'border_cyberpunk_epic_01',
    type: 'lottie',
    name: 'Holo Grid',
    description: 'Counter-rotating holographic rings pulsing with data.',
    theme: 'cyberpunk',
    rarity: 'epic',
    unlockType: 'achievement',
    unlockRequirement: {
      type: 'achievement',
      value: 'cyber_explorer',
      description: 'Unlock the Cyber Explorer achievement',
    },
    primaryColor: '#00f5ff',
    secondaryColor: '#7b2fff',
    accentColor: '#ff0055',
    isPremium: true,
    tags: ['cyberpunk', 'holo', 'epic', 'grid'],
    lottieUrl: '/lottie/borders/cyberpunk_epic_01.json',
    lottieConfig: { loop: true, speed: 0.8 },
  },

  {
    id: 'border_cosmic_legendary_01',
    type: 'lottie',
    name: 'Supernova',
    description: 'Triple cosmic rings with sparking stellar energy.',
    theme: 'cosmic',
    rarity: 'legendary',
    unlockType: 'achievement',
    unlockRequirement: {
      type: 'achievement',
      value: 'supernova',
      description: 'Trigger a Supernova event',
    },
    primaryColor: '#4b0082',
    secondaryColor: '#c0f0ff',
    accentColor: '#ffffff',
    particleCount: 8,
    isPremium: true,
    tags: ['cosmic', 'supernova', 'legendary', 'stellar'],
    lottieUrl: '/lottie/borders/cosmic_legendary_01.json',
    lottieConfig: { loop: true, speed: 1.0 },
  },

  {
    id: 'border_cyberpunk_mythic_01',
    type: 'lottie',
    name: 'Digital Ascension',
    description: 'A purple demonic border with subtle horned contours and a low throb glow.',
    theme: 'cyberpunk',
    rarity: 'mythic',
    unlockType: 'event',
    unlockRequirement: {
      type: 'event',
      value: 'demonic_pulse',
      description: 'Complete the Demonic Pulse event',
    },
    primaryColor: '#8b5cf6',
    secondaryColor: '#581c87',
    accentColor: '#c084fc',
    particleCount: 16,
    isPremium: true,
    tags: ['cyberpunk', 'demonic', 'mythic', 'purple'],
    lottieUrl: '/lottie/borders/cyberpunk_mythic_01.json',
    lottieConfig: { loop: true, speed: 1.0 },
  },

  {
    id: 'border_special_avatar_frame',
    type: 'lottie',
    name: 'Avatar Frame',
    description: 'A premium animated avatar frame with shimmering stars and sweep effects.',
    theme: 'cosmic',
    rarity: 'mythic',
    unlockType: 'event',
    unlockRequirement: {
      type: 'event',
      value: 'avatar_frame_special',
      description: 'Obtain the Avatar Frame',
    },
    primaryColor: '#c0f0ff',
    secondaryColor: '#7b2fff',
    accentColor: '#ffffff',
    particleCount: 16,
    isPremium: true,
    tags: ['special', 'animated', 'mythic', 'frame', 'avatar'],
    lottieUrl: '/lottie/borders/avatar-frame.json',
    lottieConfig: { loop: true, speed: 1.0 },
  },
];

/** Get a border entry by ID (compact registry) */
export function getBorderById(id: string): BorderRegistryEntry | undefined {
  return BORDER_REGISTRY.find((b) => b.id === id);
}

/** Get all borders of a given rarity (compact registry) */
export function getBordersByRarity(rarity: BorderRarity): readonly BorderRegistryEntry[] {
  return BORDER_REGISTRY.filter((b) => b.rarity === rarity);
}

/** Get a full avatar border config by ID */
export function getAvatarBorderById(id: string): AvatarBorderConfig | undefined {
  return AVATAR_BORDERS.find((border) => border.id === id);
}

/** Get full avatar border configs by theme */
export function getAvatarBordersByTheme(theme: AvatarBorderTheme): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.theme === theme);
}

/** Get full avatar border configs by rarity */
export function getAvatarBordersByRarity(rarity: BorderRarity): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.rarity === rarity);
}

/** Get free (non-premium) avatar borders */
export function getFreeAvatarBorders(): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => !border.isPremium);
}

/** Get premium avatar borders */
export function getPremiumAvatarBorders(): AvatarBorderConfig[] {
  return AVATAR_BORDERS.filter((border) => border.isPremium);
}
