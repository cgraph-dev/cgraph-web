/**
 * Settings Store Types
 *
 * Type definitions, interfaces, union types, and default constants
 * for the settings store.
 *
 */

import type {
  AppearanceSettings,
  CallsSettings,
  KeyboardSettings,
  LocaleSettings,
  MediaSettings,
  NotificationSettings,
  PrivacySettings,
  StickersEmojiSettings,
  UserSettings,
} from '@cgraph-dev/shared-types';

export type {
  AppearanceSettings,
  ApiSettings,
  AutoDownloadPolicy,
  CallsSettings,
  DateFormat,
  EmojiSkinTone,
  FontSize,
  GroupInvitePermission,
  KeyboardSettings,
  LocaleSettings,
  MediaSettings,
  MessageDensity,
  NotificationSettings,
  PrivacySettings,
  ProfileVisibility,
  StickersEmojiSettings,
  Theme,
  TimeFormat,
  UserSettings,
  VideoResolution,
} from '@cgraph-dev/shared-types';

export {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_CALLS_SETTINGS,
  DEFAULT_KEYBOARD_SETTINGS,
  DEFAULT_LOCALE_SETTINGS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_STICKERS_EMOJI_SETTINGS,
} from '@cgraph-dev/shared-types';

// Store Interface

export interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSyncedAt: number | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  updateLocaleSettings: (settings: Partial<LocaleSettings>) => Promise<void>;
  updateKeyboardSettings: (settings: Partial<KeyboardSettings>) => Promise<void>;
  updateMediaSettings: (settings: Partial<MediaSettings>) => Promise<void>;
  updateStickersEmojiSettings: (settings: Partial<StickersEmojiSettings>) => Promise<void>;
  removeInstalledStickerPack: (packId: string) => Promise<void>;
  updateCallsSettings: (settings: Partial<CallsSettings>) => Promise<void>;
  updateAllSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  resetMediaSettings: () => Promise<void>;
  resetAllPreferences: () => Promise<void>;
  clearError: () => void;

  /**
   * Apply an incoming settings_synced WebSocket event without triggering
   * an API call (last-write-wins: only applied when incomingAt is newer
   * than the local lastSyncedAt, or when lastSyncedAt is null).
   *
   * `changes` is a raw snake_case map from the WebSocket payload; the
   * implementation narrows it into ApiSettings before mapping to camelCase.
   */
  mergeSettingsFromSync: (
    section: string,
    changes: Record<string, unknown>,
    incomingAt: string
  ) => void;

  // Helpers
  getTheme: () => 'light' | 'dark';
  getShouldReduceMotion: () => boolean;
  reset: () => void;
}
