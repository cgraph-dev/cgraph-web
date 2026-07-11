/**
 * Customization Store - API Schema Mapping & Persistence
 *
 * Contains the API schema mapper (camelCase <-> snake_case),
 * debounced save logic, and persistence configuration.
 *
 */

import { http } from '@/lib/api-client';
import { notifyCustomizationChanged } from '@/lib/socket/customization-events';
import { createSchemaMapper, createDebouncedSave } from '@/lib/store-helpers';
import { getBorderById } from '@/data/avatar-borders';
import { getBadgeById } from '@/data/badgesCollection';
import { DEFAULT_PROFILE_THEME, getThemeById } from '@/data/profileThemes';
import { getTitleById } from '@/data/titlesCollection';
import { useAuthStore } from '@/modules/auth/store';
import { getNameplateById } from '@cgraph-dev/animation-constants';

import type { CustomizationState, CustomizationStore } from './customizationStore.types';
import type { User } from '@/modules/auth/store/authStore.types';

// Re-export CustomizationState for use by the schema mapper
export type { CustomizationState };

// API SCHEMA MAPPING

export const apiSchemaMapper = createSchemaMapper<CustomizationState>({
  // Theme
  themePreset: 'app_theme',
  effectPreset: 'background_effect',
  animationSpeed: 'animation_speed',
  particlesEnabled: 'particles_enabled',
  glowEnabled: 'glow_enabled',
  blurEnabled: 'blur_enabled',
  animatedBackground: 'animated_background',

  // Avatar
  avatarBorderColor: 'avatar_border_color',
  avatarSize: 'avatar_size',
  selectedBorderTheme: 'selected_border_theme',
  selectedBorderId: 'avatar_border_id',

  // Chat
  chatBubbleStyle: 'bubble_style',
  chatBubbleColor: 'bubble_color',
  bubbleBorderRadius: 'bubble_radius',
  bubbleShadowIntensity: 'bubble_shadow_intensity',
  bubbleEntranceAnimation: 'message_effect',
  bubbleGlassEffect: 'bubble_glass_effect',
  bubbleShowTail: 'bubble_show_tail',
  bubbleHoverEffect: 'bubble_hover_effect',
  groupMessages: 'group_messages',
  showTimestamps: 'show_timestamps',
  compactMode: 'compact_mode',
  chatThemeSettings: 'chat_theme_settings',
  defaultConversationColor: 'default_conversation_color',
  customChatColors: 'custom_chat_colors',
  conversationChatThemeOverrides: 'conversation_chat_theme_overrides',

  // Profile
  profileCardStyle: 'profile_layout',
  selectedProfileThemeId: 'profile_theme',
  showBadges: 'show_badges',
  showBio: 'show_bio',
  showStatus: 'show_status',
  glowEffects: 'glow_effects',
  particleEffects: 'particle_effects',

  // Identity
  equippedTitle: 'title_id',
  equippedBadges: 'equipped_badges',

  // Display Name Style
  displayNameFont: 'display_name_font',
  displayNameEffect: 'display_name_effect',
  displayNameColor: 'display_name_color',
  displayNameSecondaryColor: 'display_name_secondary_color',

  // Nameplate
  equippedNameplate: 'equipped_nameplate',

  // Profile Theme Preset
  profileThemePresetId: 'profile_theme_preset_id',
  profileThemePrimary: 'profile_theme_primary',
  profileThemeAccent: 'profile_theme_accent',
});

type CustomizationApiPayload = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compactRecord(entries: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined)
  );
}

function chatThemeWallpaperToApi(value: unknown): unknown {
  if (!isRecord(value)) return value;

  return compactRecord({
    intensity: value.intensity,
    background_color: value.backgroundColor ?? value.background_color,
    second_background_color: value.secondBackgroundColor ?? value.second_background_color,
    third_background_color: value.thirdBackgroundColor ?? value.third_background_color,
    fourth_background_color: value.fourthBackgroundColor ?? value.fourth_background_color,
    dark: value.dark,
  });
}

function chatThemeSettingsToApi(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const wallpaper = value.wallpaper;

  return compactRecord({
    base: value.base,
    preset_id: value.presetId ?? value.preset_id ?? null,
    accent_color: value.accentColor ?? value.accent_color,
    message_colors: value.messageColors ?? value.message_colors,
    ...(wallpaper === undefined ? {} : { wallpaper: chatThemeWallpaperToApi(wallpaper) }),
  });
}

