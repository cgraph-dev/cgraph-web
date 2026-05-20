/**
 * Settings API Mappers
 *
 * Functions to map between frontend UserSettings and backend API format.
 *
 */

import {
  boolToSelectivePrivacyRule,
  isAutoDownloadPolicy,
  isDateFormat,
  isEmojiSkinTone,
  isFontSize,
  isGroupInvitePermission,
  isMessageDensity,
  isProfileVisibility,
  isTheme,
  isTimeFormat,
  isVideoResolution,
  selectivePrivacyRuleEnabled,
  selectivePrivacySettingsFromApi,
  selectivePrivacySettingsToApi,
} from '@cgraph/shared-types';
import type { ApiSettings, UserSettings } from './settingsStore.types';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_LOCALE_SETTINGS,
  DEFAULT_KEYBOARD_SETTINGS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_STICKERS_EMOJI_SETTINGS,
  DEFAULT_CALLS_SETTINGS,
} from './settingsStore.types';

/**
 */
/**
 * Maps settings from api.
 *
 * @param data - Input data.
 * @returns The result.
 */
export function mapSettingsFromApi(data: ApiSettings): UserSettings {
  const notifications = data.notifications ?? {};
  const privacy = data.privacy ?? {};
  const appearance = data.appearance ?? {};
  const locale = data.locale ?? {};
  const keyboard = data.keyboard ?? {};
  const media = data.media ?? {};
  const stickersEmoji = data.stickers_emoji ?? {};
  const calls = data.calls ?? {};
  const legacySelectivePrivacy = {
    messageRequests: boolToSelectivePrivacyRule(
      privacy.allow_message_requests ??
        data.allow_message_requests ??
        DEFAULT_PRIVACY_SETTINGS.allowMessageRequests
    ),
    phoneNumber: boolToSelectivePrivacyRule(
      privacy.show_phone ?? data.show_phone ?? DEFAULT_PRIVACY_SETTINGS.showPhone
    ),
    calls: boolToSelectivePrivacyRule(
      privacy.allow_calls ?? data.allow_calls ?? DEFAULT_PRIVACY_SETTINGS.allowCalls
    ),
  };
  const selectivePrivacy = selectivePrivacySettingsFromApi(
    privacy.selective_privacy ?? data.selective_privacy,
    legacySelectivePrivacy
  );

  return {
    notifications: {
      emailNotifications:
        notifications.email_enabled ??
        data.email_notifications ??
        DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
      pushNotifications:
        notifications.push_enabled ??
        data.push_notifications ??
        DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
      notifyMessages:
        notifications.message_notifications ??
        data.notify_messages ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyMessages,
      notifyMentions:
        notifications.mention_notifications ??
        data.notify_mentions ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyMentions,
      notifyFriendRequests:
        notifications.friend_request_notifications ??
        data.notify_friend_requests ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyFriendRequests,
      notifyGroupInvites:
        notifications.group_invite_notifications ??
        data.notify_group_invites ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyGroupInvites,
      notifyForumReplies:
        notifications.forum_reply_notifications ??
        data.notify_forum_replies ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyForumReplies,
      notifyEconomy:
        notifications.economy_notifications ??
        data.notify_economy ??
        DEFAULT_NOTIFICATION_SETTINGS.notifyEconomy,
      notifySystem:
        notifications.system_notifications ??
        data.notify_system ??
        DEFAULT_NOTIFICATION_SETTINGS.notifySystem,
      notificationSound:
        notifications.notification_sound ??
        data.notification_sound ??
        DEFAULT_NOTIFICATION_SETTINGS.notificationSound,
      quietHoursEnabled:
        notifications.quiet_hours_enabled ??
        data.quiet_hours_enabled ??
        DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
      quietHoursStart: notifications.quiet_hours_start ?? data.quiet_hours_start ?? null,
      quietHoursEnd: notifications.quiet_hours_end ?? data.quiet_hours_end ?? null,
      dndUntil: notifications.dnd_until ?? data.dnd_until ?? null,
    },
    privacy: {
      showOnlineStatus:
        privacy.online_status_visible ??
        data.show_online_status ??
        DEFAULT_PRIVACY_SETTINGS.showOnlineStatus,
      showReadReceipts:
        privacy.read_receipts_enabled ??
        data.show_read_receipts ??
        DEFAULT_PRIVACY_SETTINGS.showReadReceipts,
      showTypingIndicators:
        privacy.typing_indicators_enabled ??
        data.show_typing_indicators ??
        DEFAULT_PRIVACY_SETTINGS.showTypingIndicators,
      profileVisibility:
        privacy.profile_visibility ??
        data.profile_visibility ??
        DEFAULT_PRIVACY_SETTINGS.profileVisibility,
      allowFriendRequests:
        privacy.allow_friend_requests ??
        data.allow_friend_requests ??
        DEFAULT_PRIVACY_SETTINGS.allowFriendRequests,
      allowMessageRequests: selectivePrivacyRuleEnabled(selectivePrivacy.messageRequests),
      showInSearch:
        privacy.show_in_search ?? data.show_in_search ?? DEFAULT_PRIVACY_SETTINGS.showInSearch,
      allowGroupInvites:
        privacy.allow_group_invites ??
        data.allow_group_invites ??
        DEFAULT_PRIVACY_SETTINGS.allowGroupInvites,
      showBio: privacy.show_bio ?? data.show_bio ?? DEFAULT_PRIVACY_SETTINGS.showBio,
      showPostCount:
        privacy.show_post_count ?? data.show_post_count ?? DEFAULT_PRIVACY_SETTINGS.showPostCount,
      showJoinDate:
        privacy.show_join_date ?? data.show_join_date ?? DEFAULT_PRIVACY_SETTINGS.showJoinDate,
      showLastActive:
        privacy.show_last_active ??
        data.show_last_active ??
        DEFAULT_PRIVACY_SETTINGS.showLastActive,
      showSocialLinks:
        privacy.show_social_links ??
        data.show_social_links ??
        DEFAULT_PRIVACY_SETTINGS.showSocialLinks,
      showActivity:
        privacy.show_activity ?? data.show_activity ?? DEFAULT_PRIVACY_SETTINGS.showActivity,
      showInMemberList:
        privacy.show_in_member_list ??
        data.show_in_member_list ??
        DEFAULT_PRIVACY_SETTINGS.showInMemberList,
      showPhone: selectivePrivacyRuleEnabled(selectivePrivacy.phoneNumber),
      showForwardedFrom:
        privacy.show_forwarded_from ??
        data.show_forwarded_from ??
        DEFAULT_PRIVACY_SETTINGS.showForwardedFrom,
      allowCalls: selectivePrivacyRuleEnabled(selectivePrivacy.calls),
      autoDeleteDefault:
        privacy.auto_delete_default ??
        data.auto_delete_default ??
        DEFAULT_PRIVACY_SETTINGS.autoDeleteDefault,
      selectivePrivacy,
    },
    appearance: {
      theme: appearance.theme ?? data.theme ?? DEFAULT_APPEARANCE_SETTINGS.theme,
      compactMode:
        appearance.compact_mode ?? data.compact_mode ?? DEFAULT_APPEARANCE_SETTINGS.compactMode,
      fontSize: appearance.font_size ?? data.font_size ?? DEFAULT_APPEARANCE_SETTINGS.fontSize,
      messageDensity:
        appearance.message_density ??
        data.message_density ??
        DEFAULT_APPEARANCE_SETTINGS.messageDensity,
      showAvatars:
        appearance.show_avatars ?? data.show_avatars ?? DEFAULT_APPEARANCE_SETTINGS.showAvatars,
      animateEmojis:
        appearance.animate_emojis ??
        data.animate_emojis ??
        DEFAULT_APPEARANCE_SETTINGS.animateEmojis,
      reduceMotion:
        appearance.reduce_motion ?? data.reduce_motion ?? DEFAULT_APPEARANCE_SETTINGS.reduceMotion,
      highContrast:
        appearance.high_contrast ?? data.high_contrast ?? DEFAULT_APPEARANCE_SETTINGS.highContrast,
      screenReaderOptimized:
        appearance.screen_reader_optimized ??
        data.screen_reader_optimized ??
        DEFAULT_APPEARANCE_SETTINGS.screenReaderOptimized,
    },
    locale: {
      language: locale.language ?? data.language ?? DEFAULT_LOCALE_SETTINGS.language,
      timezone: locale.timezone ?? data.timezone ?? DEFAULT_LOCALE_SETTINGS.timezone,
      dateFormat: locale.date_format ?? data.date_format ?? DEFAULT_LOCALE_SETTINGS.dateFormat,
      timeFormat: locale.time_format ?? data.time_format ?? DEFAULT_LOCALE_SETTINGS.timeFormat,
    },
    keyboard: {
      keyboardShortcutsEnabled:
        keyboard.keyboard_shortcuts_enabled ??
        data.keyboard_shortcuts_enabled ??
        DEFAULT_KEYBOARD_SETTINGS.keyboardShortcutsEnabled,
      customShortcuts:
        keyboard.custom_shortcuts ??
        data.custom_shortcuts ??
        DEFAULT_KEYBOARD_SETTINGS.customShortcuts,
    },
    media: {
      autoDownloadPhotos:
        media.auto_download_photos ??
        data.auto_download_photos ??
        DEFAULT_MEDIA_SETTINGS.autoDownloadPhotos,
      autoDownloadVideos:
        media.auto_download_videos ??
        data.auto_download_videos ??
        DEFAULT_MEDIA_SETTINGS.autoDownloadVideos,
      autoDownloadFiles:
        media.auto_download_files ??
        data.auto_download_files ??
        DEFAULT_MEDIA_SETTINGS.autoDownloadFiles,
      dataSaverMode:
        media.data_saver_mode ?? data.data_saver_mode ?? DEFAULT_MEDIA_SETTINGS.dataSaverMode,
    },
    stickersEmoji: {
      suggestStickers:
        stickersEmoji.suggest_stickers ??
        data.suggest_stickers ??
        DEFAULT_STICKERS_EMOJI_SETTINGS.suggestStickers,
      loopAnimatedStickers:
        stickersEmoji.loop_animated_stickers ??
        data.loop_animated_stickers ??
        DEFAULT_STICKERS_EMOJI_SETTINGS.loopAnimatedStickers,
      defaultSkinTone:
        stickersEmoji.default_skin_tone ??
        data.default_skin_tone ??
        DEFAULT_STICKERS_EMOJI_SETTINGS.defaultSkinTone,
      installedPackIds:
        stickersEmoji.installed_sticker_pack_ids ??
        data.installed_sticker_pack_ids ??
        DEFAULT_STICKERS_EMOJI_SETTINGS.installedPackIds,
    },
    calls: {
      echoCancellation:
        calls.echo_cancellation ??
        data.echo_cancellation ??
        DEFAULT_CALLS_SETTINGS.echoCancellation,
      noiseSuppression:
        calls.noise_suppression ??
        data.noise_suppression ??
        DEFAULT_CALLS_SETTINGS.noiseSuppression,
      autoGainControl:
        calls.auto_gain_control ?? data.auto_gain_control ?? DEFAULT_CALLS_SETTINGS.autoGainControl,
      defaultVideoResolution:
        calls.default_video_resolution ??
        data.default_video_resolution ??
        DEFAULT_CALLS_SETTINGS.defaultVideoResolution,
    },
  };
}

