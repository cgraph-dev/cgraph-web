/**
 * Settings Store Actions
 *
 * All zustand action implementations for the settings store,
 * extracted for modularity.
 *
 */

import { apiClient } from '@/lib/api-client';
import { getSystemReducedMotionPreference } from '@/lib/motion/reduced-motion';
import type { ApiResult } from '@cgraph-dev/api-client';
import { AxiosError } from 'axios';
import type {
  UserSettings,
  SettingsState,
  CallsSettings,
} from './settingsStore.types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CALLS_SETTINGS,
} from './settingsStore.types';
import { mapSettingsFromApi, mapSettingsToApi, narrowToApiSettings } from './settings-mappers';

type Set = (
  partial: Partial<SettingsState> | ((state: SettingsState) => Partial<SettingsState>)
) => void;
type Get = () => SettingsState;

class SettingsRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsRequestError';
  }
}

function readSettingsResult<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;

  if (result.error.code === 'network_error') {
    throw new Error(result.error.message);
  }

  throw new SettingsRequestError(result.error.message);
}

function getSettingsErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof SettingsRequestError) {
    return error.message && error.message !== 'Request failed' ? error.message : fallback;
  }

  if (error instanceof AxiosError) {
    return error.response?.data?.error?.message || fallback;
  }

  return fallback;
}

/**
 */