function defaultConversationColorToApi(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const customColorData = value.customColorData ?? value.custom_color_data;

  return compactRecord({
    color: value.color,
    ...(customColorData === undefined ? {} : { custom_color_data: customColorData }),
  });
}

function conversationChatThemeOverrideToApi(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const wallpaper = value.wallpaper;

  return compactRecord({
    conversation_color: value.conversationColor ?? value.conversation_color,
    custom_color: value.customColor ?? value.custom_color,
    custom_color_id: value.customColorId ?? value.custom_color_id,
    ...(wallpaper === undefined ? {} : { wallpaper: chatThemeWallpaperToApi(wallpaper) }),
  });
}

function conversationChatThemeOverridesToApi(value: unknown): unknown {
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([conversationId, override]) => [
      conversationId,
      conversationChatThemeOverrideToApi(override),
    ])
  );
}

export function normalizeCustomizationPayloadForApi(
  payload: CustomizationApiPayload
): CustomizationApiPayload {
  const next: CustomizationApiPayload = { ...payload };

  if ('chat_theme_settings' in next) {
    next.chat_theme_settings = chatThemeSettingsToApi(next.chat_theme_settings);
  }

  if ('default_conversation_color' in next) {
    next.default_conversation_color = defaultConversationColorToApi(
      next.default_conversation_color
    );
  }

  if ('conversation_chat_theme_overrides' in next) {
    next.conversation_chat_theme_overrides = conversationChatThemeOverridesToApi(
      next.conversation_chat_theme_overrides
    );
  }

  return next;
}

export function userHasPremiumAccess(
  user: Pick<User, 'isPremium' | 'subscription'> | null
): boolean {
  if (!user) return false;

  const tier = user?.subscription?.tier;
  const status = user?.subscription?.status;
  const expiresAt = user?.subscription?.expiresAt;
  const isPaidTier = tier === 'premium';
  const isActiveStatus = status === undefined || status === null || status === 'active';
  const expiresAtTime = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const isUnexpired = !expiresAt || Number.isNaN(expiresAtTime) || expiresAtTime > Date.now();

  return (user.isPremium === true || isPaidTier) && isActiveStatus && isUnexpired;
}

export function currentUserHasPremiumAccess(): boolean | null {
  const user = useAuthStore.getState().user;
  return user ? userHasPremiumAccess(user) : null;
}

function isFreeAvatarBorder(id: unknown): boolean {
  if (typeof id !== 'string' || id.length === 0) return true;
  const border = getBorderById(id);
  return Boolean(border && !border.isPremium);
}

function isFreeTitle(id: unknown): boolean {
  if (typeof id !== 'string' || id.length === 0) return true;
  const title = getTitleById(id);
  return Boolean(title && title.unlocked && !title.isPremium && title.category !== 'premium');
}

function isFreeBadge(id: unknown): id is string {
  if (typeof id !== 'string' || id.length === 0) return false;
  return getBadgeById(id)?.unlocked === true;
}

function isFreeNameplate(id: unknown): boolean {
  if (typeof id !== 'string' || id.length === 0) return true;
  const plate = getNameplateById(id);
  return Boolean(plate?.free);
}

function isFreeProfileTheme(id: unknown): boolean {
  if (typeof id !== 'string' || id.length === 0) return true;
  return getThemeById(id)?.tier === 'free';
}

export function sanitizeCustomizationPayloadForAccess(
  payload: CustomizationApiPayload,
  hasPremiumAccess: boolean
): CustomizationApiPayload {
  if (hasPremiumAccess) return payload;

  const next: CustomizationApiPayload = { ...payload };

  if (!isFreeAvatarBorder(next.avatar_border_id)) {
    next.avatar_border_id = null;
  }

  if (!isFreeTitle(next.title_id)) {
    next.title_id = null;
  }

  if (Array.isArray(next.equipped_badges)) {
    next.equipped_badges = next.equipped_badges.filter(isFreeBadge);
  }

  if (!isFreeNameplate(next.equipped_nameplate)) {
    next.equipped_nameplate = null;
  }

  if (!isFreeProfileTheme(next.profile_theme)) {
    next.profile_theme = DEFAULT_PROFILE_THEME.id;
  }

  return next;
}

