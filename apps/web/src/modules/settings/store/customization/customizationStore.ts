/**
 * Unified Customization Store
 *
 * Consolidates: customizationStore, customizationStoreV2, unifiedCustomizationStore
 *
 * Features:
 * - Single source of truth for all customizations
 * - Optimistic updates with rollback on error
 * - Debounced saves to reduce API calls
 * - Type-safe schema mapping (camelCase <-> snake_case)
 * - Efficient toggle/setter factories
 *
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_PROFILE_CARD_LAYOUT_ID, isProfileCardLayoutId } from '@cgraph-dev/shared-types';
import {
  CHAT_THEME_BASES,
  CHAT_THEME_CONVERSATION_COLORS,
  DEFAULT_CHAT_THEME_CONVERSATION_COLOR,
  DEFAULT_CHAT_THEME_CUSTOM_COLORS,
  chatThemePresetId,
  chatThemePresetToSettings,
  getChatThemeAccentPresetsForBase,
  type ChatThemeBase,
  type ChatThemeConversationColor,
  type ChatThemeConversationOverride,
  type ChatThemeCustomColor,
  type ChatThemeCustomColorData,
  type ChatThemeCustomColorStore,
  type ChatThemeCustomColorStop,
  type ChatThemeDefaultConversationColor,
  type ChatThemeWallpaperPreset,
} from '@cgraph-dev/shared-types/chat-theme';
import { isProfileThemeId, type ProfileThemeId } from '@/data/profileThemes';
import { http } from '@/lib/api-client';
import { safeLocalStorage } from '@/lib/safeStorage';
import { type ZustandSet } from '@/lib/store-helpers';
import { createLogger } from '@/lib/logger';

// Re-export types and constants from the types module
export type {
  ThemePreset,
  EffectPreset,
  AnimationSpeed,
  AvatarBorderType,
  ChatBubbleStyle,
  ProfileCardStyle,
  BubbleAnimation,
  ThemeColors,
  CustomizationState,
  CustomizationServerPatch,
  CustomizationStore,
} from './customizationStore.types';
export {
  CUSTOMIZATION_THEME_PRESETS,
  THEME_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';

// NOTE: Selectors are NOT re-exported here to avoid circular dependency.
// Import selectors from './customizationStore.selectors' directly, or via the barrel './index'.

import type {
  CustomizationServerPatch,
  CustomizationState,
  CustomizationStore,
  CustomizationChatThemeSettings,
  ProfileCardStyle,
  ThemePreset,
} from './customizationStore.types';
import {
  CUSTOMIZATION_THEME_PRESETS,
  DEFAULT_CHAT_THEME_SETTINGS,
  THEME_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';
import {
  apiSchemaMapper,
  currentUserHasPremiumAccess,
  debouncedSave,
  persistCustomizationState,
  PERSIST_PARTIALIZE,
  sanitizeCustomizationStateForAccess,
} from './customizationStore.schema';

const logger = createLogger('customizationStore');
const CUSTOMIZATION_THEME_PRESET_SET = new Set<string>(CUSTOMIZATION_THEME_PRESETS);
const CHAT_THEME_BASE_SET = new Set<string>(CHAT_THEME_BASES);
const CHAT_THEME_CONVERSATION_COLOR_SET = new Set<string>([
  ...CHAT_THEME_CONVERSATION_COLORS,
  'custom',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProfileCardStyle(value: unknown): ProfileCardStyle {
  return isProfileCardLayoutId(value) ? value : DEFAULT_PROFILE_CARD_LAYOUT_ID;
}

function normalizeProfileThemeId(value: unknown): ProfileThemeId | null {
  return isProfileThemeId(value) ? value : null;
}

function isChatThemeBase(value: unknown): value is ChatThemeBase {
  return typeof value === 'string' && CHAT_THEME_BASE_SET.has(value);
}

function normalizeRgbInt(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 0xffffff
    ? value
    : null;
}

function getRecordNumber(
  value: Record<string, unknown>,
  keys: readonly string[]
): number | null {
  for (const key of keys) {
    const number = normalizeRgbInt(value[key]);
    if (number !== null) return number;
  }
  return null;
}

function normalizeChatThemeWallpaper(value: unknown): ChatThemeWallpaperPreset | undefined {
  if (!isRecord(value)) return undefined;

  const intensity = typeof value.intensity === 'number' ? value.intensity : null;
  const backgroundColor = getRecordNumber(value, ['backgroundColor', 'background_color']);
  if (intensity === null || backgroundColor === null) return undefined;

  const secondBackgroundColor = getRecordNumber(value, [
    'secondBackgroundColor',
    'second_background_color',
  ]);
  const thirdBackgroundColor = getRecordNumber(value, [
    'thirdBackgroundColor',
    'third_background_color',
  ]);
  const fourthBackgroundColor = getRecordNumber(value, [
    'fourthBackgroundColor',
    'fourth_background_color',
  ]);

  return {
    intensity,
    backgroundColor,
    ...(secondBackgroundColor === null ? {} : { secondBackgroundColor }),
    ...(thirdBackgroundColor === null ? {} : { thirdBackgroundColor }),
    ...(fourthBackgroundColor === null ? {} : { fourthBackgroundColor }),
    ...(typeof value.dark === 'boolean' ? { dark: value.dark } : {}),
  };
}

function getChatThemePresetSettings(
  base: ChatThemeBase,
  presetId: string
): CustomizationChatThemeSettings | null {
  const preset = getChatThemeAccentPresetsForBase(base).find(
    (item) => chatThemePresetId(item) === presetId
  );
  if (!preset) return null;

  return {
    ...chatThemePresetToSettings(preset, base),
    presetId: chatThemePresetId(preset),
  };
}

function normalizeChatThemeSettings(
  value: unknown,
  current: CustomizationChatThemeSettings = DEFAULT_CHAT_THEME_SETTINGS
): CustomizationChatThemeSettings {
  if (!isRecord(value)) return current;

  const base = isChatThemeBase(value.base) ? value.base : current.base;
  const rawPresetId = value.presetId ?? value.preset_id;
  const presetId = typeof rawPresetId === 'string' ? rawPresetId : null;
  const presetSettings = presetId ? getChatThemePresetSettings(base, presetId) : null;
  const fallback = presetSettings ?? (base === current.base ? current : DEFAULT_CHAT_THEME_SETTINGS);
  const normalizedPresetId =
    presetSettings?.presetId ?? (presetId === null ? null : fallback.presetId);
  const accentColor =
    getRecordNumber(value, ['accentColor', 'accent_color']) ?? fallback.accentColor;
  const rawMessageColors = value.messageColors ?? value.message_colors;
  const messageColors = Array.isArray(rawMessageColors)
    ? rawMessageColors.filter((item): item is number => normalizeRgbInt(item) !== null)
    : fallback.messageColors;
  const wallpaper = normalizeChatThemeWallpaper(value.wallpaper) ?? fallback.wallpaper;

  return {
    base,
    presetId: normalizedPresetId,
    accentColor,
    messageColors: messageColors.length > 0 ? messageColors : fallback.messageColors,
    ...(wallpaper ? { wallpaper } : {}),
  };
}

function normalizeChatThemeCustomColorStop(value: unknown): ChatThemeCustomColorStop | null {
  if (!isRecord(value)) return null;

  const hue = typeof value.hue === 'number' ? value.hue : null;
  const saturation = typeof value.saturation === 'number' ? value.saturation : null;
  if (hue === null || saturation === null) return null;

  return {
    hue,
    saturation,
    ...(typeof value.lightness === 'number' ? { lightness: value.lightness } : {}),
  };
}

function normalizeChatThemeCustomColor(value: unknown): ChatThemeCustomColor | undefined {
  if (!isRecord(value)) return undefined;

  const start = normalizeChatThemeCustomColorStop(value.start);
  if (!start) return undefined;

  const end = normalizeChatThemeCustomColorStop(value.end);
  return {
    start,
    ...(end ? { end } : {}),
    ...(typeof value.deg === 'number' ? { deg: value.deg } : {}),
  };
}

function normalizeChatThemeCustomColorData(value: unknown): ChatThemeCustomColorData | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') return undefined;

  const color = normalizeChatThemeCustomColor(value.value);
  if (!color) return undefined;

  return { id: value.id, value: color };
}

function isChatThemeConversationColor(value: unknown): value is ChatThemeConversationColor {
  return typeof value === 'string' && CHAT_THEME_CONVERSATION_COLOR_SET.has(value);
}

function normalizeConversationColor(value: unknown): ChatThemeConversationColor | null {
  return isChatThemeConversationColor(value) ? value : null;
}

function normalizeDefaultConversationColor(
  value: unknown,
  current: ChatThemeDefaultConversationColor = DEFAULT_CHAT_THEME_CONVERSATION_COLOR
): ChatThemeDefaultConversationColor {
  if (!isRecord(value)) return current;

  const color = normalizeConversationColor(value.color) ?? current.color;
  const customColorData = normalizeChatThemeCustomColorData(
    value.customColorData ?? value.custom_color_data
  );

  return {
    color,
    ...(customColorData ? { customColorData } : {}),
  };
}

function normalizeCustomChatColors(
  value: unknown,
  current: ChatThemeCustomColorStore = DEFAULT_CHAT_THEME_CUSTOM_COLORS
): ChatThemeCustomColorStore {
  if (!isRecord(value) || !isRecord(value.colors)) return current;

  const colors = Object.fromEntries(
    Object.entries(value.colors)
      .map(([id, color]) => [id, normalizeChatThemeCustomColor(color)] as const)
      .filter((entry): entry is readonly [string, ChatThemeCustomColor] => Boolean(entry[1]))
  );
  const order = Array.isArray(value.order)
    ? value.order.filter((id): id is string => typeof id === 'string')
    : current.order;

  return {
    colors,
    version: typeof value.version === 'number' ? value.version : current.version,
    ...(order ? { order } : {}),
  };
}

function normalizeConversationChatThemeOverride(
  value: unknown
): ChatThemeConversationOverride {
  if (!isRecord(value)) return {};

  const conversationColor = normalizeConversationColor(
    value.conversationColor ?? value.conversation_color
  );
  const customColor = normalizeChatThemeCustomColor(value.customColor ?? value.custom_color);
  const customColorId = value.customColorId ?? value.custom_color_id;

  return {
    ...(conversationColor ? { conversationColor } : {}),
    ...(customColor ? { customColor } : {}),
    ...(typeof customColorId === 'string' ? { customColorId } : {}),
  };
}

function normalizeConversationChatThemeOverrides(
  value: unknown,
  current: CustomizationState['conversationChatThemeOverrides'] = {}
): CustomizationState['conversationChatThemeOverrides'] {
  if (!isRecord(value)) return current;

  return Object.fromEntries(
    Object.entries(value).map(([conversationId, override]) => [
      conversationId,
      normalizeConversationChatThemeOverride(override),
    ])
  );
}

function withCanonicalAliases(state: CustomizationState): CustomizationState {
  const profileCardStyle = normalizeProfileCardStyle(state.profileCardStyle);
  const selectedProfileThemeId = normalizeProfileThemeId(state.selectedProfileThemeId);

  return {
    ...state,
    profileCardStyle,
    selectedProfileThemeId,
    chatTheme: state.chatBubbleColor,
    bubbleStyle: state.chatBubbleStyle,
    messageEffect: state.bubbleEntranceAnimation,
    avatarBorder: state.avatarBorderType,
    title: state.equippedTitle,
    profileLayout: profileCardStyle,
    profileTheme: selectedProfileThemeId,
    appTheme: state.themePreset,
  };
}

function withServerPatchAliases(
  updates: CustomizationServerPatch | Record<string, unknown>
): CustomizationServerPatch {
  const next: CustomizationServerPatch = {};
  Object.assign(next, updates);

  if ('chatBubbleColor' in next && !('chatTheme' in next)) next.chatTheme = next.chatBubbleColor;
  if ('chatTheme' in next && !('chatBubbleColor' in next)) next.chatBubbleColor = next.chatTheme;
  if ('chatBubbleStyle' in next && !('bubbleStyle' in next))
    next.bubbleStyle = next.chatBubbleStyle;
  if ('bubbleEntranceAnimation' in next && !('messageEffect' in next)) {
    next.messageEffect = next.bubbleEntranceAnimation;
  }
  if ('avatarBorderType' in next && !('avatarBorder' in next)) {
    next.avatarBorder = next.avatarBorderType;
  }
  if ('equippedTitle' in next && !('title' in next)) next.title = next.equippedTitle;
  if ('selectedProfileThemeId' in next || 'profileTheme' in next) {
    const profileTheme = normalizeProfileThemeId(next.selectedProfileThemeId ?? next.profileTheme);
    next.selectedProfileThemeId = profileTheme;
    next.profileTheme = profileTheme;
  }
  if ('profileCardStyle' in next || 'profileLayout' in next) {
    const profileCardStyle = normalizeProfileCardStyle(next.profileCardStyle ?? next.profileLayout);
    next.profileCardStyle = profileCardStyle;
    next.profileLayout = profileCardStyle;
  }
  if ('themePreset' in next && !('appTheme' in next)) next.appTheme = next.themePreset;

  return next;
}

function getStringPatchValue(
  updates: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = updates[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

function isThemePreset(value: string | null): value is ThemePreset {
  return Boolean(value && CUSTOMIZATION_THEME_PRESET_SET.has(value));
}

function serverAuthoritativeCustomizationPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {};

  const customConfig = isRecord(data.custom_config) ? data.custom_config : {};
  return { ...customConfig, ...data };
}

function mapServerCustomizationPatch(
  updates: Record<string, unknown>,
  current: CustomizationStore
): CustomizationServerPatch {
  const mappedUpdates = apiSchemaMapper.fromApi(updates, current);
  const next: CustomizationServerPatch = { ...withCanonicalAliases(mappedUpdates) };
  const chatThemeSettings =
    updates.chat_theme_settings ?? updates.chatThemeSettings ?? mappedUpdates.chatThemeSettings;
  const defaultConversationColor =
    updates.default_conversation_color ??
    updates.defaultConversationColor ??
    mappedUpdates.defaultConversationColor;
  const customChatColors =
    updates.custom_chat_colors ?? updates.customChatColors ?? mappedUpdates.customChatColors;
  const conversationChatThemeOverrides =
    updates.conversation_chat_theme_overrides ??
    updates.conversationChatThemeOverrides ??
    mappedUpdates.conversationChatThemeOverrides;

  const appTheme = getStringPatchValue(updates, ['app_theme', 'appTheme', 'themePreset']);
  if (isThemePreset(appTheme)) {
    next.themePreset = appTheme;
    next.appTheme = appTheme;
  }

  const chatTheme = getStringPatchValue(updates, ['chat_theme', 'chatTheme', 'chatBubbleColor']);
  if (isThemePreset(chatTheme)) {
    next.chatBubbleColor = chatTheme;
    next.chatTheme = chatTheme;
  }

  const profileTheme = getStringPatchValue(updates, [
    'profile_theme',
    'profileTheme',
    'selectedProfileThemeId',
  ]);
  if (profileTheme !== null) {
    const normalizedTheme = normalizeProfileThemeId(profileTheme);
    next.selectedProfileThemeId = normalizedTheme;
    next.profileTheme = normalizedTheme;
  }

  const profileCardStyle = getStringPatchValue(updates, [
    'profile_layout',
    'profileLayout',
    'profileCardStyle',
  ]);
  if (profileCardStyle !== null) {
    const normalizedStyle = normalizeProfileCardStyle(profileCardStyle);
    next.profileCardStyle = normalizedStyle;
    next.profileLayout = normalizedStyle;
  }

  if (chatThemeSettings !== undefined) {
    next.chatThemeSettings = normalizeChatThemeSettings(
      chatThemeSettings,
      current.chatThemeSettings
    );
  }

  if (defaultConversationColor !== undefined) {
    next.defaultConversationColor = normalizeDefaultConversationColor(
      defaultConversationColor,
      current.defaultConversationColor
    );
  }

  if (customChatColors !== undefined) {
    next.customChatColors = normalizeCustomChatColors(
      customChatColors,
      current.customChatColors
    );
  }

  if (conversationChatThemeOverrides !== undefined) {
    next.conversationChatThemeOverrides = normalizeConversationChatThemeOverrides(
      conversationChatThemeOverrides,
      current.conversationChatThemeOverrides
    );
  }

  return withServerPatchAliases(next);
}

function withCurrentAccess(state: CustomizationState): CustomizationState {
  const premiumAccess = currentUserHasPremiumAccess();
  if (premiumAccess === null) return withCanonicalAliases(state);

  return withCanonicalAliases(
    sanitizeCustomizationStateForAccess(state, premiumAccess)
  );
}

// STORE CREATION

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => {
      // Wrap zustand's set to match ZustandSet<CustomizationStore> signature.
      // Zustand's persist middleware provides a narrower `set` overload where
      // `replace` is typed as `false | undefined`. This wrapper bridges the gap.
      const _set: ZustandSet<CustomizationStore> = (partial) => set(partial);

      const setAndSave = (updates: CustomizationServerPatch | Record<string, unknown>) => {
        const normalizedUpdates = withServerPatchAliases(updates);
        set({ ...normalizedUpdates, isDirty: true });
        debouncedSave(get(), _set);
      };

      const createAutoSaveToggle = (key: keyof CustomizationStore) => () => {
        const current = get()[key];
        const toggled = typeof current === 'boolean' ? !current : current;
        setAndSave({ [key]: toggled });
      };

      return {
        ...DEFAULT_STATE,

        // === Batch Update ===
        updateSettings: (updates) => setAndSave(updates),
        applyServerSettings: (updates) => {
          const mappedUpdates = mapServerCustomizationPatch(updates, get());
          const nextState = withCurrentAccess({ ...get(), ...mappedUpdates });

          set({
            ...withServerPatchAliases(nextState),
            isDirty: false,
            lastSyncedAt: Date.now(),
          });
        },

        // === Theme Actions ===
        setTheme: (preset) => setAndSave({ themePreset: preset }),
        setEffect: (preset) => setAndSave({ effectPreset: preset }),
        setAnimationSpeed: (speed) => setAndSave({ animationSpeed: speed }),
        toggleParticles: createAutoSaveToggle('particlesEnabled'),
        toggleGlow: createAutoSaveToggle('glowEnabled'),
        toggleBlur: createAutoSaveToggle('blurEnabled'),
        toggleAnimatedBackground: createAutoSaveToggle('animatedBackground'),

        // === Avatar Actions ===
        setAvatarBorder: (type) => setAndSave({ avatarBorderType: type, avatarBorder: type }),
        setAvatarBorderColor: (color) => setAndSave({ avatarBorderColor: color }),
        setAvatarSize: (size) => setAndSave({ avatarSize: size }),
        selectBorderTheme: (theme) => setAndSave({ selectedBorderTheme: theme }),
        selectBorderId: (id) => setAndSave({ selectedBorderId: id }),

        // === Chat Actions ===
        setChatBubbleStyle: (style) => setAndSave({ chatBubbleStyle: style, bubbleStyle: style }),
        setChatBubbleColor: (color) => setAndSave({ chatBubbleColor: color, chatTheme: color }),
        setBubbleBorderRadius: (radius) => setAndSave({ bubbleBorderRadius: radius }),
        setBubbleShadowIntensity: (intensity) => setAndSave({ bubbleShadowIntensity: intensity }),
        setBubbleAnimation: (animation) =>
          setAndSave({ bubbleEntranceAnimation: animation, messageEffect: animation }),
        toggleBubbleGlass: createAutoSaveToggle('bubbleGlassEffect'),
        toggleBubbleTail: createAutoSaveToggle('bubbleShowTail'),
        toggleBubbleHover: createAutoSaveToggle('bubbleHoverEffect'),
        toggleGroupMessages: createAutoSaveToggle('groupMessages'),
        toggleTimestamps: createAutoSaveToggle('showTimestamps'),
        toggleCompactMode: createAutoSaveToggle('compactMode'),
        setChatThemePreset: (base, presetId) => {
          const settings = getChatThemePresetSettings(base, presetId);
          if (settings) {
            setAndSave({ chatThemeSettings: settings });
          }
        },

        // === Profile Actions ===
        setProfileCardStyle: (style) =>
          setAndSave({ profileCardStyle: style, profileLayout: style }),
        setProfileTheme: (themeId) => {
          const profileTheme = normalizeProfileThemeId(themeId);
          setAndSave({ selectedProfileThemeId: profileTheme, profileTheme });
        },
        toggleBadges: createAutoSaveToggle('showBadges'),
        toggleBio: createAutoSaveToggle('showBio'),
        toggleStatus: createAutoSaveToggle('showStatus'),
        toggleGlowEffects: createAutoSaveToggle('glowEffects'),
        toggleParticleEffects: createAutoSaveToggle('particleEffects'),
        setEquippedTitle: (titleId) => setAndSave({ equippedTitle: titleId, title: titleId }),
        setEquippedBadges: (badgeIds) => setAndSave({ equippedBadges: badgeIds }),

        // === Display Name Style Actions ===
        setDisplayNameFont: (font) => setAndSave({ displayNameFont: font }),
        setDisplayNameEffect: (effect) => setAndSave({ displayNameEffect: effect }),
        setDisplayNameColor: (color) => setAndSave({ displayNameColor: color }),
        setDisplayNameSecondaryColor: (color) => setAndSave({ displayNameSecondaryColor: color }),

        // === Nameplate Actions ===
        setEquippedNameplate: (nameplateId) => setAndSave({ equippedNameplate: nameplateId }),

        // === Profile Theme Preset Actions ===
        setProfileThemePreset: (presetId, primary, accent) =>
          setAndSave({
            profileThemePresetId: presetId,
            profileThemePrimary: primary,
            profileThemeAccent: accent,
          }),

        // === Legacy Batch Update Methods ===
        updateChatStyle: (key, value) => setAndSave({ [key]: value }),
        updateEffects: (key, value) => setAndSave({ [key]: value }),
        updateIdentity: (key, value) => setAndSave({ [key]: value }),
        updateTheme: (key, value) => setAndSave({ [key]: value }),

        // === Sync Actions ===
        fetchCustomizations: async (_userId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await http.get('/api/v1/me/customizations');
            const data = response.data.data;
            const parsed = mapServerCustomizationPatch(
              serverAuthoritativeCustomizationPayload(data),
              get()
            );
            const nextState = withCurrentAccess({ ...DEFAULT_STATE, ...parsed });

            set({
              ...nextState,
              isLoading: false,
              lastSyncedAt: Date.now(),
              isDirty: false,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load';
            logger.error('Failed to fetch customizations:', error);
            set({ isLoading: false, error: message });
          }
        },

        saveCustomizations: async (_userId?: string) => {
          const state = withCurrentAccess(get());
          set({ isSaving: true, error: null });

          try {
            set(withServerPatchAliases(state));
            const response = await persistCustomizationState(state);
            const data = isRecord(response) && isRecord(response.data) ? response.data : response;

            if (isRecord(data)) {
              const parsed = mapServerCustomizationPatch(
                serverAuthoritativeCustomizationPayload(data),
                get()
              );
              const nextState = withCurrentAccess({ ...get(), ...parsed });

              set({
                ...withServerPatchAliases(nextState),
                isSaving: false,
                isDirty: false,
                error: null,
                lastSyncedAt: Date.now(),
              });
            } else {
              set({
                isSaving: false,
                isDirty: false,
                error: null,
                lastSyncedAt: Date.now(),
              });
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save';
            logger.error('Failed to save customizations:', error);
            set({ isSaving: false, error: message });
            throw error;
          }
        },

        resetToDefaults: () => set({ ...DEFAULT_STATE, isDirty: true }),

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'cgraph-customization',
      storage: createJSONStorage(() => safeLocalStorage),
      merge: (persistedState, currentState) => {
        if (!isRecord(persistedState)) return currentState;

        const merged: CustomizationStore = { ...currentState, ...persistedState };
        return {
          ...merged,
          ...withCanonicalAliases(merged),
        };
      },
      partialize: PERSIST_PARTIALIZE,
    }
  )
);

// LEGACY EXPORTS (for backward compatibility during migration)

/** @deprecated Use THEME_COLORS directly */
export const themeColors = THEME_COLORS;

export default useCustomizationStore;