/**
 */
/**
 * Maps settings to api.
 *
 * @param settings - The settings.
 * @returns The result.
 */
export function mapSettingsToApi(settings: Partial<UserSettings>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (settings.notifications) {
    const n = settings.notifications;
    if (n.emailNotifications !== undefined) result.email_notifications = n.emailNotifications;
    if (n.pushNotifications !== undefined) result.push_notifications = n.pushNotifications;
    if (n.notifyMessages !== undefined) result.notify_messages = n.notifyMessages;
    if (n.notifyMentions !== undefined) result.notify_mentions = n.notifyMentions;
    if (n.notifyFriendRequests !== undefined)
      result.notify_friend_requests = n.notifyFriendRequests;
    if (n.notifyGroupInvites !== undefined) result.notify_group_invites = n.notifyGroupInvites;
    if (n.notifyForumReplies !== undefined) result.notify_forum_replies = n.notifyForumReplies;
    if (n.notifyEconomy !== undefined) result.notify_economy = n.notifyEconomy;
    if (n.notifySystem !== undefined) result.notify_system = n.notifySystem;
    if (n.notificationSound !== undefined) result.notification_sound = n.notificationSound;
    if (n.quietHoursEnabled !== undefined) result.quiet_hours_enabled = n.quietHoursEnabled;
    if (n.quietHoursStart !== undefined) result.quiet_hours_start = n.quietHoursStart;
    if (n.quietHoursEnd !== undefined) result.quiet_hours_end = n.quietHoursEnd;
    if (n.dndUntil !== undefined) result.dnd_until = n.dndUntil;
  }

  if (settings.privacy) {
    const p = settings.privacy;
    if (p.showOnlineStatus !== undefined) result.show_online_status = p.showOnlineStatus;
    if (p.showReadReceipts !== undefined) result.show_read_receipts = p.showReadReceipts;
    if (p.showTypingIndicators !== undefined)
      result.show_typing_indicators = p.showTypingIndicators;
    if (p.profileVisibility !== undefined) result.profile_visibility = p.profileVisibility;
    if (p.allowFriendRequests !== undefined) result.allow_friend_requests = p.allowFriendRequests;
    if (p.allowMessageRequests !== undefined)
      result.allow_message_requests = p.allowMessageRequests;
    if (p.showInSearch !== undefined) result.show_in_search = p.showInSearch;
    if (p.allowGroupInvites !== undefined) result.allow_group_invites = p.allowGroupInvites;
    if (p.showBio !== undefined) result.show_bio = p.showBio;
    if (p.showPostCount !== undefined) result.show_post_count = p.showPostCount;
    if (p.showJoinDate !== undefined) result.show_join_date = p.showJoinDate;
    if (p.showLastActive !== undefined) result.show_last_active = p.showLastActive;
    if (p.showSocialLinks !== undefined) result.show_social_links = p.showSocialLinks;
    if (p.showActivity !== undefined) result.show_activity = p.showActivity;
    if (p.showInMemberList !== undefined) result.show_in_member_list = p.showInMemberList;
    if (p.showPhone !== undefined) result.show_phone = p.showPhone;
    if (p.showForwardedFrom !== undefined) result.show_forwarded_from = p.showForwardedFrom;
    if (p.allowCalls !== undefined) result.allow_calls = p.allowCalls;
    if (p.autoDeleteDefault !== undefined) result.auto_delete_default = p.autoDeleteDefault;
    if (p.selectivePrivacy !== undefined) {
      result.selective_privacy = selectivePrivacySettingsToApi(p.selectivePrivacy);
      result.allow_message_requests = selectivePrivacyRuleEnabled(
        p.selectivePrivacy.messageRequests
      );
      result.show_phone = selectivePrivacyRuleEnabled(p.selectivePrivacy.phoneNumber);
      result.allow_calls = selectivePrivacyRuleEnabled(p.selectivePrivacy.calls);
    }
  }

  if (settings.appearance) {
    const a = settings.appearance;
    if (a.theme !== undefined) result.theme = a.theme;
    if (a.compactMode !== undefined) result.compact_mode = a.compactMode;
    if (a.fontSize !== undefined) result.font_size = a.fontSize;
    if (a.messageDensity !== undefined) result.message_density = a.messageDensity;
    if (a.showAvatars !== undefined) result.show_avatars = a.showAvatars;
    if (a.animateEmojis !== undefined) result.animate_emojis = a.animateEmojis;
    if (a.reduceMotion !== undefined) result.reduce_motion = a.reduceMotion;
    if (a.highContrast !== undefined) result.high_contrast = a.highContrast;
    if (a.screenReaderOptimized !== undefined)
      result.screen_reader_optimized = a.screenReaderOptimized;
  }

  if (settings.locale) {
    const l = settings.locale;
    if (l.language !== undefined) result.language = l.language;
    if (l.timezone !== undefined) result.timezone = l.timezone;
    if (l.dateFormat !== undefined) result.date_format = l.dateFormat;
    if (l.timeFormat !== undefined) result.time_format = l.timeFormat;
  }

  if (settings.keyboard) {
    const k = settings.keyboard;
    if (k.keyboardShortcutsEnabled !== undefined)
      result.keyboard_shortcuts_enabled = k.keyboardShortcutsEnabled;
    if (k.customShortcuts !== undefined) result.custom_shortcuts = k.customShortcuts;
  }

  if (settings.media) {
    const m = settings.media;
    if (m.autoDownloadPhotos !== undefined) result.auto_download_photos = m.autoDownloadPhotos;
    if (m.autoDownloadVideos !== undefined) result.auto_download_videos = m.autoDownloadVideos;
    if (m.autoDownloadFiles !== undefined) result.auto_download_files = m.autoDownloadFiles;
    if (m.dataSaverMode !== undefined) result.data_saver_mode = m.dataSaverMode;
  }

  if (settings.stickersEmoji) {
    const s = settings.stickersEmoji;
    if (s.suggestStickers !== undefined) result.suggest_stickers = s.suggestStickers;
    if (s.loopAnimatedStickers !== undefined)
      result.loop_animated_stickers = s.loopAnimatedStickers;
    if (s.defaultSkinTone !== undefined) result.default_skin_tone = s.defaultSkinTone;
    if (s.installedPackIds !== undefined) result.installed_sticker_pack_ids = s.installedPackIds;
  }

  if (settings.calls) {
    const c = settings.calls;
    if (c.echoCancellation !== undefined) result.echo_cancellation = c.echoCancellation;
    if (c.noiseSuppression !== undefined) result.noise_suppression = c.noiseSuppression;
    if (c.autoGainControl !== undefined) result.auto_gain_control = c.autoGainControl;
    if (c.defaultVideoResolution !== undefined)
      result.default_video_resolution = c.defaultVideoResolution;
  }

  return result;
}

