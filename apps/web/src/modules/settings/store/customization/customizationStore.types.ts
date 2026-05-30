/**
 * Customization Store - Type Definitions
 *
 * All type definitions, interfaces, and constant data
 * extracted from customizationStore.ts.
 *
 */
import type { ChatBubblePresetId } from '@cgraph-dev/design-tokens';

// TYPES

export type ThemePreset =
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'gold'
  | 'crimson'
  | 'arctic';

export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type AvatarBorderType =
  | 'none'
  | 'static'
  | 'glow'
  | 'pulse'
  | 'rotate'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'legendary'
  | 'mythic'
  | 'lottie';

export type ChatBubbleStyle = ChatBubblePresetId;

export type ProfileCardStyle =
  | 'default'
  | 'minimal'
  | 'detailed'
  | 'compact'
  | 'expanded'
  | 'gaming'
  | 'card'
  | 'full'
  | 'premium';

export type BubbleAnimation = 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

// STATE INTERFACE

export interface CustomizationState {
  // === Theme Settings ===
  readonly themePreset: ThemePreset;
  readonly effectPreset: EffectPreset;
  readonly animationSpeed: AnimationSpeed;
  readonly particlesEnabled: boolean;
  readonly glowEnabled: boolean;
  readonly blurEnabled: boolean;
  readonly animatedBackground: boolean;

  // === Avatar Settings ===
  readonly avatarBorderType: AvatarBorderType;
  readonly avatarBorderColor: ThemePreset;
  readonly avatarSize: 'small' | 'medium' | 'large';
  readonly selectedBorderTheme: string | null;
  readonly selectedBorderId: string | null;

  // === Chat Settings ===
  readonly chatBubbleStyle: ChatBubbleStyle;
  readonly chatBubbleColor: ThemePreset;
  readonly bubbleBorderRadius: number;
  readonly bubbleShadowIntensity: number;
  readonly bubbleEntranceAnimation: BubbleAnimation;
  readonly bubbleGlassEffect: boolean;
  readonly bubbleShowTail: boolean;
  readonly bubbleHoverEffect: boolean;
  readonly groupMessages: boolean;
  readonly showTimestamps: boolean;
  readonly compactMode: boolean;

  // === Profile Settings ===
  readonly profileCardStyle: ProfileCardStyle;
  readonly selectedProfileThemeId: string | null;
  readonly showBadges: boolean;
  readonly showBio: boolean;
  readonly showStatus: boolean;
  readonly glowEffects: boolean;
  readonly particleEffects: boolean;

  // === Title & Badges ===
  readonly equippedTitle: string | null;
  readonly equippedBadges: readonly string[];

  // === Display Name Style ===
  readonly displayNameFont: string;
  readonly displayNameEffect: string;
  readonly displayNameColor: string;
  readonly displayNameSecondaryColor: string | null;

  // === Nameplate ===
  readonly equippedNameplate: string | null;

  // === Profile Theme Preset ===
  readonly profileThemePresetId: string | null;
  readonly profileThemePrimary: string | null;
  readonly profileThemeAccent: string | null;

  // === Canonical Aliases (kept in sync by store actions — consumed throughout codebase) ===
  readonly chatTheme: ThemePreset; // alias for chatBubbleColor
  readonly bubbleStyle: ChatBubbleStyle; // alias for chatBubbleStyle
  readonly messageEffect: BubbleAnimation; // alias for bubbleEntranceAnimation
  readonly avatarBorder: AvatarBorderType; // alias for avatarBorderType
  readonly title: string | null; // alias for equippedTitle
  readonly profileLayout: ProfileCardStyle; // alias for profileCardStyle
  readonly profileTheme: string | null; // alias for selectedProfileThemeId
  readonly particleEffect: string | null; // particle effect type
  readonly backgroundEffect: string | null; // background effect type
  readonly reactionStyle: string; // reaction animation style
  readonly forumTheme: string | null; // forum theme identifier
  readonly appTheme: ThemePreset; // app-wide theme (alias for themePreset)

  // === Sync State ===
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly lastSyncedAt: number | null;
  readonly error: string | null;
  readonly isDirty: boolean;
}

type MutableCustomizationState = {
  -readonly [K in keyof CustomizationState]: CustomizationState[K];
};

export type CustomizationServerPatch = Partial<MutableCustomizationState>;

// ACTIONS INTERFACE

export interface CustomizationActions {
  // Batch update
  updateSettings: (updates: Partial<CustomizationState>) => void;
  applyServerSettings: (updates: CustomizationServerPatch | Record<string, unknown>) => void;

  // Theme actions
  setTheme: (preset: ThemePreset) => void;
  setEffect: (preset: EffectPreset) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleBlur: () => void;
  toggleAnimatedBackground: () => void;

  // Avatar actions
  setAvatarBorder: (type: AvatarBorderType) => void;
  setAvatarBorderColor: (color: ThemePreset) => void;
  setAvatarSize: (size: 'small' | 'medium' | 'large') => void;
  selectBorderTheme: (theme: string | null) => void;
  selectBorderId: (id: string | null) => void;

  // Chat actions
  setChatBubbleStyle: (style: ChatBubbleStyle) => void;
  setChatBubbleColor: (color: ThemePreset) => void;
  setBubbleBorderRadius: (radius: number) => void;
  setBubbleShadowIntensity: (intensity: number) => void;
  setBubbleAnimation: (animation: BubbleAnimation) => void;
  toggleBubbleGlass: () => void;
  toggleBubbleTail: () => void;
  toggleBubbleHover: () => void;
  toggleGroupMessages: () => void;
  toggleTimestamps: () => void;
  toggleCompactMode: () => void;