export function sanitizeCustomizationStateForAccess(
  state: CustomizationState,
  hasPremiumAccess: boolean
): CustomizationState {
  if (hasPremiumAccess) return state;

  const selectedBorderId = isFreeAvatarBorder(state.selectedBorderId)
    ? state.selectedBorderId
    : null;
  const equippedTitle = isFreeTitle(state.equippedTitle) ? state.equippedTitle : null;
  const equippedNameplate = isFreeNameplate(state.equippedNameplate)
    ? state.equippedNameplate
    : null;
  const selectedProfileThemeId = isFreeProfileTheme(state.selectedProfileThemeId)
    ? state.selectedProfileThemeId
    : DEFAULT_PROFILE_THEME.id;

  return {
    ...state,
    selectedBorderId,
    equippedTitle,
    title: equippedTitle,
    equippedBadges: state.equippedBadges.filter(isFreeBadge),
    equippedNameplate,
    selectedProfileThemeId,
    profileTheme: selectedProfileThemeId,
  };
}

// DEBOUNCED SAVE
export async function persistCustomizationState(state: CustomizationState): Promise<unknown> {
  const premiumAccess = currentUserHasPremiumAccess();
  const mappedPayload = normalizeCustomizationPayloadForApi(apiSchemaMapper.toApi(state));
  delete mappedPayload.avatar_border;
  delete mappedPayload.avatar_border_type;
  const payload =
    premiumAccess === null
      ? mappedPayload
      : sanitizeCustomizationPayloadForAccess(mappedPayload, premiumAccess);
  const response = await http.patch('/api/v1/me/customizations', {
    ...payload,
    custom_config: payload,
  });
  notifyCustomizationChanged();
  return response.data;
}

export const debouncedSave = createDebouncedSave<CustomizationStore>(
  async (state, set) => {
    const premiumAccess = currentUserHasPremiumAccess();
    const safeState =
      premiumAccess === null
        ? state
        : sanitizeCustomizationStateForAccess(state, premiumAccess);
    set(safeState);
    await persistCustomizationState(safeState);
  },
  { delay: 1000 }
);

// PERSISTENCE CONFIG

export const PERSIST_PARTIALIZE = (state: CustomizationStore) => ({
  themePreset: state.themePreset,
  effectPreset: state.effectPreset,
  animationSpeed: state.animationSpeed,
  particlesEnabled: state.particlesEnabled,
  glowEnabled: state.glowEnabled,
  blurEnabled: state.blurEnabled,
  animatedBackground: state.animatedBackground,
  avatarBorderColor: state.avatarBorderColor,
  avatarSize: state.avatarSize,
  selectedBorderTheme: state.selectedBorderTheme,
  selectedBorderId: state.selectedBorderId,
  chatBubbleStyle: state.chatBubbleStyle,
  chatBubbleColor: state.chatBubbleColor,
  bubbleBorderRadius: state.bubbleBorderRadius,
  bubbleShadowIntensity: state.bubbleShadowIntensity,
  bubbleEntranceAnimation: state.bubbleEntranceAnimation,
  bubbleGlassEffect: state.bubbleGlassEffect,
  bubbleShowTail: state.bubbleShowTail,
  bubbleHoverEffect: state.bubbleHoverEffect,
  groupMessages: state.groupMessages,
  showTimestamps: state.showTimestamps,
  compactMode: state.compactMode,
  chatThemeSettings: state.chatThemeSettings,
  defaultConversationColor: state.defaultConversationColor,
  customChatColors: state.customChatColors,
  conversationChatThemeOverrides: state.conversationChatThemeOverrides,
  profileCardStyle: state.profileCardStyle,
  selectedProfileThemeId: state.selectedProfileThemeId,
  showBadges: state.showBadges,
  showBio: state.showBio,
  showStatus: state.showStatus,
  glowEffects: state.glowEffects,
  particleEffects: state.particleEffects,
  equippedTitle: state.equippedTitle,
  title: state.title,
  equippedBadges: state.equippedBadges,
  displayNameFont: state.displayNameFont,
  displayNameEffect: state.displayNameEffect,
  displayNameColor: state.displayNameColor,
  displayNameSecondaryColor: state.displayNameSecondaryColor,
  equippedNameplate: state.equippedNameplate,
  profileThemePresetId: state.profileThemePresetId,
  profileThemePrimary: state.profileThemePrimary,
  profileThemeAccent: state.profileThemeAccent,
});
