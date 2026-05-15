import type { SelectivePrivacySettings } from './privacy';
import { DEFAULT_SELECTIVE_PRIVACY_SETTINGS } from './privacy';

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
