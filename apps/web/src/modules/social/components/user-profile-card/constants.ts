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
  body: string;
  banner: string;
  border: string;
  rgb: string;
}

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  'signal-noir': {
    accent: '#38bdf8',
    dim: 'rgba(56,189,248,0.10)',
    glow: 'rgba(56,189,248,0.18)',
    surface: 'rgba(56,189,248,0.026)',
    body: 'linear-gradient(180deg, rgba(56,189,248,0.055) 0%, rgba(8,9,15,0.98) 48%, #08090f 100%)',
    banner: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)',
    border: 'rgba(56,189,248,0.12)',
    rgb: '56,189,248',
  },
  'aurora-glass': {
    accent: '#7dd3fc',
    dim: 'rgba(125,211,252,0.10)',
    glow: 'rgba(125,211,252,0.18)',
    surface: 'rgba(125,211,252,0.028)',
    body: 'linear-gradient(160deg, rgba(45,212,191,0.07) 0%, rgba(59,130,246,0.045) 42%, rgba(139,92,246,0.06) 100%), #071016',
    banner: 'linear-gradient(135deg, #031b1d 0%, #0f766e 42%, #8b5cf6 100%)',
    border: 'rgba(125,211,252,0.14)',
    rgb: '125,211,252',
  },
  'retro-terminal': {
    accent: '#86efac',
    dim: 'rgba(134,239,172,0.10)',
    glow: 'rgba(134,239,172,0.18)',
    surface: 'rgba(34,197,94,0.026)',
    body: 'linear-gradient(180deg, rgba(34,197,94,0.055) 0%, rgba(4,15,9,0.98) 55%, #050805 100%)',
    banner: 'linear-gradient(135deg, #020403 0%, #052e16 50%, #064e3b 100%)',
    border: 'rgba(134,239,172,0.14)',
    rgb: '134,239,172',
  },
  'solarpunk-canopy': {
    accent: '#facc15',
    dim: 'rgba(250,204,21,0.10)',
    glow: 'rgba(250,204,21,0.18)',
    surface: 'rgba(132,204,22,0.028)',
    body: 'linear-gradient(155deg, rgba(74,222,128,0.055) 0%, rgba(250,204,21,0.05) 52%, rgba(10,18,8,0.98) 100%), #0b1208',
    banner: 'linear-gradient(135deg, #10200f 0%, #166534 48%, #facc15 100%)',
    border: 'rgba(250,204,21,0.16)',
    rgb: '250,204,21',
  },
  'deep-space': {
    accent: '#a78bfa',
    dim: 'rgba(167,139,250,0.10)',
    glow: 'rgba(167,139,250,0.20)',
    surface: 'rgba(167,139,250,0.03)',
    body: 'radial-gradient(circle at 20% 0%, rgba(103,232,249,0.07), transparent 34%), linear-gradient(180deg, rgba(167,139,250,0.06) 0%, #070617 72%)',
    banner: 'linear-gradient(135deg, #030014 0%, #11103a 48%, #312e81 100%)',
    border: 'rgba(167,139,250,0.15)',
    rgb: '167,139,250',
  },
  'sakura-dream': {
    accent: '#fb7185',
    dim: 'rgba(251,113,133,0.10)',
    glow: 'rgba(251,113,133,0.18)',
    surface: 'rgba(251,113,133,0.026)',
    body: 'linear-gradient(160deg, rgba(251,113,133,0.06) 0%, rgba(249,168,212,0.045) 50%, rgba(30,8,14,0.98) 100%), #12070c',
    banner: 'linear-gradient(135deg, #3b0715 0%, #9f1239 46%, #f9a8d4 100%)',
    border: 'rgba(251,113,133,0.13)',
    rgb: '251,113,133',
  },
  'ember-forge': {
    accent: '#fb923c',
    dim: 'rgba(251,146,60,0.10)',
    glow: 'rgba(251,146,60,0.20)',
    surface: 'rgba(251,146,60,0.028)',
    body: 'linear-gradient(160deg, rgba(251,146,60,0.07) 0%, rgba(154,52,18,0.055) 48%, rgba(18,8,6,0.98) 100%), #130806',
    banner: 'linear-gradient(135deg, #120806 0%, #451a03 48%, #fb923c 100%)',
    border: 'rgba(251,146,60,0.15)',
    rgb: '251,146,60',
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
