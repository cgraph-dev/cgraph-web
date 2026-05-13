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
  CustomizationStore,
} from './customizationStore.types';
export {
  THEME_COLORS,
  AVATAR_BORDERS,
  RARITY_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';

// NOTE: Selectors are NOT re-exported here to avoid circular dependency.
// Import selectors from './customizationStore.selectors' directly, or via the barrel './index'.

import type { CustomizationState, CustomizationStore } from './customizationStore.types';
import { THEME_COLORS, DEFAULT_STATE } from './customizationStore.types';
import { apiSchemaMapper, debouncedSave, PERSIST_PARTIALIZE } from './customizationStore.schema';

const logger = createLogger('customizationStore');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function withCanonicalAliases(state: CustomizationState): CustomizationState {
  return {
    ...state,
    chatTheme: state.chatBubbleColor,
    bubbleStyle: state.chatBubbleStyle,
    messageEffect: state.bubbleEntranceAnimation,
    avatarBorder: state.avatarBorderType,
    title: state.equippedTitle,
    profileLayout: state.profileCardStyle,
    profileTheme: state.selectedProfileThemeId,
    appTheme: state.themePreset,
  };
}

// STORE CREATION

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => {
      // Wrap zustand's set to match ZustandSet<CustomizationStore> signature.
      // Zustand's persist middleware provides a narrower `set` overload where
      // `replace` is typed as `false | undefined`. This wrapper bridges the gap.
      const _set: ZustandSet<CustomizationStore> = (partial) => set(partial);

      const setAndSave = (updates: Partial<CustomizationStore>) => {
        set({ ...updates, isDirty: true });
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
        setProfileTheme: (themeId) =>
          setAndSave({ selectedProfileThemeId: themeId, profileTheme: themeId }),
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
            const customConfig = isRecord(data?.custom_config) ? data.custom_config : {};
            const parsed = withCanonicalAliases(
              apiSchemaMapper.fromApi({ ...customConfig, ...data }, DEFAULT_STATE)
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
          debouncedSave(state, _set);
        },

        resetToDefaults: () => set({ ...DEFAULT_STATE, isDirty: true }),

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'cgraph-customization',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: PERSIST_PARTIALIZE,
    }
  )
);

// LEGACY EXPORTS (for backward compatibility during migration)

/** @deprecated Use THEME_COLORS directly */
export const themeColors = THEME_COLORS;

// Re-export all mappings for centralized access
export * from './mappings';

export default useCustomizationStore;
