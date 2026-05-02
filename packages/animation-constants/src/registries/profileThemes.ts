/**
 * Profile Themes — shared across web and mobile.
 *
 * Unified 11-theme set: 5 free + 5 shop + 1 custom.
 * Canonical slugs match backend @presets in CGraph.Gamification.ProfileTheme.
 *
 */
/** Unlock tier for a profile theme. */
export type ThemeUnlockTier = 'free' | 'shop';

/** A preset theme entry. `primary` and `accent` are `null` for the custom theme. */
export interface ProfileThemePreset {
  readonly id: string;
  readonly name: string;
  readonly primary: string | null;
  readonly accent: string | null;
  readonly tier: ThemeUnlockTier;
}

/** Renderer selection for profile theme background animations */
export type ProfileThemeAnimationType = 'static' | 'css' | 'lottie';

/** Resolved theme applied to the profile card (never null). */
export interface ProfileTheme {
  primary: string;
  accent: string;
}

/** Extended preset with optional Lottie background animation */
export interface ProfileThemePresetWithLottie extends ProfileThemePreset {
  /** Path to Lottie JSON file for animated background (undefined = CSS only) */
  readonly lottieUrl?: string;
  /** Renderer selection — defaults to 'css' if omitted */
  readonly animationType?: ProfileThemeAnimationType;
}
export const PROFILE_THEME_PRESETS: readonly ProfileThemePreset[] = [
  { id: 'default', name: 'Default', primary: '#1e1f22', accent: '#5865f2', tier: 'free' },
  { id: 'midnight', name: 'Midnight', primary: '#0d0d2b', accent: '#7b2fff', tier: 'free' },
  { id: 'sakura', name: 'Sakura', primary: '#2d0a1a', accent: '#e8105f', tier: 'free' },
  { id: 'forest', name: 'Forest', primary: '#0a1a0d', accent: '#228b22', tier: 'free' },
  { id: 'ocean', name: 'Ocean', primary: '#001a2e', accent: '#00bfff', tier: 'free' },

  { id: 'neon-arcade', name: 'Neon Arcade', primary: '#0a0020', accent: '#39ff14', tier: 'shop' },
  { id: 'dark-souls', name: 'Dark Souls', primary: '#0d0a06', accent: '#d4a017', tier: 'shop' },
  {
    id: 'cyberpunk-edge',
    name: 'Cyberpunk Edge',
    primary: '#0f0018',
    accent: '#ff0055',
    tier: 'shop',
  },
  {
    id: 'forest-shrine',
    name: 'Forest Shrine',
    primary: '#041208',
    accent: '#4ade80',
    tier: 'shop',
  },
  { id: 'void-crystal', name: 'Void Crystal', primary: '#05001a', accent: '#a78bfa', tier: 'shop' },

  { id: 'custom', name: 'Custom', primary: null, accent: null, tier: 'shop' },
] as const;

/** Default profile theme (resolved — never null) */
export const DEFAULT_PROFILE_THEME: ProfileTheme = {
  primary: '#1e1f22',
  accent: '#5865f2',
} as const;
