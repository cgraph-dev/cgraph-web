/**
 * User Profile Card Constants
 *
 * Configuration constants for the profile card behavior.
 * Includes legacy constants + V2 accent themes, nameplate styles,
 * badge rarity configs, and pulse tier mappings.
 */

import {
  getThemeById,
  isProfileThemeId,
  type ProfileThemeConfig,
} from '@/data/profileThemes';
import {
  getProfileThemeAssetManifestOrDefault,
  type ProfileThemeAssetManifestSet,
} from '@cgraph-dev/shared-types';
import type { AccentThemeId, BadgeDisplayTier, NameplateVariant, PulseTier } from './types';

// Hover behavior

export const HOVER_DELAY_MS = 500;

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
  previewImage?: string;
  profileBackgroundImage?: string;
  miniProfileBackgroundImage?: string;
  bundleId?: string;
  assetManifest: ProfileThemeAssetManifestSet;
}

const SIGNAL_NOIR_BUNDLE_IMAGES = {
  previewImage:
    '/cosmetics/pixellab/profile-theme-preview/theme_signal_noir_preview/theme_signal_noir_preview_0.png',
  profileBackgroundImage:
    '/cosmetics/pixellab/profile-background/profile_signal_noir/profile_signal_noir_0.png',
  miniProfileBackgroundImage:
    '/cosmetics/pixellab/mini-profile-background/mini_signal_noir/mini_signal_noir_0.png',
  bundleId: 'signal-noir-founder',
} as const;

function hexToRgbTuple(hex: string): string {
  const normalized = hex.replace('#', '');
  if (!/^[a-fA-F0-9]{6}$/.test(normalized)) return '255,255,255';

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `${red},${green},${blue}`;
}

function alpha(hex: string, opacity: number): string {
  return `rgba(${hexToRgbTuple(hex)},${opacity.toFixed(3).replace(/0+$/, '').replace(/[.]$/, '')})`;
}

function gradientStops(theme: ProfileThemeConfig): string {
  const lastIndex = Math.max(theme.backgroundGradient.length - 1, 1);

  return theme.backgroundGradient
    .map((color, index) => `${color} ${Math.round((index / lastIndex) * 100)}%`)
    .join(', ');
}

function createAccentTheme(theme: ProfileThemeConfig): AccentTheme {
  const imageFallback = theme.id === 'signal-noir' ? SIGNAL_NOIR_BUNDLE_IMAGES : null;
  const assetManifest = getProfileThemeAssetManifestOrDefault(theme.id);
  const primary = theme.backgroundGradient[0] ?? '#08090f';
  const accent = theme.accentPrimary;
  const secondary = theme.accentSecondary;
  const glowOpacity = Math.min(Math.max((theme.glowIntensity ?? 0.7) * 0.25, 0.14), 0.22);

  return {
    accent,
    dim: alpha(accent, 0.1),
    glow: alpha(accent, glowOpacity),
    surface: alpha(accent, 0.028),
    body: `linear-gradient(160deg, ${alpha(accent, 0.065)} 0%, ${alpha(
      secondary,
      0.05
    )} 48%, ${alpha(primary, 0.98)} 100%), #08090f`,
    banner: `linear-gradient(135deg, ${gradientStops(theme)})`,
    border: alpha(accent, 0.14),
    rgb: hexToRgbTuple(accent),
    previewImage: theme.previewImage ?? imageFallback?.previewImage,
    profileBackgroundImage: theme.profileBackgroundImage ?? imageFallback?.profileBackgroundImage,
    miniProfileBackgroundImage:
      theme.miniProfileBackgroundImage ?? imageFallback?.miniProfileBackgroundImage,
    bundleId: theme.bundleId ?? imageFallback?.bundleId,
    assetManifest,
  };
}

function profileThemeConfig(id: AccentThemeId): ProfileThemeConfig {
  const theme = getThemeById(id);
  if (!theme) {
    throw new Error(`Missing shared profile theme: ${id}`);
  }
  return theme;
}

export const ACCENT_THEMES = {
  'signal-noir': createAccentTheme(profileThemeConfig('signal-noir')),
  'aurora-glass': createAccentTheme(profileThemeConfig('aurora-glass')),
  'retro-terminal': createAccentTheme(profileThemeConfig('retro-terminal')),
  'solarpunk-canopy': createAccentTheme(profileThemeConfig('solarpunk-canopy')),
  'deep-space': createAccentTheme(profileThemeConfig('deep-space')),
  'sakura-dream': createAccentTheme(profileThemeConfig('sakura-dream')),
  'ember-forge': createAccentTheme(profileThemeConfig('ember-forge')),
  'neon-rain-district': createAccentTheme(profileThemeConfig('neon-rain-district')),
  'arcane-library': createAccentTheme(profileThemeConfig('arcane-library')),
  'ocean-abyss-lab': createAccentTheme(profileThemeConfig('ocean-abyss-lab')),
  'celestial-throne': createAccentTheme(profileThemeConfig('celestial-throne')),
  'toxic-reactor-core': createAccentTheme(profileThemeConfig('toxic-reactor-core')),
} satisfies Record<AccentThemeId, AccentTheme>;

/** Return a known profile-card accent theme id, or undefined for stale/custom values. */
export function normalizeAccentThemeId(value: string | null | undefined): AccentThemeId | undefined {
  return isProfileThemeId(value) ? value : undefined;
}

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
