/**
 * Theme Store - Action Implementations
 *
 * Contains all action logic for the unified theme store:
 * - Color / profile / chat-bubble actions
 * - Effects toggles
 * - Backend sync (save & load)
 * - Legacy backward-compatibility helpers
 * - Export / Import
 *
 */

import type { StateCreator } from 'zustand';
import { DEFAULT_PROFILE_CARD_LAYOUT_ID, isProfileCardLayoutId } from '@cgraph-dev/shared-types';
import type { ProfileCardLayoutId } from '@cgraph-dev/shared-types';
import { normalizeChatBubbleStyleId } from '@cgraph-dev/design-tokens';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { isAvatarBorderDisplayType } from '@/data/avatar-borders';

import type {
  AnimationSpeed,
  ColorPreset,
  LegacyTheme,
  ThemeStore,
  ChatBubbleStylePreset,
  EffectPreset,
} from './types';
import {
  COLORS,
  THEME_PRESETS,
  CHAT_BUBBLE_PRESETS,
  DEFAULT_CHAT_BUBBLE,
  DEFAULT_THEME_STATE,
  getProfileCardConfigForLayout,
} from './presets';

const logger = createLogger('ThemeStore');

const ANIMATION_SPEEDS: Readonly<Record<AnimationSpeed, true>> = {
  slow: true,
  normal: true,
  fast: true,
};
const EFFECT_PRESETS: Readonly<Record<EffectPreset, true>> = {
  glassmorphism: true,
  neon: true,
  holographic: true,
  minimal: true,
  aurora: true,
  cyberpunk: true,
};
function getStringField(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

function getBooleanField(record: Record<string, unknown>, keys: readonly string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return null;
}

function getNumberField(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function hasKnownKey<T extends string>(
  record: Readonly<Record<T, unknown>>,
  value: string | null
): value is T {
  return Boolean(value && Object.prototype.hasOwnProperty.call(record, value));
}

function isColorPreset(value: string | null): value is ColorPreset {
  return hasKnownKey(COLORS, value);
}

function isEffectPreset(value: string | null): value is EffectPreset {
  return hasKnownKey(EFFECT_PRESETS, value);
}

function isAnimationSpeed(value: string | null): value is AnimationSpeed {
  return hasKnownKey(ANIMATION_SPEEDS, value);
}

function normalizeProfileCardLayout(value: string | null): ProfileCardLayoutId {
  return isProfileCardLayoutId(value) ? value : DEFAULT_PROFILE_CARD_LAYOUT_ID;
}

function normalizeServerTheme(
  rawTheme: Record<string, unknown>,
  state: ThemeStore
): Partial<ThemeStore> {
  const next: Partial<ThemeStore> = {};

  const colorPreset = getStringField(rawTheme, ['colorPreset', 'color_preset']);
  if (isColorPreset(colorPreset)) next.colorPreset = colorPreset;

  const profileThemeId = getStringField(rawTheme, [
    'profileThemeId',
    'profile_theme_id',
    'profileTheme',
    'profile_theme',
    'accent',
  ]);
  if (profileThemeId) next.profileThemeId = profileThemeId;

  const profileCardLayout = getStringField(rawTheme, ['profileCardLayout', 'profile_card_layout']);
  if (profileCardLayout) next.profileCardLayout = normalizeProfileCardLayout(profileCardLayout);

  const avatarBorder = getStringField(rawTheme, ['avatarBorder', 'avatar_border']);
  if (isAvatarBorderDisplayType(avatarBorder)) next.avatarBorder = avatarBorder;

  const avatarBorderColor = getStringField(rawTheme, ['avatarBorderColor', 'avatar_border_color']);
  if (isColorPreset(avatarBorderColor)) next.avatarBorderColor = avatarBorderColor;

  const chatBubbleStyle = getStringField(rawTheme, [
    'chatBubbleStyle',
    'chat_bubble_style',
    'bubbleStyle',
    'bubble_style',
  ]);
  if (chatBubbleStyle !== null) next.chatBubbleStyle = normalizeChatBubbleStyleId(chatBubbleStyle);

  const chatBubbleColor = getStringField(rawTheme, [
    'chatBubbleColor',
    'chat_bubble_color',
    'bubbleColor',
    'bubble_color',
  ]);
  if (isColorPreset(chatBubbleColor)) next.chatBubbleColor = chatBubbleColor;

  const effectPreset = getStringField(rawTheme, [
    'effectPreset',
    'effect_preset',
    'visualEffect',
    'visual_effect',
  ]);
  if (isEffectPreset(effectPreset)) next.effectPreset = effectPreset;

  const animationSpeed = getStringField(rawTheme, ['animationSpeed', 'animation_speed']);
  if (isAnimationSpeed(animationSpeed)) next.animationSpeed = animationSpeed;

  const particlesEnabled = getBooleanField(rawTheme, ['particlesEnabled', 'particles_enabled']);
  if (particlesEnabled !== null) next.particlesEnabled = particlesEnabled;

  const glowEnabled = getBooleanField(rawTheme, ['glowEnabled', 'glow_enabled']);
  if (glowEnabled !== null) next.glowEnabled = glowEnabled;

  const animatedBackground = getBooleanField(rawTheme, [
    'animatedBackground',
    'animated_background',
  ]);
  if (animatedBackground !== null) next.animatedBackground = animatedBackground;

  const isPremium = getBooleanField(rawTheme, ['isPremium', 'is_premium']);
  if (isPremium !== null) next.isPremium = isPremium;

  const chatBubbleRadius = getNumberField(rawTheme, [
    'chatBubbleRadius',
    'chat_bubble_radius',
    'bubbleBorderRadius',
    'bubble_border_radius',
    'bubble_radius',
  ]);
  const chatBubbleTail = getBooleanField(rawTheme, [
    'chatBubbleTail',
    'chat_bubble_tail',
    'bubbleShowTail',
    'bubble_show_tail',
  ]);
  const entranceAnimation = getStringField(rawTheme, [
    'entranceAnimation',
    'entrance_animation',
    'bubbleEntranceAnimation',
    'bubble_entrance_animation',
  ]);

  if (chatBubbleRadius !== null || chatBubbleTail !== null || entranceAnimation) {
    next.chatBubble = {
      ...state.chatBubble,
      borderRadius: chatBubbleRadius ?? state.chatBubble.borderRadius,
      showTail: chatBubbleTail ?? state.chatBubble.showTail,
      entranceAnimation:
        entranceAnimation === 'none' ||
        entranceAnimation === 'slide' ||
        entranceAnimation === 'fade' ||
        entranceAnimation === 'scale' ||
        entranceAnimation === 'bounce' ||
        entranceAnimation === 'flip'
          ? entranceAnimation
          : state.chatBubble.entranceAnimation,
    };
  }

  return next;
}

function serializeThemeForApi(state: ThemeStore): Record<string, unknown> {
  return {
    colorPreset: state.colorPreset,
    avatarBorder: state.avatarBorder,
    avatarBorderColor: state.avatarBorderColor,
    chatBubbleStyle: state.chatBubbleStyle,
    chatBubbleRadius: state.chatBubble.borderRadius,
    chatBubbleShadow: state.chatBubble.shadowIntensity > 0,
    chatBubbleTail: state.chatBubble.showTail,
    entranceAnimation: state.chatBubble.entranceAnimation,
    visualEffect: state.effectPreset,
    animationSpeed: state.animationSpeed,
    glowEnabled: state.glowEnabled,
    particlesEnabled: state.particlesEnabled,
    isPremium: state.isPremium,
    profileThemeId: state.profileThemeId,
    profileCardLayout: state.profileCardLayout,
  };
}

// ACTION CREATOR

/**
 * Returns all store actions.
 *
 * Designed to be spread inside the Zustand `create()` callback so the store
 * file stays small.
 */
export const createThemeActions: StateCreator<ThemeStore, [], [], ThemeStore> = (set, get) => ({
  ...DEFAULT_THEME_STATE,

  // === Color Theme ===
  setColorPreset: (preset) => set({ colorPreset: preset }),
  getColors: () => COLORS[get().colorPreset],

  // === Profile Theme ===
  setProfileTheme: (themeId) => set({ profileThemeId: themeId }),
  setProfileCardLayout: (layout) => set({ profileCardLayout: layout }),
  getProfileCardConfig: () => {
    return getProfileCardConfigForLayout(get().profileCardLayout);
  },

  // === Chat Bubble ===
  updateChatBubble: (updates) =>
    set((state) => ({
      chatBubble: { ...state.chatBubble, ...updates },
    })),
  applyChatBubblePreset: (preset) => {
    const presetConfig = CHAT_BUBBLE_PRESETS[preset];
    if (presetConfig) {
      set({
        chatBubble: { ...DEFAULT_CHAT_BUBBLE, ...presetConfig },
      });
    }
  },
  resetChatBubble: () => set({ chatBubble: DEFAULT_CHAT_BUBBLE }),

  // === Effects ===
  setEffectPreset: (preset) => set({ effectPreset: preset }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  toggleParticles: () => set((s) => ({ particlesEnabled: !s.particlesEnabled })),
  toggleGlow: () => set((s) => ({ glowEnabled: !s.glowEnabled })),
  toggleBlur: () =>
    set((s) => ({
      chatBubble: { ...s.chatBubble, glassEffect: !s.chatBubble.glassEffect },
    })),
  toggleAnimatedBackground: () => set((s) => ({ animatedBackground: !s.animatedBackground })),

  // === Sync ===
  syncWithBackend: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get('/api/v1/me/theme');
      const data = response.data?.data;
      const theme = data?.theme && typeof data.theme === 'object' ? data.theme : data;

      if (theme && typeof theme === 'object' && !Array.isArray(theme)) {
        get().applyServerTheme({ ...theme });
        set({ isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      // Silently handle 404 — endpoint may not be deployed yet

      const resp = error instanceof Object && 'response' in error ? error.response : undefined;
      const status =
        resp instanceof Object && 'status' in resp && typeof resp.status === 'number'
          ? resp.status
          : undefined;
      if (status !== 404) {
        logger.warn('Failed to sync theme:', error);
      }
      set({ isLoading: false });
    }
  },

  saveToBackend: async () => {
    const state = get();
    set({ isSaving: true, error: null });
    try {
      await http.put('/api/v1/me/theme', { theme: serializeThemeForApi(state) });
      set({ isSaving: false, lastSyncedAt: Date.now() });
    } catch (error) {
      logger.warn('Failed to save theme:', error);
      set({ isSaving: false });
    }
  },

  applyServerTheme: (theme) => {
    const updates = normalizeServerTheme(theme, get());
    set({ ...updates, lastSyncedAt: Date.now(), error: null });
  },

  clearError: () => set({ error: null }),

  // === Legacy backward compatibility ===
  syncWithServer: async (_userId?: string) => {
    return get().syncWithBackend();
  },
  get theme(): LegacyTheme {
    const state = get();
    return {
      colorPreset: state.colorPreset,
      avatarBorder: state.avatarBorder,
      avatarBorderColor: state.avatarBorderColor,
      avatarSize: state.chatBubble.avatarSize,
      chatBubbleStyle: state.chatBubbleStyle,
      chatBubbleColor: state.chatBubbleColor,
      bubbleBorderRadius: state.chatBubble.borderRadius,
      bubbleShadowIntensity: state.chatBubble.shadowIntensity,
      bubbleGlassEffect: state.chatBubble.glassEffect,
      bubbleShowTail: state.chatBubble.showTail,
      bubbleHoverEffect: state.chatBubble.hoverEffect,
      bubbleEntranceAnimation: state.chatBubble.entranceAnimation,
      glowEnabled: state.glowEnabled,
      blurEnabled: state.chatBubble.glassEffect,
      particlesEnabled: state.particlesEnabled,
      animatedBackground: state.animatedBackground,
      effectPreset: state.effectPreset,
      effect: state.effectPreset,
      animationSpeed: state.animationSpeed,
      isPremium: state.isPremium,
    };
  },
  updateTheme: (updates: Partial<LegacyTheme>) => {
    set((state) => ({
      colorPreset: updates.colorPreset ?? state.colorPreset,
      avatarBorder: updates.avatarBorder ?? state.avatarBorder,
      avatarBorderColor: updates.avatarBorderColor ?? state.avatarBorderColor,
      chatBubbleStyle: updates.chatBubbleStyle ?? state.chatBubbleStyle,
      chatBubbleColor: updates.chatBubbleColor ?? state.chatBubbleColor,
      glowEnabled: updates.glowEnabled ?? state.glowEnabled,
      particlesEnabled: updates.particlesEnabled ?? state.particlesEnabled,
      effectPreset: updates.effectPreset ?? updates.effect ?? state.effectPreset,
      animationSpeed: updates.animationSpeed ?? state.animationSpeed,
      animatedBackground: updates.animatedBackground ?? state.animatedBackground,
      chatBubble: {
        ...state.chatBubble,
        borderRadius: updates.bubbleBorderRadius ?? state.chatBubble.borderRadius,
        shadowIntensity: updates.bubbleShadowIntensity ?? state.chatBubble.shadowIntensity,
        glassEffect:
          updates.bubbleGlassEffect ?? updates.blurEnabled ?? state.chatBubble.glassEffect,
        showTail: updates.bubbleShowTail ?? state.chatBubble.showTail,
        hoverEffect: updates.bubbleHoverEffect ?? state.chatBubble.hoverEffect,
        entranceAnimation: updates.bubbleEntranceAnimation ?? state.chatBubble.entranceAnimation,
        avatarSize: updates.avatarSize ?? state.chatBubble.avatarSize,
      },
    }));
  },
  setAvatarBorder: (border) => set({ avatarBorder: border }),
  setChatBubbleStyle: (style: ChatBubbleStylePreset) => set({ chatBubbleStyle: style }),
  setEffect: (effect: EffectPreset) => set({ effectPreset: effect }),
  resetTheme: () => set({ ...DEFAULT_THEME_STATE }),
  /** Reset store to initial state (standard naming convention) */
  reset: () => set({ ...DEFAULT_THEME_STATE }),
  applyPreset: (preset: string) => {
    const themePreset = THEME_PRESETS[preset];
    if (themePreset) {
      set({ profileThemeId: preset, profileCardLayout: themePreset.cardLayout });
    }
  },

  // === Export/Import ===
  exportTheme: () => {
    const state = get();
    return JSON.stringify(
      {
        colorPreset: state.colorPreset,
        profileThemeId: state.profileThemeId,
        profileCardLayout: state.profileCardLayout,
        chatBubble: state.chatBubble,
        effectPreset: state.effectPreset,
        animationSpeed: state.animationSpeed,
        particlesEnabled: state.particlesEnabled,
        glowEnabled: state.glowEnabled,
        animatedBackground: state.animatedBackground,
      },
      null,
      2
    );
  },

  importTheme: (json) => {
    try {
      const imported = JSON.parse(json);
      set({
        ...DEFAULT_THEME_STATE,
        ...imported,
        chatBubble: { ...DEFAULT_CHAT_BUBBLE, ...imported.chatBubble },
      });
      return true;
    } catch (error) {
      logger.error('Failed to import theme:', error);
      return false;
    }
  },
});
