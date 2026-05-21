/**
 * Nameplate Registry — shared across web and mobile.
 *
 * Defines the canonical catalogue of decorative username nameplates
 * with rarity tiers, Lottie file references, text effects, and emblems.
 *
 * Nameplates render as a horizontal bar (300×48px canvas) behind the
 * username text and are shown across multiple UI surfaces:
 * - Friend list entries
 * - Group/channel member lists
 * - Forum member cards
 * - Online user panels
 * - Profile cards
 * - Chat message headers (optional)
 *
 */

/** Rarity tiers matching the global system */
export type NameplateRarity =
  | 'free'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

/** Text effect applied to the username on this nameplate */
export type NameplateTextEffect =
  | 'none'
  | 'glow'
  | 'metallic'
  | 'holographic'
  | 'fire'
  | 'ice'
  | 'neon'
  | 'glitch'
  | 'rainbow'
  | 'shadow'
  | 'emboss';

/** Border style around the nameplate bar */
export type NameplateBorderStyle = 'none' | 'solid' | 'gradient' | 'animated' | 'double' | 'glow';

/** Renderer selection for motion-backed nameplates */
export type NameplateAnimationType = 'lottie';

/** A single nameplate entry */
export interface NameplateEntry {
  /** Unique nameplate ID */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Rarity tier */
  readonly rarity: NameplateRarity;
  /** Whether the nameplate is always unlocked */
  readonly free: boolean;
  /** Lottie JSON filename */
  readonly lottieFile: string;
  /** Text color to use on top of this nameplate background */
  readonly textColor: string;
  /** Short description shown in the picker */
  readonly description: string;
  /** Text effect applied to username text (glow, metallic, etc.) */
  readonly textEffect: NameplateTextEffect;
  /** Optional secondary/gradient text color for metallic/rainbow effects */
  readonly textColorSecondary: string | null;
  /** Emblem icon shown before the username (emoji or icon key) */
  readonly emblem: string | null;
  /** Path to Lottie JSON file */
  readonly lottieUrl: string;
  /** Renderer selection */
  readonly animationType: NameplateAnimationType;
  /** Fallback gradient used while the Lottie asset is loading */
  readonly barGradient: readonly [string, string] | null;
  /** Border style around the nameplate */
  readonly borderStyle: NameplateBorderStyle;
  /** Border color (can be gradient start color) */
  readonly borderColor: string | null;
  /** Category/theme tag for filtering */
  readonly category: string;
}

/**
 * Raw catalogue rows may omit motion fields while data is being authored.
 * The exported registry is normalized so every row has a Lottie source.
 */
type RawNameplateEntry = Omit<
  NameplateEntry,
  'animationType' | 'lottieFile' | 'lottieUrl'
> & {
  readonly lottieFile?: string | null;
  readonly lottieUrl?: string;
  readonly animationType?: NameplateAnimationType;
};

const DEFAULT_NAMEPLATE_LOTTIE_FILE = 'placeholder.json';

function normalizeNameplate(entry: RawNameplateEntry): NameplateEntry {
  const lottieFile = entry.lottieFile ?? DEFAULT_NAMEPLATE_LOTTIE_FILE;

  return {
    ...entry,
    lottieFile,
    lottieUrl: entry.lottieUrl ?? `nameplates/${lottieFile}`,
    animationType: 'lottie',
  };
}

