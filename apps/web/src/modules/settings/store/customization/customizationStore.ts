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
  ProfileCardStyle,
  ThemePreset,
} from './customizationStore.types';
import {
  CUSTOMIZATION_THEME_PRESETS,
  THEME_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';
import {
  apiSchemaMapper,
  debouncedSave,
  persistCustomizationState,
  PERSIST_PARTIALIZE,
} from './customizationStore.schema';

const logger = createLogger('customizationStore');
const CUSTOMIZATION_THEME_PRESET_SET = new Set<string>(CUSTOMIZATION_THEME_PRESETS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProfileCardStyle(value: unknown): ProfileCardStyle {
  return isProfileCardLayoutId(value) ? value : DEFAULT_PROFILE_CARD_LAYOUT_ID;
}

function normalizeProfileThemeId(value: unknown): ProfileThemeId | null {
  return isProfileThemeId(value) ? value : null;
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

  return withServerPatchAliases(next);
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

          set({
            ...withServerPatchAliases(mappedUpdates),
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
            const parsed = withCanonicalAliases(
              apiSchemaMapper.fromApi(serverAuthoritativeCustomizationPayload(data), DEFAULT_STATE)
            );

            set({
              ...parsed,
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
          const state = get();
          set({ isSaving: true, error: null });

          try {
            const response = await persistCustomizationState(state);
            const data = isRecord(response) && isRecord(response.data) ? response.data : response;

            if (isRecord(data)) {
              const parsed = mapServerCustomizationPatch(
                serverAuthoritativeCustomizationPayload(data),
                get()
              );

              set({
                ...parsed,
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
