/**
 * User Profile Card Constants
 *
 * Configuration constants for the profile card behavior.
 * Includes legacy constants + V2 accent themes, nameplate styles,
 * badge rarity configs, and pulse tier mappings.
 */

import type {
  AccentThemeId,
  BadgeDisplayTier,
  NameplateVariant,
  PulseTier,
} from './types';

// LEGACY CONSTANTS (preserved)

export const HOVER_DELAY_MS = 500;

export const DEFAULT_PLACEHOLDER_USER = {
  id: '',
  username: 'Loading...',
  displayName: 'Loading...',
  avatarUrl: '',
  level: 0,
  xp: 0,
  xpToNextLevel: 100,
  pulse: 0,
  streak: 0,
  isOnline: false,
} as const;

export const MAX_MUTUAL_FRIENDS_DISPLAY = 5;
export const MAX_BADGES_DISPLAY = 3;
export const MAX_SHARED_FORUMS_DISPLAY = 3;

// V2 ACCENT THEME PRESETS

interface AccentTheme {
  accent: string;
  dim: string;
  glow: string;
  surface: string;
  border: string;
  rgb: string;
}

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  default: {
    accent: '#00d4aa',
    dim: 'rgba(0,212,170,0.10)',
    glow: 'rgba(0,212,170,0.18)',
    surface: 'rgba(0,212,170,0.022)',
    border: 'rgba(0,212,170,0.08)',
    rgb: '0,212,170',
  },
  ember: {
    accent: '#e8a020',
    dim: 'rgba(232,160,32,0.10)',
    glow: 'rgba(232,160,32,0.18)',
    surface: 'rgba(232,160,32,0.022)',
    border: 'rgba(232,160,32,0.08)',
    rgb: '232,160,32',
  },
  void: {
    accent: '#7c6ef5',
    dim: 'rgba(124,110,245,0.10)',
    glow: 'rgba(124,110,245,0.18)',
    surface: 'rgba(124,110,245,0.022)',
    border: 'rgba(124,110,245,0.08)',
    rgb: '124,110,245',
  },
  rose: {
    accent: '#f03060',
    dim: 'rgba(240,48,96,0.10)',
    glow: 'rgba(240,48,96,0.18)',
    surface: 'rgba(240,48,96,0.022)',
    border: 'rgba(240,48,96,0.08)',
    rgb: '240,48,96',
  },
  ice: {
    accent: '#18b8f8',
    dim: 'rgba(24,184,248,0.10)',
    glow: 'rgba(24,184,248,0.18)',
    surface: 'rgba(24,184,248,0.022)',
    border: 'rgba(24,184,248,0.08)',
    rgb: '24,184,248',
  },
};

// V2 NAMEPLATE STYLES

interface NameplateStyle {
  bg: string;
  border: string;
  shadow: string;
  glowLeft: string;
  glowRight: string;
}

export const NAMEPLATE_STYLES: Record<NameplateVariant, NameplateStyle> = {
  cosmic: {
    bg: 'linear-gradient(150deg, rgba(18,10,42,0.94) 0%, rgba(8,5,22,0.90) 100%)',
    border: 'rgba(124,110,245,0.18)',
    shadow:
      '0 1px 0 rgba(255,255,255,0.055) inset, 0 0 28px rgba(124,110,245,0.07), 0 4px 16px rgba(0,0,0,0.55)',
    glowLeft: 'rgba(124,110,245,0.24)',
    glowRight: 'rgba(0,212,170,0.11)',
  },
  aurora: {
    bg: 'linear-gradient(150deg, rgba(3,18,16,0.94) 0%, rgba(2,9,8,0.90) 100%)',
    border: 'rgba(0,212,170,0.16)',
    shadow:
      '0 1px 0 rgba(255,255,255,0.05) inset, 0 0 28px rgba(0,212,170,0.06), 0 4px 16px rgba(0,0,0,0.55)',
    glowLeft: 'rgba(0,212,170,0.20)',
    glowRight: 'rgba(56,189,248,0.10)',
  },
  ember: {
    bg: 'linear-gradient(150deg, rgba(20,9,2,0.94) 0%, rgba(10,5,1,0.90) 100%)',
    border: 'rgba(232,160,32,0.18)',
    shadow:
      '0 1px 0 rgba(255,255,255,0.055) inset, 0 0 28px rgba(232,160,32,0.06), 0 4px 16px rgba(0,0,0,0.55)',
    glowLeft: 'rgba(232,160,32,0.20)',
    glowRight: 'rgba(248,80,50,0.10)',
  },
  none: {
    bg: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.05)',
    shadow: '0 4px 16px rgba(0,0,0,0.4)',
    glowLeft: 'transparent',
    glowRight: 'transparent',
  },
};