  // Profile actions
  setProfileCardStyle: (style: ProfileCardStyle) => void;
  setProfileTheme: (themeId: string | null) => void;
  toggleBadges: () => void;
  toggleBio: () => void;
  toggleStatus: () => void;
  toggleGlowEffects: () => void;
  toggleParticleEffects: () => void;
  setEquippedTitle: (titleId: string | null) => void;
  setEquippedBadges: (badgeIds: string[]) => void;

  // Display name style actions
  setDisplayNameFont: (font: string) => void;
  setDisplayNameEffect: (effect: string) => void;
  setDisplayNameColor: (color: string) => void;
  setDisplayNameSecondaryColor: (color: string | null) => void;

  // Nameplate actions
  setEquippedNameplate: (nameplateId: string | null) => void;

  // Profile theme preset actions
  setProfileThemePreset: (
    presetId: string | null,
    primary: string | null,
    accent: string | null
  ) => void;

  // Legacy batch update methods
  updateChatStyle: (key: string, value: unknown) => void;
  updateEffects: (key: string, value: unknown) => void;
  updateIdentity: (key: string, value: unknown) => void;
  updateTheme: (key: string, value: unknown) => void;

  // Sync actions
  fetchCustomizations: (userId?: string) => Promise<void>;
  saveCustomizations: (userId?: string) => Promise<void>;
  resetToDefaults: () => void;
  clearError: () => void;
}

export type CustomizationStore = CustomizationState & CustomizationActions;

// THEME COLORS

export const THEME_COLORS: Record<ThemePreset, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    name: 'Cyan',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
    name: 'Pink',
  },
  gold: {
    primary: '#eab308',
    secondary: '#facc15',
    glow: 'rgba(234, 179, 8, 0.5)',
    name: 'Gold',
  },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
  },
};

// AVATAR BORDER DEFINITIONS

export const AVATAR_BORDERS: Record<
  AvatarBorderType,
  { name: string; description: string; premium: boolean; rarity?: string }
> = {
  none: { name: 'None', description: 'No border', premium: false },
  static: { name: 'Static', description: 'Simple colored border', premium: false },
  glow: { name: 'Glow', description: 'Soft glowing effect', premium: false },
  pulse: { name: 'Pulse', description: 'Rhythmic pulsing glow', premium: false },
  rotate: { name: 'Orbit', description: 'Rotating gradient ring', premium: true, rarity: 'Rare' },
  fire: { name: 'Inferno', description: 'Animated flame effect', premium: true, rarity: 'Epic' },
  ice: { name: 'Frost', description: 'Crystalline ice particles', premium: true, rarity: 'Epic' },
  electric: {
    name: 'Storm',
    description: 'Electric sparks and arcs',
    premium: true,
    rarity: 'Epic',
  },
  legendary: {
    name: 'Legendary',
    description: 'Multi-layered animated aura',
    premium: true,
    rarity: 'Legendary',
  },
  mythic: {
    name: 'Mythic',
    description: 'Reality-bending void effect',
    premium: true,
    rarity: 'Mythic',
  },
  lottie: {
    name: 'Animated Frame',
    description: 'Custom Lottie animated border frame',
    premium: true,
    rarity: 'Legendary',
  },
};

export const RARITY_COLORS: Record<string, string> = {
  Free: '#6b7280',
  Common: '#9ca3af',
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};

// DEFAULT STATE

export const DEFAULT_STATE: CustomizationState = {
  // Theme
  themePreset: 'purple',
  effectPreset: 'aurora',
  animationSpeed: 'normal',
  particlesEnabled: true,
  glowEnabled: true,
  blurEnabled: true,
  animatedBackground: false,

  // Avatar
  avatarBorderType: 'glow',
  avatarBorderColor: 'purple',
  avatarSize: 'medium',
  selectedBorderTheme: null,
  selectedBorderId: null,

  // Chat
  chatBubbleStyle: 'default',
  chatBubbleColor: 'purple',
  bubbleBorderRadius: 16,
  bubbleShadowIntensity: 30,
  bubbleEntranceAnimation: 'fade',
  bubbleGlassEffect: true,
  bubbleShowTail: true,
  bubbleHoverEffect: true,
  groupMessages: true,
  showTimestamps: true,
  compactMode: false,

  // Profile
  profileCardStyle: 'default',
  selectedProfileThemeId: null,
  showBadges: true,
  showBio: true,
  showStatus: true,
  glowEffects: true,
  particleEffects: false,

  // Identity
  equippedTitle: null,
  equippedBadges: [],

  // Display Name Style
  displayNameFont: 'default',
  displayNameEffect: 'solid',
  displayNameColor: '#ffffff',
  displayNameSecondaryColor: null,

  // Nameplate
  equippedNameplate: null,

  // Profile Theme Preset
  profileThemePresetId: null,
  profileThemePrimary: null,
  profileThemeAccent: null,

  // Canonical Aliases (computed at runtime, kept in sync by store actions)
  chatTheme: 'purple',
  bubbleStyle: 'default',
  messageEffect: 'fade',
  avatarBorder: 'glow',
  title: null,
  profileLayout: 'default',
  profileTheme: null,
  particleEffect: null,
  backgroundEffect: null,
  reactionStyle: 'default',
  forumTheme: null,
  appTheme: 'purple',

  // Sync
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
  isDirty: false,
};