/**
 * Creates a new settings actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createSettingsActions(
  set: Set,
  get: Get
): Pick<
  SettingsState,
  | 'fetchSettings'
  | 'updateNotificationSettings'
  | 'updatePrivacySettings'
  | 'updateAppearanceSettings'
  | 'updateLocaleSettings'
  | 'updateKeyboardSettings'
  | 'updateMediaSettings'
  | 'updateCallsSettings'
  | 'updateAllSettings'
  | 'resetToDefaults'
  | 'resetAllPreferences'
  | 'clearError'
  | 'mergeSettingsFromSync'
  | 'getTheme'
  | 'getShouldReduceMotion'
> {
  return {
    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = readSettingsResult(await apiClient.settings.getAll());
        const settings = mapSettingsFromApi(data);
        set({
          settings,
          isLoading: false,
          lastSyncedAt: Date.now(),
        });
      } catch (error) {
        const message = getSettingsErrorMessage(error, 'Failed to load settings');
        set({ isLoading: false, error: message });
        // Don't throw - use cached settings on failure
      }
    },

    updateNotificationSettings: async (notificationSettings) => {
      const previousSettings = get().settings;

      // Optimistic update
      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          notifications: { ...previousSettings.notifications, ...notificationSettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateCategory(
            'notifications',
            mapSettingsToApi({
              notifications: { ...previousSettings.notifications, ...notificationSettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        // Rollback on failure
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save notification settings'),
        });
        throw error;
      }
    },

    updatePrivacySettings: async (privacySettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          privacy: { ...previousSettings.privacy, ...privacySettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateCategory(
            'privacy',
            mapSettingsToApi({
              privacy: { ...previousSettings.privacy, ...privacySettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save privacy settings'),
        });
        throw error;
      }
    },

    updateAppearanceSettings: async (appearanceSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          appearance: { ...previousSettings.appearance, ...appearanceSettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateCategory(
            'appearance',
            mapSettingsToApi({
              appearance: { ...previousSettings.appearance, ...appearanceSettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save appearance settings'),
        });
        throw error;
      }
    },

    updateLocaleSettings: async (localeSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          locale: { ...previousSettings.locale, ...localeSettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateCategory(
            'locale',
            mapSettingsToApi({
              locale: { ...previousSettings.locale, ...localeSettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save locale settings'),
        });
        throw error;
      }
    },

    updateKeyboardSettings: async (keyboardSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          keyboard: { ...previousSettings.keyboard, ...keyboardSettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateAll(
            mapSettingsToApi({
              keyboard: { ...previousSettings.keyboard, ...keyboardSettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save keyboard settings'),
        });
        throw error;
      }
    },

    updateMediaSettings: async (mediaSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          media: { ...previousSettings.media, ...mediaSettings },
        },
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateAll(
            mapSettingsToApi({
              media: { ...previousSettings.media, ...mediaSettings },
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save data & storage settings'),
        });
        throw error;
      }
    },

    updateCallsSettings: async (partial: Partial<CallsSettings>) => {
      const prev = get().settings;
      const next = { ...prev.calls, ...partial };
      set({
        settings: {
          ...prev,
          calls: next,
        },
      });

      try {
        readSettingsResult(await apiClient.settings.updateAll(mapSettingsToApi({ calls: next })));
        set({ lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: prev,
          error: getSettingsErrorMessage(error, 'Failed to save call settings'),
        });
        throw error;
      }
    },

    updateAllSettings: async (newSettings) => {
      const previousSettings = get().settings;

      const mergedSettings: UserSettings = {
        notifications: { ...previousSettings.notifications, ...newSettings.notifications },
        privacy: { ...previousSettings.privacy, ...newSettings.privacy },
        appearance: { ...previousSettings.appearance, ...newSettings.appearance },
        locale: { ...previousSettings.locale, ...newSettings.locale },
        keyboard: { ...previousSettings.keyboard, ...newSettings.keyboard },
        media: { ...previousSettings.media, ...newSettings.media },
        stickersEmoji: { ...previousSettings.stickersEmoji, ...newSettings.stickersEmoji },
        calls: { ...previousSettings.calls, ...newSettings.calls },
      };

      set({ isSaving: true, error: null, settings: mergedSettings });

      try {
        readSettingsResult(await apiClient.settings.updateAll(mapSettingsToApi(mergedSettings)));
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to save settings'),
        });
        throw error;
      }
    },

    resetToDefaults: async () => {
      const previousSettings = get().settings;

      set({ isSaving: true, error: null, settings: DEFAULT_SETTINGS });

      try {
        readSettingsResult(await apiClient.settings.resetToDefaults());
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to reset settings'),
        });
        throw error;
      }
    },

    resetAllPreferences: async () => {
      const previousSettings = get().settings;
      const nextSettings = {
        ...previousSettings,
        calls: DEFAULT_CALLS_SETTINGS,
      };

      set({
        settings: nextSettings,
        isSaving: true,
        error: null,
      });

      try {
        readSettingsResult(
          await apiClient.settings.updateAll(
            mapSettingsToApi({
              calls: DEFAULT_CALLS_SETTINGS,
            })
          )
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error: getSettingsErrorMessage(error, 'Failed to reset preferences'),
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    // === Task 16 (C4): Settings sync — apply incoming WebSocket event ===
    // Last-write-wins: skip if the incoming timestamp is older than our local sync.
    mergeSettingsFromSync: (
      section: string,
      changes: Record<string, unknown>,
      incomingAt: string
    ) => {
      const state = get();
      const incomingMs = new Date(incomingAt).getTime();

      // If local data is strictly newer, ignore the incoming event.
      if (state.lastSyncedAt !== null && state.lastSyncedAt > incomingMs) {
        return;
      }

      const current = state.settings;

      // Narrow the raw WebSocket payload to ApiSettings (type-safe, no casts),
      // then map to camelCase. mapSettingsFromApi fills gaps with defaults, so we
      // only overlay the sections that were actually included in the broadcast.
      const patched = mapSettingsFromApi(narrowToApiSettings(changes));

      const sectionMap: Record<string, (prev: UserSettings) => UserSettings> = {
        notifications: (prev) => ({
          ...prev,
          notifications: { ...prev.notifications, ...patched.notifications },
        }),
        privacy: (prev) => {
          const includesSelectivePrivacyChange =
            'selective_privacy' in changes ||
            'allow_message_requests' in changes ||
            'show_phone' in changes ||
            'allow_calls' in changes;

          return {
            ...prev,
            privacy: {
              ...prev.privacy,
              ...patched.privacy,
              selectivePrivacy: includesSelectivePrivacyChange
                ? patched.privacy.selectivePrivacy
                : prev.privacy.selectivePrivacy,
            },
          };
        },
        appearance: (prev) => ({
          ...prev,
          appearance: { ...prev.appearance, ...patched.appearance },
        }),
        locale: (prev) => ({
          ...prev,
          locale: { ...prev.locale, ...patched.locale },
        }),
        media: (prev) => ({
          ...prev,
          media: { ...prev.media, ...patched.media },
        }),
        keyboard: (prev) => ({
          ...prev,
          keyboard: { ...prev.keyboard, ...patched.keyboard },
        }),
        stickersEmoji: (prev) => ({
          ...prev,
          stickersEmoji: { ...prev.stickersEmoji, ...patched.stickersEmoji },
        }),
        calls: (prev) => ({
          ...prev,
          calls: { ...prev.calls, ...patched.calls },
        }),
        reset: () => DEFAULT_SETTINGS,
      };

      const applySection = sectionMap[section];
      if (applySection === undefined) {
        return;
      }

      set({ settings: applySection(current), lastSyncedAt: incomingMs });
    },

    // Helper: Get resolved theme (respects system preference)
    getTheme: () => {
      const { theme } = get().settings.appearance;
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme === 'light' ? 'light' : 'dark';
    },

    // Helper: Check if motion should be reduced
    getShouldReduceMotion: () => {
      const { reduceMotion } = get().settings.appearance;
      if (reduceMotion) return true;
      return getSystemReducedMotionPreference();
    },
  };
}
