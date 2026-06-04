import type { AvatarBorderType as SharedAvatarBorderType } from '@cgraph-dev/animation-constants';

/**
 * Avatar Border Type Definitions
 *
 * Comprehensive type system for themed avatar borders across different aesthetics.
 * Each theme has multiple border variations with unique animations.
 *
 */
export type BorderTheme =
  | 'free' // Free tier borders
  | 'premium' // Premium subscription
  | 'enterprise' // Enterprise subscription
  | 'legendary' // Achievement-locked
  | 'mythic' // Special events/Top 100
  | '8bit' // Retro gaming aesthetic
  | 'chinese' // Chinese traditional
  | 'anime' // Anime/manga style
  | 'cyberpunk' // Futuristic cyberpunk
  | 'japanese' // Japanese traditional
  | 'kawaii' // Cute Japanese style
  | 'steampunk' // Victorian + industrial
  | 'vaporwave' // 80s/90s aesthetic
  | 'cosmic' // Space/galaxy theme
  | 'elemental' // Elemental forces
  | 'fantasy' // Medieval fantasy
  | 'nature' // Natural elements
  | 'tribal' // Tribal patterns
  | 'geometric' // Mathematical patterns
  | 'gothic' // Dark gothic style
  | 'holographic' // Futuristic holo
  | 'scifi' // Science fiction
  | 'minimal' // Minimalist design
  | 'gaming' // Gaming themed
  | 'seasonal' // Seasonal events
  | 'achievement'; // Achievement rewards
export type AvatarBorderType = SharedAvatarBorderType;
export type BorderRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type BorderUnlockType =
  | 'default' // Available to all
  | 'subscription' // Requires active subscription
  | 'achievement' // Unlocked via achievement
  | 'leaderboard' // Top 100 in category
  | 'event' // Special event reward
  | 'purchase' // Buy with nodes
  | 'level' // Reach specific level
  | 'prestige'; // Prestige system
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
  theme: BorderTheme;

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
export type BorderAnimationType =
  | 'static'
  | 'rotate'
  | 'pulse'
  | 'glow'
  | 'shimmer'
  | 'gradient-shift'
  | 'particles'
  | 'morph'
  | 'glitch'
  | 'wave'
  | 'spiral'
  | 'breathe'
  | 'flicker'
  | 'cascade'
  | 'ripple'
  | 'lottie';
export const THEME_COLORS: Record<
  BorderTheme,
  { primary: string; secondary: string; accent: string }
> = {
  free: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    accent: '#d1d5db',
  },
  premium: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
  },
  enterprise: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
  },
  mythic: {
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f472b6',
  },
  '8bit': {
    primary: '#00ff00',
    secondary: '#ff00ff',
    accent: '#00ffff',
  },
  chinese: {
    primary: '#c1121f',
    secondary: '#ffc300',
    accent: '#003566',
  },
  anime: {
    primary: '#ff006e',
    secondary: '#8338ec',
    accent: '#3a86ff',
  },
  cyberpunk: {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    accent: '#ffff00',
  },
  japanese: {
    primary: '#c41e3a',
    secondary: '#f5f5dc',
    accent: '#daa520',
  },
  kawaii: {
    primary: '#ffb3d9',
    secondary: '#b3e0ff',
    accent: '#ffffb3',
  },
  steampunk: {
    primary: '#8b4513',
    secondary: '#cd7f32',
    accent: '#ffd700',
  },
  vaporwave: {
    primary: '#ff71ce',
    secondary: '#01cdfe',
    accent: '#05ffa1',
  },
  cosmic: {
    primary: '#4a0e8f',
    secondary: '#7b2cbf',
    accent: '#c77dff',
  },
  elemental: {
    primary: '#e74c3c',
    secondary: '#3498db',
    accent: '#2ecc71',
  },
  fantasy: {
    primary: '#6a4c93',
    secondary: '#1982c4',
    accent: '#8ac926',
  },
  nature: {
    primary: '#2d6a4f',
    secondary: '#52b788',
    accent: '#95d5b2',
  },
  tribal: {
    primary: '#d4a574',
    secondary: '#8b4513',
    accent: '#ff6347',
  },
  geometric: {
    primary: '#457b9d',
    secondary: '#1d3557',
    accent: '#f1faee',
  },
  gothic: {
    primary: '#2d0a31',
    secondary: '#5c1a63',
    accent: '#9b59b6',
  },
  holographic: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
  },
  scifi: {
    primary: '#00d4ff',
    secondary: '#7209b7',
    accent: '#4cc9f0',
  },
  minimal: {
    primary: '#374151',
    secondary: '#6b7280',
    accent: '#9ca3af',
  },
  gaming: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#22c55e',
  },
  seasonal: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    accent: '#10b981',
  },
  achievement: {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#d97706',
  },
};
export const RARITY_COLORS: Record<BorderRarity, { glow: string; gradient: string }> = {
  free: {
    glow: 'rgba(156, 163, 175, 0.3)',
    gradient: 'from-gray-400 to-gray-500',
  },
  common: {
    glow: 'rgba(156, 163, 175, 0.4)',
    gradient: 'from-gray-500 to-gray-600',
  },
  rare: {
    glow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-400 to-indigo-500',
  },
  epic: {
    glow: 'rgba(139, 92, 246, 0.6)',
    gradient: 'from-purple-400 to-violet-500',
  },
  legendary: {
    glow: 'rgba(245, 158, 11, 0.7)',
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
  },
  mythic: {
    glow: 'rgba(236, 72, 153, 0.8)',
    gradient: 'from-pink-400 via-rose-400 to-red-500',
  },
};
