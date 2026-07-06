import {
  DEFAULT_PROFILE_CARD_LAYOUT_ID,
  getProfileCardLayoutOrDefault,
  isProfileCardLayoutId,
} from '@cgraph-dev/shared-types';
import type { ProfileCardLayoutId } from '@cgraph-dev/shared-types';
import {
  chatBubblePresets,
  colorPresets,
  type ChatBubblePreset,
} from '@cgraph-dev/design-tokens';
import { classifyByRules } from '@/lib/store-helpers';
import type {
  ColorPreset,
  ColorDefinition,
  ProfileCardConfig,
  ThemePresetConfig,
  ChatBubbleConfig,
} from './types';

const COLOR_GRADIENTS = {
  emerald: 'from-emerald-500 to-emerald-600',
  purple: 'from-purple-500 to-purple-600',
  cyan: 'from-cyan-500 to-cyan-600',
  orange: 'from-orange-500 to-orange-600',
  pink: 'from-pink-500 to-pink-600',
  gold: 'from-yellow-500 to-yellow-600',
  crimson: 'from-red-500 to-red-600',
  arctic: 'from-sky-400 to-sky-500',
  sunset: 'from-amber-500 to-orange-500',
  midnight: 'from-purple-900 to-purple-800',
  forest: 'from-emerald-600 to-emerald-500',
  ocean: 'from-sky-600 to-sky-500',
} as const satisfies Record<ColorPreset, string>;

