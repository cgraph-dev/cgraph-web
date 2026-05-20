import type { SelectivePrivacySettings, SelectivePrivacySettingsApi } from './privacy';
import { DEFAULT_SELECTIVE_PRIVACY_SETTINGS } from './privacy';

export const PROFILE_VISIBILITY_VALUES = ['public', 'friends', 'private'] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY_VALUES)[number];

export const GROUP_INVITE_PERMISSION_VALUES = ['anyone', 'friends', 'nobody'] as const;
export type GroupInvitePermission = (typeof GROUP_INVITE_PERMISSION_VALUES)[number];

export const THEME_VALUES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEME_VALUES)[number];

export const FONT_SIZE_VALUES = ['small', 'medium', 'large'] as const;
export type FontSize = (typeof FONT_SIZE_VALUES)[number];

export const MESSAGE_DENSITY_VALUES = ['comfortable', 'compact'] as const;
export type MessageDensity = (typeof MESSAGE_DENSITY_VALUES)[number];

export const DATE_FORMAT_VALUES = ['mdy', 'dmy', 'ymd'] as const;
export type DateFormat = (typeof DATE_FORMAT_VALUES)[number];

export const TIME_FORMAT_VALUES = ['twelve_hour', 'twenty_four_hour'] as const;
export type TimeFormat = (typeof TIME_FORMAT_VALUES)[number];

export const AUTO_DOWNLOAD_POLICY_VALUES = ['always', 'wifi', 'never'] as const;
export type AutoDownloadPolicy = (typeof AUTO_DOWNLOAD_POLICY_VALUES)[number];

export const EMOJI_SKIN_TONE_VALUES = [
  'neutral',
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
] as const;
export type EmojiSkinTone =
  (typeof EMOJI_SKIN_TONE_VALUES)[number];

export const VIDEO_RESOLUTION_VALUES = ['auto', '720p', '1080p'] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTION_VALUES)[number];

export interface MediaSettings {
  autoDownloadPhotos: AutoDownloadPolicy;
  autoDownloadVideos: AutoDownloadPolicy;
  autoDownloadFiles: AutoDownloadPolicy;
  dataSaverMode: boolean;
}

export interface StickersEmojiSettings {
  suggestStickers: boolean;
  loopAnimatedStickers: boolean;
  defaultSkinTone: EmojiSkinTone;
  installedPackIds: readonly string[];
}

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
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  dndUntil: string | null;
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
  selectivePrivacy: SelectivePrivacySettings;
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

export interface ApiNotificationSettings {
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
}

export interface ApiPrivacySettings {
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
  selective_privacy?: SelectivePrivacySettingsApi;
}

export interface ApiAppearanceSettings {
  theme?: Theme;
  compact_mode?: boolean;
  font_size?: FontSize;
  message_density?: MessageDensity;
  show_avatars?: boolean;
  animate_emojis?: boolean;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  screen_reader_optimized?: boolean;
}

export interface ApiLocaleSettings {
  language?: string;
  timezone?: string;
  date_format?: DateFormat;
  time_format?: TimeFormat;
}

export interface ApiKeyboardSettings {
  keyboard_shortcuts_enabled?: boolean;
  custom_shortcuts?: Record<string, string>;
}

export interface ApiMediaSettings {
  auto_download_photos?: AutoDownloadPolicy;
  auto_download_videos?: AutoDownloadPolicy;
  auto_download_files?: AutoDownloadPolicy;
  data_saver_mode?: boolean;
}

export interface ApiStickersEmojiSettings {
  suggest_stickers?: boolean;
  loop_animated_stickers?: boolean;
  default_skin_tone?: EmojiSkinTone;
  installed_sticker_pack_ids?: readonly string[];
}

export interface ApiCallsSettings {
  echo_cancellation?: boolean;
  noise_suppression?: boolean;
  auto_gain_control?: boolean;
  default_video_resolution?: VideoResolution;
}

