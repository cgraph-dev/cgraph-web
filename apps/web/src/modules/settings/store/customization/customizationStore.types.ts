/**
 * Customization Store - Type Definitions
 *
 * All type definitions, interfaces, and constant data
 * extracted from customizationStore.ts.
 *
 */
import type { ChatBubblePresetId } from '@cgraph-dev/design-tokens';
import type {
  ChatUiMessageEntranceAnimation,
  ProfileCardLayoutId,
  ProfileThemeId,
} from '@cgraph-dev/shared-types';
import type { AvatarBorderType as SharedAvatarBorderType } from '@cgraph-dev/animation-constants';
import { COLORS as THEME_COLOR_CATALOG } from '@/stores/theme/presets';
import type { ColorDefinition } from '@/stores/theme/types';

// TYPES

export const CUSTOMIZATION_THEME_PRESETS = [
  'emerald',
  'purple',
  'cyan',
  'orange',
  'pink',
  'gold',
  'crimson',
  'arctic',
] as const satisfies readonly (keyof typeof THEME_COLOR_CATALOG)[];

export type ThemePreset = (typeof CUSTOMIZATION_THEME_PRESETS)[number];

export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type AvatarBorderType = SharedAvatarBorderType;

export type ChatBubbleStyle = ChatBubblePresetId;

export type ProfileCardStyle = ProfileCardLayoutId;

export type BubbleAnimation = ChatUiMessageEntranceAnimation;

export type ThemeColors = Pick<ColorDefinition, 'primary' | 'secondary' | 'glow' | 'name'>;

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
  readonly selectedProfileThemeId: ProfileThemeId | null;
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
  readonly profileTheme: ProfileThemeId | null; // alias for selectedProfileThemeId
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
  setProfileTheme: (themeId: ProfileThemeId | null) => void;
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

// Legacy compatibility export. Theme color metadata is owned by the theme store catalog.
export const THEME_COLORS: Record<ThemePreset, ThemeColors> = {
  emerald: THEME_COLOR_CATALOG.emerald,
  purple: THEME_COLOR_CATALOG.purple,
  cyan: THEME_COLOR_CATALOG.cyan,
  orange: THEME_COLOR_CATALOG.orange,
  pink: THEME_COLOR_CATALOG.pink,
  gold: THEME_COLOR_CATALOG.gold,
  crimson: THEME_COLOR_CATALOG.crimson,
  arctic: THEME_COLOR_CATALOG.arctic,
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