function glowFromHex(hexColor: string): string {
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, 0.5)`;
}

function colorDefinitionForPreset(preset: ColorPreset): ColorDefinition {
  const color = colorPresets[preset];

  return {
    primary: color.primary,
    secondary: color.secondary,
    glow: glowFromHex(color.primary),
    name: color.name,
    gradient: COLOR_GRADIENTS[preset],
  };
}

export const COLORS = {
  emerald: colorDefinitionForPreset('emerald'),
  purple: colorDefinitionForPreset('purple'),
  cyan: colorDefinitionForPreset('cyan'),
  orange: colorDefinitionForPreset('orange'),
  pink: colorDefinitionForPreset('pink'),
  gold: colorDefinitionForPreset('gold'),
  crimson: colorDefinitionForPreset('crimson'),
  arctic: colorDefinitionForPreset('arctic'),
  sunset: colorDefinitionForPreset('sunset'),
  midnight: colorDefinitionForPreset('midnight'),
  forest: colorDefinitionForPreset('forest'),
  ocean: colorDefinitionForPreset('ocean'),
} satisfies Record<ColorPreset, ColorDefinition>;

type ProfileCardAdapterConfig = Omit<ProfileCardConfig, 'layout' | 'showBadges' | 'showBio'>;

const BASE_CARD_CONFIG: ProfileCardAdapterConfig = {
  showLevel: true,
  showXp: true,
  maxBadges: 5,
  showTitle: true,
  showStats: true,
  showRecentActivity: true,
  showMutualFriends: true,
  showForumsInCommon: true,
  showAchievements: true,
  showSocialLinks: true,
};

const PROFILE_CARD_CONFIG_OVERRIDES = {
  default: {},
  minimal: {
    showLevel: false,
    showXp: false,
    maxBadges: 0,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  card: {
    showRecentActivity: false,
  },
  full: {
    maxBadges: 8,
  },
  compact: {
    showXp: false,
    maxBadges: 3,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  premium: {
    maxBadges: 8,
    showRecentActivity: true,
    showMutualFriends: true,
    showForumsInCommon: true,
  },
} satisfies Record<ProfileCardLayoutId, Partial<ProfileCardAdapterConfig>>;

function createProfileCardConfig(layoutId: ProfileCardLayoutId): ProfileCardConfig {
  const layout = getProfileCardLayoutOrDefault(layoutId);
  const overrides = PROFILE_CARD_CONFIG_OVERRIDES[layout.id];

  return {
    layout: layout.id,
    showBadges: layout.showBadges,
    showBio: layout.showBio,
    ...BASE_CARD_CONFIG,
    ...overrides,
  };
}

export const PROFILE_CARD_CONFIGS = {
  default: createProfileCardConfig('default'),
  minimal: createProfileCardConfig('minimal'),
  card: createProfileCardConfig('card'),
  full: createProfileCardConfig('full'),
  compact: createProfileCardConfig('compact'),
  premium: createProfileCardConfig('premium'),
} satisfies Record<ProfileCardLayoutId, ProfileCardConfig>;

export const THEME_PRESETS: Record<string, ThemePresetConfig> = {
  'minimalist-dark': {
    name: 'Minimalist Dark',
    colors: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      accent: '#3b82f6',
      background: '#0a0a0a',
      surface: '#171717',
      text: '#ffffff',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#0a0a0a' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
  },
  'minimalist-light': {
    name: 'Minimalist Light',
    colors: {
      primary: '#000000',
      secondary: '#525252',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#171717',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#ffffff' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
  },
  'cyberpunk-neon': {
    name: 'Cyberpunk Neon',
    colors: {
      primary: '#00f0ff',
      secondary: '#ff00ff',
      accent: '#fcee0a',
      background: '#0a0a0f',
      surface: '#15151f',
      text: '#ffffff',
      textMuted: '#666680',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a0a0f, #15151f, #0a0a0f)',
      overlay: true,
      overlayOpacity: 0.1,
    },
    cardLayout: 'premium',
    hoverEffect: 'glow',
    fontFamily: '"Rajdhani", sans-serif',
    glassmorphism: true,
    borderRadius: 'none',
    showParticles: true,
    particleType: 'glitch',
  },
  'gradient-aurora': {
    name: 'Gradient Aurora',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#a855f7',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: {
      type: 'animated',
      value: 'aurora',
      overlay: true,
      overlayOpacity: 0.3,
    },
    cardLayout: 'full',
    hoverEffect: 'glow',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'stars',
  },
  'gaming-rgb': {
    name: 'Gaming RGB',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: { type: 'animated', value: 'rgb-gradient' },
    cardLayout: 'premium',
    hoverEffect: 'glow',
    fontFamily: '"Orbitron", sans-serif',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'spark',
  },
};

const CATEGORY_RULES = [
  { test: (k: string) => k.includes('dark'), category: 'Dark' },
  { test: (k: string) => k.includes('light'), category: 'Light' },
  { test: (k: string) => k.includes('cyberpunk') || k.includes('neon'), category: 'Futuristic' },
  { test: (k: string) => k.includes('matrix') || k.includes('hacker'), category: 'Tech' },
  { test: (k: string) => k.includes('synthwave') || k.includes('retro'), category: 'Retro' },
  { test: (k: string) => k.includes('gaming'), category: 'Gaming' },
  { test: (k: string) => k.includes('nature') || k.includes('forest'), category: 'Nature' },
];

/** Get Preset Category. */
export function getPresetCategory(presetId: string): string {
  return classifyByRules(presetId, CATEGORY_RULES, 'General');
}

export const DEFAULT_CHAT_BUBBLE: ChatBubbleConfig = {
  ownMessageBg: '#059669',
  otherMessageBg: '#374151',
  ownMessageText: '#ffffff',
  otherMessageText: '#ffffff',
  useGradient: true,
  gradientDirection: 'diagonal',
  borderRadius: 16,
  bubbleShape: 'rounded',
  showTail: true,
  borderStyle: 'none',
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 20,
  borderWidth: 0,
  entranceAnimation: 'slide',
  hoverEffect: true,
  maxWidth: 70,
  spacing: 4,
  showTimestamp: true,
  timestampPosition: 'inside',
  showAvatar: true,
  avatarSize: 'md',
  alignSent: 'right',
  alignReceived: 'left',
  groupMessages: true,
};

function toLegacyBubbleShape(
  preset: ChatBubblePreset
): ChatBubbleConfig['bubbleShape'] {
  if (preset.shape === 'sharp' || preset.shape === 'minimal') return 'sharp';
  if (preset.shape === 'dimensional') return 'modern';
  if (
    preset.id === 'modern' ||
    preset.shape === 'pill' ||
    preset.shape === 'organic' ||
    preset.shape === 'glass' ||
    preset.shape === 'outlined'
  ) {
    return 'super-rounded';
  }
  return 'rounded';
}

function toLegacyEntranceAnimation(
  preset: ChatBubblePreset
): ChatBubbleConfig['entranceAnimation'] {
  if (preset.id === 'minimal' || preset.id === 'glass' || preset.id === 'outline') return 'fade';
  if (preset.id === 'modern' || preset.id === 'three-d') return 'scale';
  if (preset.id === 'cloud') return 'bounce';
  return 'slide';
}

function toLegacyChatBubblePreset(preset: ChatBubblePreset): Partial<ChatBubbleConfig> {
  if (preset.id === 'default') return {};

  return {
    ownMessageBg: preset.ownColor,
    otherMessageBg: preset.otherColor,
    ownMessageText: preset.ownTextColor,
    otherMessageText: preset.otherTextColor,
    useGradient: preset.hasGradient,
    gradientDirection: preset.hasGradient ? 'diagonal' : undefined,
    borderRadius: preset.borderRadius,
    bubbleShape: toLegacyBubbleShape(preset),
    showTail: preset.hasTail,
    borderStyle: preset.shape === 'outlined' ? 'solid' : 'none',
    glassEffect: preset.glassBlur > 0 || preset.shape === 'glass',
    glassBlur: preset.glassBlur,
    shadowIntensity: preset.shadowIntensity,
    borderWidth: preset.shape === 'outlined' ? 1 : 0,
    entranceAnimation: toLegacyEntranceAnimation(preset),
    hoverEffect: preset.shadowIntensity > 0,
  };
}

export const CHAT_BUBBLE_PRESETS: Record<string, Partial<ChatBubbleConfig>> = Object.fromEntries(
  chatBubblePresets.map((preset) => [preset.id, toLegacyChatBubblePreset(preset)])
);

export { type ThemeState } from './types';

export const DEFAULT_THEME_STATE = {
  colorPreset: 'purple' as const,
  profileThemeId: 'minimalist-dark',
  profileCardLayout: DEFAULT_PROFILE_CARD_LAYOUT_ID,
  chatBubble: DEFAULT_CHAT_BUBBLE,
  chatBubbleStyle: 'default' as const,
  chatBubbleColor: 'purple' as const,
  avatarBorder: 'glow' as const,
  avatarBorderColor: 'purple' as const,
  activeForumThemeId: null,
  effectPreset: 'aurora' as const,
  animationSpeed: 'normal' as const,
  particlesEnabled: true,
  glowEnabled: true,
  animatedBackground: false,
  isPremium: false,
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
};

/** Get Colors For Preset. */
export function getColorsForPreset(preset: ColorPreset): ColorDefinition {
  return COLORS[preset];
}

/** Get Profile Card Config For Layout. */
export function getProfileCardConfigForLayout(
  layout: string | null | undefined
): ProfileCardConfig {
  const profileCardLayout = isProfileCardLayoutId(layout) ? layout : DEFAULT_PROFILE_CARD_LAYOUT_ID;
  return PROFILE_CARD_CONFIGS[profileCardLayout] ?? PROFILE_CARD_CONFIGS[DEFAULT_PROFILE_CARD_LAYOUT_ID]!;
}

/** Get Theme Preset. */
export function getThemePreset(themeId: string): ThemePresetConfig | undefined {
  return THEME_PRESETS[themeId];
}