export interface ApiSettings {
  notifications?: ApiNotificationSettings;
  privacy?: ApiPrivacySettings;
  appearance?: ApiAppearanceSettings;
  locale?: ApiLocaleSettings;
  keyboard?: ApiKeyboardSettings;
  media?: ApiMediaSettings;
  stickers_emoji?: ApiStickersEmojiSettings;
  calls?: ApiCallsSettings;

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
  selective_privacy?: SelectivePrivacySettingsApi;

  theme?: Theme;
  compact_mode?: boolean;
  font_size?: FontSize;
  message_density?: MessageDensity;
  show_avatars?: boolean;
  animate_emojis?: boolean;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  screen_reader_optimized?: boolean;

  language?: string;
  timezone?: string;
  date_format?: DateFormat;
  time_format?: TimeFormat;

  keyboard_shortcuts_enabled?: boolean;
  custom_shortcuts?: Record<string, string>;

  auto_download_photos?: AutoDownloadPolicy;
  auto_download_videos?: AutoDownloadPolicy;
  auto_download_files?: AutoDownloadPolicy;
  data_saver_mode?: boolean;

  suggest_stickers?: boolean;
  loop_animated_stickers?: boolean;
  default_skin_tone?: EmojiSkinTone;
  installed_sticker_pack_ids?: readonly string[];

  echo_cancellation?: boolean;
  noise_suppression?: boolean;
  auto_gain_control?: boolean;
  default_video_resolution?: VideoResolution;
}

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
  selectivePrivacy: DEFAULT_SELECTIVE_PRIVACY_SETTINGS,
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
  timezone: resolveDefaultTimezone(),
  dateFormat: 'mdy',
  timeFormat: 'twelve_hour',
};

export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  keyboardShortcutsEnabled: true,
  customShortcuts: {},
};

export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  autoDownloadPhotos: 'always',
  autoDownloadVideos: 'wifi',
  autoDownloadFiles: 'never',
  dataSaverMode: false,
};

export const DEFAULT_STICKERS_EMOJI_SETTINGS: StickersEmojiSettings = {
  suggestStickers: true,
  loopAnimatedStickers: true,
  defaultSkinTone: 'neutral',
  installedPackIds: [],
};

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

function resolveDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Returns whether a value is a valid profile visibility preference. */
export function isProfileVisibility(value: unknown): value is ProfileVisibility {
  return includesValue(PROFILE_VISIBILITY_VALUES, value);
}

/** Returns whether a value is a valid group invite permission. */
export function isGroupInvitePermission(value: unknown): value is GroupInvitePermission {
  return includesValue(GROUP_INVITE_PERMISSION_VALUES, value);
}

/** Returns whether a value is a valid app theme preference. */
export function isTheme(value: unknown): value is Theme {
  return includesValue(THEME_VALUES, value);
}

/** Returns whether a value is a valid font size preference. */
export function isFontSize(value: unknown): value is FontSize {
  return includesValue(FONT_SIZE_VALUES, value);
}

/** Returns whether a value is a valid message density preference. */
export function isMessageDensity(value: unknown): value is MessageDensity {
  return includesValue(MESSAGE_DENSITY_VALUES, value);
}

/** Returns whether a value is a valid date format preference. */
export function isDateFormat(value: unknown): value is DateFormat {
  return includesValue(DATE_FORMAT_VALUES, value);
}

/** Returns whether a value is a valid time format preference. */
export function isTimeFormat(value: unknown): value is TimeFormat {
  return includesValue(TIME_FORMAT_VALUES, value);
}

/** Returns whether a value is a valid media auto-download policy. */
export function isAutoDownloadPolicy(value: unknown): value is AutoDownloadPolicy {
  return includesValue(AUTO_DOWNLOAD_POLICY_VALUES, value);
}

/** Returns whether a value is a valid emoji skin tone preference. */
export function isEmojiSkinTone(value: unknown): value is EmojiSkinTone {
  return includesValue(EMOJI_SKIN_TONE_VALUES, value);
}

/** Returns whether a value is a valid video resolution preference. */
export function isVideoResolution(value: unknown): value is VideoResolution {
  return includesValue(VIDEO_RESOLUTION_VALUES, value);
}

function includesValue<const T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}