// V2 BADGE RARITY CONFIG (crystal gem display)

interface BadgeRarityConfig {
  faceBg: string;
  borderColor: string;
  glowColor: string;
  animation: string | null;
}

export const BADGE_RARITY_CONFIG: Record<BadgeDisplayTier, BadgeRarityConfig> = {
  legendary: {
    faceBg: 'linear-gradient(160deg, #291600 0%, #160b00 45%, #0c0700 100%)',
    borderColor: 'rgba(232,160,32,0.4)',
    glowColor: 'rgba(232,160,32,0.18)',
    animation: 'pc-gem-float 3.8s ease-in-out infinite',
  },
  epic: {
    faceBg: 'linear-gradient(160deg, #110828 0%, #080420 45%, #040215 100%)',
    borderColor: 'rgba(124,110,245,0.38)',
    glowColor: 'rgba(124,110,245,0.15)',
    animation: 'pc-gem-breathe 4.2s ease-in-out infinite',
  },
  rare: {
    faceBg: 'linear-gradient(160deg, #061520 0%, #030c18 45%, #020810 100%)',
    borderColor: 'rgba(56,189,248,0.32)',
    glowColor: 'rgba(56,189,248,0.12)',
    animation: null,
  },
  dim: {
    faceBg: '#151c28',
    borderColor: 'rgba(255,255,255,0.03)',
    glowColor: 'transparent',
    animation: null,
  },
};

// V2 PULSE TIER SYSTEM

export const PULSE_TIERS: { min: number; tier: PulseTier }[] = [
  { min: 0, tier: 'Newcomer' },
  { min: 20, tier: 'Beginner' },
  { min: 50, tier: 'Intermediate' },
  { min: 100, tier: 'Advanced' },
  { min: 200, tier: 'Expert' },
  { min: 500, tier: 'Master' },
  { min: 1000, tier: 'Legend' },
];

/** Derive pulse tier from a raw score */
export function getPulseTier(score: number): PulseTier {
  let result: PulseTier = 'Newcomer';
  for (const entry of PULSE_TIERS) {
    if (score >= entry.min) {
      result = entry.tier;
    }
  }
  return result;
}

/** Derive filled dots (0–5) from score within current tier */
export function getPulseFilled(score: number): number {
  let currentMin = 0;
  let nextMin = 20;

  for (let i = 0; i < PULSE_TIERS.length; i++) {
    const entry = PULSE_TIERS[i];
    if (entry && score >= entry.min) {
      currentMin = entry.min;
      const next = PULSE_TIERS[i + 1];
      nextMin = next?.min ?? currentMin + 500;
    }
  }

  const lastTier = PULSE_TIERS[PULSE_TIERS.length - 1];
  if (lastTier && score >= lastTier.min) {
    return 5;
  }

  const progress = (score - currentMin) / (nextMin - currentMin);
  return Math.min(5, Math.floor(progress * 5));
}

/**
 * Map existing BadgeRarity (from @/data/badgesCollection.ts) to BadgeDisplayTier.
 * common → dim, mythic → legendary, others pass through.
 */
export function mapRarityToDisplayTier(rarity: string): BadgeDisplayTier {
  const MAP: Record<string, BadgeDisplayTier> = {
    common: 'dim',
    mythic: 'legendary',
  };

  if (rarity === 'dim' || rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
    return rarity;
  }

  return MAP[rarity] ?? 'dim';
}
