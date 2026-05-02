/**
 * Settings Store Types
 *
 * Type definitions, interfaces, union types, and default constants
 * for the settings store.
 *
 */

// Types & Interfaces

export type ProfileVisibility = 'public' | 'friends' | 'private';
export type GroupInvitePermission = 'anyone' | 'friends' | 'nobody';
export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type MessageDensity = 'comfortable' | 'compact';
export type DateFormat = 'mdy' | 'dmy' | 'ymd';
export type TimeFormat = 'twelve_hour' | 'twenty_four_hour';
export type AutoDownloadPolicy = 'always' | 'wifi' | 'never';
export type EmojiSkinTone =
  | 'neutral'
  | 'light'
  | 'medium-light'
  | 'medium'
  | 'medium-dark'
  | 'dark';
export type VideoResolution = 'auto' | '720p' | '1080p';

export interface MediaSettings {
  autoDownloadPhotos: AutoDownloadPolicy;
  autoDownloadVideos: AutoDownloadPolicy;
  autoDownloadFiles: AutoDownloadPolicy;
  dataSaverMode: boolean;
}

/**
 * Stickers and emoji preferences — local-only (persisted in localStorage
 * via the settings store). No backend sync.
 */
export interface StickersEmojiSettings {
  suggestStickers: boolean;
  loopAnimatedStickers: boolean;
  defaultSkinTone: EmojiSkinTone;
  installedPackIds: readonly string[];
}

/**
 * Voice/video call defaults — local-only. Active call settings remain
 * owned by `voiceStateStore`; these apply at the next call start.
 */
export interface CallsSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  defaultVideoResolution: VideoResolution;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyFriendRequests: boolean;
  notifyGroupInvites: boolean;
  notifyForumReplies: boolean;
  notifyEconomy: boolean;
  notifySystem: boolean;
  notificationSound: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null; // HH:MM format
  quietHoursEnd: string | null;
  dndUntil: string | null; // ISO 8601 datetime
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  profileVisibility: ProfileVisibility;
  allowFriendRequests: boolean;
  allowMessageRequests: boolean;
  showInSearch: boolean;
  allowGroupInvites: GroupInvitePermission;
  showBio: boolean;
  showPostCount: boolean;
  showJoinDate: boolean;
  showLastActive: boolean;
  showSocialLinks: boolean;
  showActivity: boolean;
  showInMemberList: boolean;
  showPhone: boolean;
  showForwardedFrom: boolean;
  allowCalls: boolean;
  autoDeleteDefault: number | null;
}

export interface AppearanceSettings {
  theme: Theme;
  compactMode: boolean;
  fontSize: FontSize;
  messageDensity: MessageDensity;
  showAvatars: boolean;
  animateEmojis: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

export interface LocaleSettings {
  language: string;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

export interface KeyboardSettings {
  keyboardShortcutsEnabled: boolean;
  customShortcuts: Record<string, string>;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  locale: LocaleSettings;
  keyboard: KeyboardSettings;
  media: MediaSettings;
  stickersEmoji: StickersEmojiSettings;
  calls: CallsSettings;
}

// Default Settings Constants

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  notifyMessages: true,
  notifyMentions: true,
  notifyFriendRequests: true,
  notifyGroupInvites: true,
  notifyForumReplies: true,
  notifyEconomy: true,
  notifySystem: true,
  notificationSound: true,
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  dndUntil: null,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnlineStatus: true,
  showReadReceipts: true,
  showTypingIndicators: true,
  profileVisibility: 'public',
  allowFriendRequests: true,
  allowMessageRequests: true,
  showInSearch: true,
  allowGroupInvites: 'anyone',
  showBio: true,
  showPostCount: true,
  showJoinDate: true,
  showLastActive: true,
  showSocialLinks: true,
  showActivity: true,
  showInMemberList: true,
  showPhone: false,
  showForwardedFrom: true,
  allowCalls: true,
  autoDeleteDefault: null,
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
  compactMode: false,
  fontSize: 'medium',
  messageDensity: 'comfortable',
  showAvatars: true,
  animateEmojis: true,
  reduceMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
};

export const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'mdy',
  timeFormat: 'twelve_hour',
};

export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  keyboardShortcutsEnabled: true,
  customShortcuts: {},
};

// Mirrors Telegram's Data & Storage defaults: photos auto-download on any
// connection, videos only on Wi-Fi, files always require manual download.
export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  autoDownloadPhotos: 'always',
  autoDownloadVideos: 'wifi',
  autoDownloadFiles: 'never',
  dataSaverMode: false,
};

// Telegram-iOS InstalledStickerPacksController defaults: sticker
// suggestions on, loop animated stickers, neutral skin tone modifier.
export const DEFAULT_STICKERS_EMOJI_SETTINGS: StickersEmojiSettings = {
  suggestStickers: true,
  loopAnimatedStickers: true,
  defaultSkinTone: 'neutral',
  installedPackIds: [],
};

// LiveKit/WebRTC defaults — match the active livekitService config so
// the inactive settings panel and the live session agree at startup.
export const DEFAULT_CALLS_SETTINGS: CallsSettings = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  defaultVideoResolution: 'auto',
};

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  locale: DEFAULT_LOCALE_SETTINGS,
  keyboard: DEFAULT_KEYBOARD_SETTINGS,
  media: DEFAULT_MEDIA_SETTINGS,
  stickersEmoji: DEFAULT_STICKERS_EMOJI_SETTINGS,
  calls: DEFAULT_CALLS_SETTINGS,
};

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