const RAW_NAMEPLATE_REGISTRY: readonly RawNameplateEntry[] = [
  {
    id: 'plate_none',
    name: 'None',
    rarity: 'free',
    free: true,
    lottieFile: null,
    textColor: '#ffffff',
    description: 'Plain text, no background',
    textEffect: 'none',
    textColorSecondary: null,
    emblem: null,
    barGradient: null,
    borderStyle: 'none',
    borderColor: null,
    category: 'basic',
  },
  {
    id: 'plate_simple_dark',
    name: 'Shadow',
    rarity: 'free',
    free: true,
    lottieFile: 'plate_simple_dark.json',
    lottieUrl: 'nameplates/plate_simple_dark.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Dark translucent bar with subtle shadow',
    textEffect: 'shadow',
    textColorSecondary: null,
    emblem: null,
    barGradient: ['#1a1a2e', '#16213e'],
    borderStyle: 'solid',
    borderColor: '#ffffff20',
    category: 'basic',
  },
  {
    id: 'plate_starter',
    name: 'Starter',
    rarity: 'free',
    free: true,
    lottieFile: null,
    textColor: '#e2e8f0',
    description: 'Minimal frosted glass bar',
    textEffect: 'none',
    textColorSecondary: null,
    emblem: null,
    barGradient: ['#334155', '#1e293b'],
    borderStyle: 'solid',
    borderColor: '#475569',
    category: 'basic',
  },
  {
    id: 'plate_gold_shimmer',
    name: 'Gold',
    rarity: 'common',
    free: false,
    lottieFile: 'plate_gold_shimmer.json',
    lottieUrl: 'nameplates/plate_gold_shimmer.json',
    animationType: 'lottie',
    textColor: '#1a1a1a',
    description: 'Shimmering gold gradient bar',
    textEffect: 'metallic',
    textColorSecondary: '#b8860b',
    emblem: '✦',
    barGradient: ['#ffd700', '#b8860b'],
    borderStyle: 'gradient',
    borderColor: '#ffd700',
    category: 'metallic',
  },
  {
    id: 'plate_sakura',
    name: 'Sakura',
    rarity: 'common',
    free: false,
    lottieFile: 'plate_sakura.json',
    lottieUrl: 'nameplates/plate_sakura.json',
    animationType: 'lottie',
    textColor: '#4a0020',
    description: 'Cherry blossom petals drifting across',
    textEffect: 'glow',
    textColorSecondary: '#ff69b4',
    emblem: '🌸',
    barGradient: ['#ffb7c5', '#ff69b4'],
    borderStyle: 'solid',
    borderColor: '#ff69b440',
    category: 'nature',
  },
  {
    id: 'plate_ocean_wave',
    name: 'Ocean Wave',
    rarity: 'common',
    free: false,
    lottieFile: 'plate_ocean_wave.json',
    lottieUrl: 'nameplates/plate_ocean_wave.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Gentle ocean waves rolling across',
    textEffect: 'glow',
    textColorSecondary: '#00bfff',
    emblem: '🌊',
    barGradient: ['#006994', '#00bfff'],
    borderStyle: 'solid',
    borderColor: '#00bfff30',
    category: 'nature',
  },
  {
    id: 'plate_silver',
    name: 'Silver',
    rarity: 'common',
    free: false,
    lottieFile: 'plate_silver.json',
    lottieUrl: 'nameplates/plate_silver.json',
    animationType: 'lottie',
    textColor: '#1a1a2e',
    description: 'Polished silver with subtle reflections',
    textEffect: 'metallic',
    textColorSecondary: '#c0c0c0',
    emblem: '◆',
    barGradient: ['#c0c0c0', '#808080'],
    borderStyle: 'gradient',
    borderColor: '#c0c0c0',
    category: 'metallic',
  },
  {
    id: 'plate_cyber_bar',
    name: 'Cyber Bar',
    rarity: 'rare',
    free: false,
    lottieFile: 'plate_cyber_bar.json',
    lottieUrl: 'nameplates/plate_cyber_bar.json',
    animationType: 'lottie',
    textColor: '#00f5ff',
    description: 'Neon circuit-traced bar with data streams',
    textEffect: 'neon',
    textColorSecondary: '#ff00ff',
    emblem: '⚡',
    barGradient: ['#0a0a2e', '#1a0033'],
    borderStyle: 'animated',
    borderColor: '#00f5ff',
    category: 'cyberpunk',
  },
  {
    id: 'plate_fire',
    name: 'Flame',
    rarity: 'rare',
    free: false,
    lottieFile: 'plate_fire.json',
    lottieUrl: 'nameplates/plate_fire.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Flickering flame bar with ember glow',
    textEffect: 'fire',
    textColorSecondary: '#ff4500',
    emblem: '🔥',
    barGradient: ['#8b0000', '#ff4500'],
    borderStyle: 'glow',
    borderColor: '#ff4500',
    category: 'elemental',
  },
  {
    id: 'plate_galaxy',
    name: 'Galaxy',
    rarity: 'rare',
    free: false,
    lottieFile: 'plate_galaxy.json',
    lottieUrl: 'nameplates/plate_galaxy.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Starfield and nebula swirl with twinkling stars',
    textEffect: 'glow',
    textColorSecondary: '#c084fc',
    emblem: '✧',
    barGradient: ['#0d0221', '#2d1b69'],
    borderStyle: 'gradient',
    borderColor: '#8b5cf6',
    category: 'cosmic',
  },
  {
    id: 'plate_frost',
    name: 'Frost',
    rarity: 'rare',
    free: false,
    lottieFile: 'plate_frost.json',
    lottieUrl: 'nameplates/plate_frost.json',
    animationType: 'lottie',
    textColor: '#e0f2fe',
    description: 'Frozen ice crystals with cold mist',
    textEffect: 'ice',
    textColorSecondary: '#67e8f9',
    emblem: '❄',
    barGradient: ['#164e63', '#0e7490'],
    borderStyle: 'glow',
    borderColor: '#67e8f9',
    category: 'elemental',
  },
  {
    id: 'plate_forest_spirit',
    name: 'Forest Spirit',
    rarity: 'rare',
    free: false,
    lottieFile: 'plate_forest_spirit.json',
    lottieUrl: 'nameplates/plate_forest_spirit.json',
    animationType: 'lottie',
    textColor: '#d1fae5',
    description: 'Living vines and floating leaves',
    textEffect: 'glow',
    textColorSecondary: '#34d399',
    emblem: '🌿',
    barGradient: ['#064e3b', '#047857'],
    borderStyle: 'solid',
    borderColor: '#34d39940',
    category: 'nature',
  },
  {
    id: 'plate_hearts',
    name: 'Love',
    rarity: 'epic',
    free: false,
    lottieFile: 'plate_hearts.json',
    lottieUrl: 'nameplates/plate_hearts.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Floating hearts with sparkle trail',
    textEffect: 'glow',
    textColorSecondary: '#ec4899',
    emblem: '💖',
    barGradient: ['#831843', '#ec4899'],
    borderStyle: 'animated',
    borderColor: '#ec4899',
    category: 'fantasy',
  },
  {
    id: 'plate_void',
    name: 'Void',
    rarity: 'epic',
    free: false,
    lottieFile: 'plate_void.json',
    lottieUrl: 'nameplates/plate_void.json',
    animationType: 'lottie',
    textColor: '#c0f0ff',
    description: 'Dark dimensional rift with void energy',
    textEffect: 'glitch',
    textColorSecondary: '#7c3aed',
    emblem: '◈',
    barGradient: ['#0f0024', '#1e0040'],
    borderStyle: 'animated',
    borderColor: '#7c3aed',
    category: 'dark',
  },
  {
    id: 'plate_aurora',
    name: 'Aurora Borealis',
    rarity: 'epic',
    free: false,
    lottieFile: 'plate_aurora.json',
    lottieUrl: 'nameplates/plate_aurora.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Northern lights dancing across the bar',
    textEffect: 'rainbow',
    textColorSecondary: null,
    emblem: '✦',
    barGradient: ['#064e3b', '#7c3aed'],
    borderStyle: 'gradient',
    borderColor: '#34d399',
    category: 'cosmic',
  },
  {
    id: 'plate_thunder',
    name: 'Thunder',
    rarity: 'epic',
    free: false,
    lottieFile: 'plate_thunder.json',
    lottieUrl: 'nameplates/plate_thunder.json',
    animationType: 'lottie',
    textColor: '#fef08a',
    description: 'Crackling lightning bolts across a storm cloud',
    textEffect: 'neon',
    textColorSecondary: '#facc15',
    emblem: '⚡',
    barGradient: ['#1e1b4b', '#312e81'],
    borderStyle: 'glow',
    borderColor: '#facc15',
    category: 'elemental',
  },
  {
    id: 'plate_blood_moon',
    name: 'Blood Moon',
    rarity: 'epic',
    free: false,
    lottieFile: 'plate_blood_moon.json',
    lottieUrl: 'nameplates/plate_blood_moon.json',
    animationType: 'lottie',
    textColor: '#fca5a5',
    description: 'Crimson moon rising with dark energy',
    textEffect: 'glow',
    textColorSecondary: '#dc2626',
    emblem: '🌙',
    barGradient: ['#450a0a', '#7f1d1d'],
    borderStyle: 'animated',
    borderColor: '#dc2626',
    category: 'dark',
  },
  {
    id: 'plate_divine',
    name: 'Divine',
    rarity: 'legendary',
    free: false,
    lottieFile: 'plate_divine.json',
    lottieUrl: 'nameplates/plate_divine.json',
    animationType: 'lottie',
    textColor: '#ffd700',
    description: 'Heavenly golden radiance with divine wings',
    textEffect: 'metallic',
    textColorSecondary: '#fff7ed',
    emblem: '👑',
    barGradient: ['#854d0e', '#fbbf24'],
    borderStyle: 'animated',
    borderColor: '#ffd700',
    category: 'divine',
  },
  {
    id: 'plate_phoenix',
    name: 'Phoenix',
    rarity: 'legendary',
    free: false,
    lottieFile: 'plate_phoenix.json',
    lottieUrl: 'nameplates/plate_phoenix.json',
    animationType: 'lottie',
    textColor: '#fef3c7',
    description: 'Rising phoenix flames with ash glow',
    textEffect: 'fire',
    textColorSecondary: '#f97316',
    emblem: '🔱',
    barGradient: ['#7c2d12', '#ea580c'],
    borderStyle: 'glow',
    borderColor: '#f97316',
    category: 'mythical',
  },
  {
    id: 'plate_dragon_scale',
    name: 'Dragon Scale',
    rarity: 'legendary',
    free: false,
    lottieFile: 'plate_dragon_scale.json',
    lottieUrl: 'nameplates/plate_dragon_scale.json',
    animationType: 'lottie',
    textColor: '#fde68a',
    description: 'Shimmering dragon scales with mystic aura',
    textEffect: 'metallic',
    textColorSecondary: '#dc2626',
    emblem: '🐉',
    barGradient: ['#1c1917', '#44403c'],
    borderStyle: 'double',
    borderColor: '#fbbf24',
    category: 'mythical',
  },
  {
    id: 'plate_eternal_frost',
    name: 'Eternal Frost',
    rarity: 'legendary',
    free: false,
    lottieFile: 'plate_eternal_frost.json',
    lottieUrl: 'nameplates/plate_eternal_frost.json',
    animationType: 'lottie',
    textColor: '#e0f2fe',
    description: 'Ancient ice enchantment with crystal formations',
    textEffect: 'ice',
    textColorSecondary: '#06b6d4',
    emblem: '💎',
    barGradient: ['#083344', '#155e75'],
    borderStyle: 'animated',
    borderColor: '#06b6d4',
    category: 'elemental',
  },
  {
    id: 'plate_cosmic_sovereign',
    name: 'Cosmic Sovereign',
    rarity: 'mythic',
    free: false,
    lottieFile: 'plate_cosmic_sovereign.json',
    lottieUrl: 'nameplates/plate_cosmic_sovereign.json',
    animationType: 'lottie',
    textColor: '#ffffff',
    description: 'Reality-bending cosmic energy with dimensional rifts',
    textEffect: 'holographic',
    textColorSecondary: null,
    emblem: '⚜',
    barGradient: ['#0c0a1d', '#1e1b4b'],
    borderStyle: 'animated',
    borderColor: '#a78bfa',
    category: 'cosmic',
  },
  {
    id: 'plate_inferno_lord',
    name: 'Inferno Lord',
    rarity: 'mythic',
    free: false,
    lottieFile: 'plate_inferno_lord.json',
    lottieUrl: 'nameplates/plate_inferno_lord.json',
    animationType: 'lottie',
    textColor: '#fef3c7',
    description: 'Ultimate flame mastery with hellfire eruption',
    textEffect: 'fire',
    textColorSecondary: '#fbbf24',
    emblem: '🔱',
    barGradient: ['#450a0a', '#b91c1c'],
    borderStyle: 'animated',
    borderColor: '#ef4444',
    category: 'mythical',
  },
  {
    id: 'plate_void_emperor',
    name: 'Void Emperor',
    rarity: 'mythic',
    free: false,
    lottieFile: 'plate_void_emperor.json',
    lottieUrl: 'nameplates/plate_void_emperor.json',
    animationType: 'lottie',
    textColor: '#c4b5fd',
    description: 'Absolute void control with matter-dissolving tendrils',
    textEffect: 'glitch',
    textColorSecondary: '#a855f7',
    emblem: '◈',
    barGradient: ['#0a0015', '#1e0040'],
    borderStyle: 'animated',
    borderColor: '#a855f7',
    category: 'dark',
  },
] as const;

/**
 * Canonical registry of all nameplates.
 *
 * Every exported row is safe to render through the Lottie renderer. Text
 * colors, gradients, and emblems remain as accessible fallback metadata.
 */
export const NAMEPLATE_REGISTRY: readonly NameplateEntry[] =
  RAW_NAMEPLATE_REGISTRY.map(normalizeNameplate);

/** All available nameplate categories for filtering */
export const NAMEPLATE_CATEGORIES = [
  'all',
  'basic',
  'metallic',
  'nature',
  'cyberpunk',
  'elemental',
  'cosmic',
  'fantasy',
  'dark',
  'divine',
  'mythical',
] as const;
export type NameplateCategory = (typeof NAMEPLATE_CATEGORIES)[number];

/** Look up a nameplate by ID */
export function getNameplateById(id: string): NameplateEntry | undefined {
  return NAMEPLATE_REGISTRY.find((n) => n.id === id);
}