/**
 * Narrow a raw `Record<string, unknown>` WebSocket payload into a typed
 * `ApiSettings` object. Only copies known snake_case keys whose values pass
 * a type guard. This allows `mergeSettingsFromSync` to pass WebSocket
 * payloads directly to `mapSettingsFromApi` without any type assertions.
 */
export function narrowToApiSettings(raw: Record<string, unknown>): ApiSettings {
  const bool = (key: string): boolean | undefined => {
    const v = raw[key];
    return typeof v === 'boolean' ? v : undefined;
  };

  const str = (key: string): string | null | undefined => {
    const v = raw[key];
    if (typeof v === 'string') return v;
    if (v === null) return null;
    return undefined;
  };

  const profileVisibility = raw['profile_visibility'];
  const groupInvitePermission = raw['allow_group_invites'];
  const theme = raw['theme'];
  const fontSize = raw['font_size'];
  const messageDensity = raw['message_density'];
  const dateFormat = raw['date_format'];
  const timeFormat = raw['time_format'];
  const autoDownloadPhotos = raw['auto_download_photos'];
  const autoDownloadVideos = raw['auto_download_videos'];
  const autoDownloadFiles = raw['auto_download_files'];
  const defaultSkinTone = raw['default_skin_tone'];
  const defaultVideoResolution = raw['default_video_resolution'];
  const selectivePrivacy = raw['selective_privacy'];

  return {
    // Notifications
    email_notifications: bool('email_notifications'),
    push_notifications: bool('push_notifications'),
    notify_messages: bool('notify_messages'),
    notify_mentions: bool('notify_mentions'),
    notify_friend_requests: bool('notify_friend_requests'),
    notify_group_invites: bool('notify_group_invites'),
    notify_forum_replies: bool('notify_forum_replies'),
    notify_economy: bool('notify_economy'),
    notify_system: bool('notify_system'),
    notification_sound: bool('notification_sound'),
    quiet_hours_enabled: bool('quiet_hours_enabled'),
    quiet_hours_start: str('quiet_hours_start'),
    quiet_hours_end: str('quiet_hours_end'),
    dnd_until: str('dnd_until'),
    // Privacy
    show_online_status: bool('show_online_status'),
    show_read_receipts: bool('show_read_receipts'),
    show_typing_indicators: bool('show_typing_indicators'),
    profile_visibility: isProfileVisibility(profileVisibility) ? profileVisibility : undefined,
    allow_friend_requests: bool('allow_friend_requests'),
    allow_message_requests: bool('allow_message_requests'),
    show_in_search: bool('show_in_search'),
    allow_group_invites: isGroupInvitePermission(groupInvitePermission)
      ? groupInvitePermission
      : undefined,
    show_bio: bool('show_bio'),
    show_post_count: bool('show_post_count'),
    show_join_date: bool('show_join_date'),
    show_last_active: bool('show_last_active'),
    show_social_links: bool('show_social_links'),
    show_activity: bool('show_activity'),
    show_in_member_list: bool('show_in_member_list'),
    show_phone: bool('show_phone'),
    show_forwarded_from: bool('show_forwarded_from'),
    allow_calls: bool('allow_calls'),
    selective_privacy:
      typeof selectivePrivacy === 'object' &&
      selectivePrivacy !== null &&
      !Array.isArray(selectivePrivacy)
        ? selectivePrivacySettingsToApi(selectivePrivacySettingsFromApi(selectivePrivacy))
        : undefined,
    // Appearance
    theme: isTheme(theme) ? theme : undefined,
    compact_mode: bool('compact_mode'),
    font_size: isFontSize(fontSize) ? fontSize : undefined,
    message_density: isMessageDensity(messageDensity) ? messageDensity : undefined,
    show_avatars: bool('show_avatars'),
    animate_emojis: bool('animate_emojis'),
    reduce_motion: bool('reduce_motion'),
    high_contrast: bool('high_contrast'),
    screen_reader_optimized: bool('screen_reader_optimized'),
    // Locale
    language: str('language') ?? undefined,
    timezone: str('timezone') ?? undefined,
    date_format: isDateFormat(dateFormat) ? dateFormat : undefined,
    time_format: isTimeFormat(timeFormat) ? timeFormat : undefined,
    // Keyboard
    keyboard_shortcuts_enabled: bool('keyboard_shortcuts_enabled'),
    // Media
    auto_download_photos: isAutoDownloadPolicy(autoDownloadPhotos) ? autoDownloadPhotos : undefined,
    auto_download_videos: isAutoDownloadPolicy(autoDownloadVideos) ? autoDownloadVideos : undefined,
    auto_download_files: isAutoDownloadPolicy(autoDownloadFiles) ? autoDownloadFiles : undefined,
    data_saver_mode: bool('data_saver_mode'),
    // Stickers / Emoji
    suggest_stickers: bool('suggest_stickers'),
    loop_animated_stickers: bool('loop_animated_stickers'),
    default_skin_tone: isEmojiSkinTone(defaultSkinTone) ? defaultSkinTone : undefined,
    // Calls
    echo_cancellation: bool('echo_cancellation'),
    noise_suppression: bool('noise_suppression'),
    auto_gain_control: bool('auto_gain_control'),
    default_video_resolution: isVideoResolution(defaultVideoResolution)
      ? defaultVideoResolution
      : undefined,
  };
}
