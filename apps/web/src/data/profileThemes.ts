/**
 * Canonical profile theme catalog.
 *
 * The seven themes below are the only selectable profile themes in web. They
 * share the runtime-neutral contract from @cgraph-dev/shared-types and are rendered
 * differently by the full profile, hover card, and customization preview card.
 */

import {
  PROFILE_THEME_CATEGORIES as PROFILE_THEME_CATEGORY_IDS,
  PROFILE_THEME_IDS,
  isProfileThemeId,
} from '@cgraph-dev/shared-types';
import type {
  ProfileThemeCategory,
  ProfileThemeConfig,
  ProfileThemeId,
  ProfileThemeTier,
} from '@cgraph-dev/shared-types';

export { PROFILE_THEME_CATEGORY_IDS, PROFILE_THEME_IDS };
export type { ProfileThemeCategory, ProfileThemeConfig, ProfileThemeId, ProfileThemeTier };

export const DEFAULT_PROFILE_THEME_ID: ProfileThemeId = 'signal-noir';

export interface ProfileThemeCategoryInfo {
  id: ProfileThemeCategory;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  themeCount: number;
}

export const PROFILE_THEME_CATEGORIES: ProfileThemeCategoryInfo[] = [
  {
    id: 'signal',
    name: 'Signal',
    description: 'Private, sharp, low-noise styling',
    icon: 'S',
    accentColor: '#38bdf8',
    themeCount: 1,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Glass layers with luminous depth',
    icon: 'A',
    accentColor: '#7dd3fc',
    themeCount: 1,
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Terminal pixels and green phosphor',
    icon: 'R',
    accentColor: '#86efac',
    themeCount: 1,
  },
  {
    id: 'solarpunk',
    name: 'Solarpunk',
    description: 'Organic light and warm canopy tones',
    icon: 'P',
    accentColor: '#facc15',
    themeCount: 1,
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Deep sky contrast and star fields',
    icon: 'C',
    accentColor: '#a78bfa',
    themeCount: 1,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Soft bloom, calm pinks, quiet depth',
    icon: 'K',
    accentColor: '#fb7185',
    themeCount: 1,
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Forged metal, heat, and amber glow',
    icon: 'E',
    accentColor: '#fb923c',
    themeCount: 1,
  },
];

