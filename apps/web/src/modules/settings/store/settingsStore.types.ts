/**
 * Settings Store Types
 *
 * Type definitions, interfaces, union types, and default constants
 * for the settings store.
 *
 */

import type {
  AppearanceSettings,
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
} from '@cgraph/shared-types';

export type {
  AppearanceSettings,
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
} from '@cgraph/shared-types';

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
} from '@cgraph/shared-types';

// API Response Mapping Types

export interface ApiSettings {
  notifications?: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    message_notifications?: boolean;
    mention_notifications?: boolean;
    friend_request_notifications?: boolean;
    group_invite_notifications?: boolean;
    forum_reply_notifications?: boolean;
    economy_notifications?: boolean;
    system_notifications?: boolean;
    notification_sound?: boolean;
    quiet_hours_enabled?: boolean;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    dnd_until?: string | null;
  };

  privacy?: {
    profile_visibility?: ProfileVisibility;
    online_status_visible?: boolean;
    read_receipts_enabled?: boolean;
    typing_indicators_enabled?: boolean;
    allow_friend_requests?: boolean;
    allow_message_requests?: boolean;
    show_in_search?: boolean;
    allow_group_invites?: GroupInvitePermission;
    show_last_active?: boolean;
    show_post_count?: boolean;
    show_join_date?: boolean;
    show_bio?: boolean;
    show_social_links?: boolean;
    show_activity?: boolean;
    show_in_member_list?: boolean;
    show_phone?: boolean;
    show_forwarded_from?: boolean;
    allow_calls?: boolean;
    auto_delete_default?: number | null;
    selective_privacy?: unknown;
  };

  appearance?: {
    theme?: Theme;
    compact_mode?: boolean;
    font_size?: FontSize;
    message_density?: MessageDensity;
    show_avatars?: boolean;
    animate_emojis?: boolean;
    reduce_motion?: boolean;
    high_contrast?: boolean;
    screen_reader_optimized?: boolean;
  };

  locale?: {
    language?: string;
    timezone?: string;
    date_format?: DateFormat;
    time_format?: TimeFormat;
  };

  keyboard?: {
    keyboard_shortcuts_enabled?: boolean;
    custom_shortcuts?: Record<string, string>;
  };

  media?: {
    auto_download_photos?: AutoDownloadPolicy;
    auto_download_videos?: AutoDownloadPolicy;
    auto_download_files?: AutoDownloadPolicy;
    data_saver_mode?: boolean;
  };

  stickers_emoji?: {
    suggest_stickers?: boolean;
    loop_animated_stickers?: boolean;
    default_skin_tone?: EmojiSkinTone;
    installed_sticker_pack_ids?: readonly string[];
  };

  calls?: {
    echo_cancellation?: boolean;
    noise_suppression?: boolean;
    auto_gain_control?: boolean;
    default_video_resolution?: VideoResolution;
  };

  // Notifications
  email_notifications?: boolean;
  push_notifications?: boolean;
  notify_messages?: boolean;
  notify_mentions?: boolean;
  notify_friend_requests?: boolean;
  notify_group_invites?: boolean;
  notify_forum_replies?: boolean;
  notify_economy?: boolean;
  notify_system?: boolean;
  notification_sound?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  dnd_until?: string | null;

  // Privacy
  show_online_status?: boolean;
  show_read_receipts?: boolean;
  show_typing_indicators?: boolean;
  profile_visibility?: ProfileVisibility;
  allow_friend_requests?: boolean;
  allow_message_requests?: boolean;
  show_in_search?: boolean;
  allow_group_invites?: GroupInvitePermission;
  show_bio?: boolean;
  show_post_count?: boolean;
  show_join_date?: boolean;
  show_last_active?: boolean;
  show_social_links?: boolean;
  show_activity?: boolean;
  show_in_member_list?: boolean;
  show_phone?: boolean;
  show_forwarded_from?: boolean;
  allow_calls?: boolean;
  auto_delete_default?: number | null;
  selective_privacy?: unknown;

  // Appearance
  theme?: Theme;
  compact_mode?: boolean;
  font_size?: FontSize;
  message_density?: MessageDensity;
  show_avatars?: boolean;
  animate_emojis?: boolean;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  screen_reader_optimized?: boolean;

  // Locale
  language?: string;
  timezone?: string;
  date_format?: DateFormat;
  time_format?: TimeFormat;

  // Keyboard
  keyboard_shortcuts_enabled?: boolean;
  custom_shortcuts?: Record<string, string>;

  // Media / Data & Storage
  auto_download_photos?: AutoDownloadPolicy;
  auto_download_videos?: AutoDownloadPolicy;
  auto_download_files?: AutoDownloadPolicy;
  data_saver_mode?: boolean;

  // Stickers / Emoji
  suggest_stickers?: boolean;
  loop_animated_stickers?: boolean;
  default_skin_tone?: EmojiSkinTone;
  installed_sticker_pack_ids?: readonly string[];

  // Calls
  echo_cancellation?: boolean;
  noise_suppression?: boolean;
  auto_gain_control?: boolean;
  default_video_resolution?: VideoResolution;
}

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