export const ALL_PROFILE_THEMES: ProfileThemeConfig[] = [
  {
    id: 'signal-noir',
    name: 'Signal Noir',
    category: 'signal',
    tier: 'free',
    description: 'Private signal styling with crisp noir contrast.',
    backgroundGradient: ['#020617', '#0f172a', '#111827'],
    surfacePattern: 'scanline',
    glowEnabled: true,
    glowColor: '#38bdf8',
    glowIntensity: 0.62,
    accentPrimary: '#38bdf8',
    accentSecondary: '#818cf8',
    textColor: '#f8fafc',
    unlocked: true,
  },
  {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    category: 'aurora',
    tier: 'free',
    description: 'Transparent aurora ribbons over polished glass.',
    backgroundGradient: ['#031b1d', '#0f766e', '#2563eb', '#8b5cf6'],
    surfacePattern: 'glass',
    glowEnabled: true,
    glowColor: '#7dd3fc',
    glowIntensity: 0.72,
    accentPrimary: '#7dd3fc',
    accentSecondary: '#c4b5fd',
    textColor: '#f0fdfa',
    unlocked: true,
  },
  {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    category: 'retro',
    tier: 'free',
    description: 'Pixel grid, phosphor glow, and command-line energy.',
    backgroundGradient: ['#020403', '#052e16', '#064e3b'],
    surfacePattern: 'terminal-grid',
    glowEnabled: true,
    glowColor: '#86efac',
    glowIntensity: 0.58,
    accentPrimary: '#86efac',
    accentSecondary: '#22c55e',
    textColor: '#ecfdf5',
    unlocked: true,
  },
  {
    id: 'solarpunk-canopy',
    name: 'Solarpunk Canopy',
    category: 'solarpunk',
    tier: 'free',
    description: 'Green canopy shadows with clean solar highlights.',
    backgroundGradient: ['#10200f', '#166534', '#84cc16', '#facc15'],
    surfacePattern: 'canopy',
    glowEnabled: true,
    glowColor: '#facc15',
    glowIntensity: 0.55,
    accentPrimary: '#facc15',
    accentSecondary: '#4ade80',
    textColor: '#f7fee7',
    unlocked: true,
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    category: 'cosmic',
    tier: 'free',
    description: 'Nebula depth, cold stars, and quiet purple light.',
    backgroundGradient: ['#030014', '#11103a', '#312e81', '#0f172a'],
    surfacePattern: 'starfield',
    glowEnabled: true,
    glowColor: '#a78bfa',
    glowIntensity: 0.78,
    accentPrimary: '#a78bfa',
    accentSecondary: '#67e8f9',
    textColor: '#eef2ff',
    unlocked: true,
  },
  {
    id: 'sakura-dream',
    name: 'Sakura Dream',
    category: 'sakura',
    tier: 'free',
    description: 'Soft petals, rose light, and calm profile warmth.',
    backgroundGradient: ['#3b0715', '#9f1239', '#f9a8d4', '#fff1f2'],
    surfacePattern: 'petal-wash',
    glowEnabled: true,
    glowColor: '#fb7185',
    glowIntensity: 0.52,
    accentPrimary: '#fb7185',
    accentSecondary: '#f9a8d4',
    textColor: '#fff1f2',
    unlocked: true,
  },
  {
    id: 'ember-forge',
    name: 'Ember Forge',
    category: 'ember',
    tier: 'free',
    description: 'Charcoal metal, molten edges, and ember sparks.',
    backgroundGradient: ['#120806', '#451a03', '#9a3412', '#fb923c'],
    surfacePattern: 'forge',
    glowEnabled: true,
    glowColor: '#fb923c',
    glowIntensity: 0.72,
    accentPrimary: '#fb923c',
    accentSecondary: '#facc15',
    textColor: '#fff7ed',
    unlocked: true,
  },
];

/** Resolves the default theme once so stale catalog edits fail loudly. */
function resolveDefaultProfileTheme(): ProfileThemeConfig {
  const theme = ALL_PROFILE_THEMES.find(({ id }) => id === DEFAULT_PROFILE_THEME_ID);
  if (!theme) {
    throw new Error(`Missing default profile theme: ${DEFAULT_PROFILE_THEME_ID}`);
  }
  return theme;
}

const DEFAULT_PROFILE_THEME = resolveDefaultProfileTheme();

/** Returns all static profile themes belonging to a category. */
export function getThemesByCategory(category: ProfileThemeCategory): ProfileThemeConfig[] {
  return ALL_PROFILE_THEMES.filter((theme) => theme.category === category);
}

/** Looks up a static profile theme by ID and rejects stale or unknown IDs. */
export function getThemeById(id: string | null | undefined): ProfileThemeConfig | undefined {
  if (!isProfileThemeId(id)) return undefined;
  return ALL_PROFILE_THEMES.find((theme) => theme.id === id);
}

/** Returns the selected profile theme, falling back to the default theme. */
export function getProfileThemeOrDefault(id: string | null | undefined): ProfileThemeConfig {
  return getThemeById(id) ?? DEFAULT_PROFILE_THEME;
}

export const TIER_COLORS: Record<
  ProfileThemeTier,
  { bg: string; text: string; border: string; glow: string }
> = {
  free: {
    bg: 'bg-white/10',
    text: 'text-white',
    border: 'border-white/20',
    glow: 'rgba(255,255,255,0.18)',
  },
  premium: {
    bg: 'bg-gradient-to-r from-purple-600 to-pink-500',
    text: 'text-white',
    border: 'border-purple-300/70',
    glow: 'rgba(168,85,247,0.5)',
  },
  enterprise: {
    bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    text: 'text-white',
    border: 'border-yellow-200/80',
    glow: 'rgba(251,191,36,0.6)',
  },
};
