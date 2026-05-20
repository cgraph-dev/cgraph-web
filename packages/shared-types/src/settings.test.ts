import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALLS_SETTINGS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_STICKERS_EMOJI_SETTINGS,
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
  narrowApiSettings,
  settingsFromApi,
  settingsToApi,
} from './settings';

describe('settings contract', () => {
  it('keeps shared defaults aligned across all settings sections', () => {
    expect(DEFAULT_SETTINGS.media).toBe(DEFAULT_MEDIA_SETTINGS);
    expect(DEFAULT_SETTINGS.stickersEmoji).toBe(DEFAULT_STICKERS_EMOJI_SETTINGS);
    expect(DEFAULT_SETTINGS.calls).toBe(DEFAULT_CALLS_SETTINGS);
    expect(DEFAULT_SETTINGS.privacy).toBe(DEFAULT_PRIVACY_SETTINGS);
  });

  it('keeps runtime-neutral media and call defaults explicit', () => {
    expect(DEFAULT_MEDIA_SETTINGS).toMatchObject({
      autoDownloadPhotos: 'always',
      autoDownloadVideos: 'wifi',
      autoDownloadFiles: 'never',
      dataSaverMode: false,
    });
    expect(DEFAULT_CALLS_SETTINGS.defaultVideoResolution).toBe('auto');
  });

  it('owns settings enum guards for API payload narrowing', () => {
    expect(isProfileVisibility('public')).toBe(true);
    expect(isGroupInvitePermission('friends')).toBe(true);
    expect(isTheme('system')).toBe(true);
    expect(isFontSize('large')).toBe(true);
    expect(isMessageDensity('compact')).toBe(true);
    expect(isDateFormat('ymd')).toBe(true);
    expect(isTimeFormat('twenty_four_hour')).toBe(true);
    expect(isAutoDownloadPolicy('wifi')).toBe(true);
    expect(isEmojiSkinTone('medium-dark')).toBe(true);
    expect(isVideoResolution('1080p')).toBe(true);

    expect(isProfileVisibility('everyone')).toBe(false);
    expect(isTheme('midnight')).toBe(false);
    expect(isVideoResolution(1080)).toBe(false);
  });

  it('maps backend settings into shared client settings with selective privacy fallbacks', () => {
    const result = settingsFromApi({
      notifications: {
        email_enabled: false,
      },
      privacy: {
        allow_message_requests: false,
        show_phone: true,
        allow_calls: true,
        selective_privacy: {
          message_requests: {
            mode: 'contacts',
            always_allow_user_ids: ['user-1'],
            never_allow_user_ids: [],
          },
          phone_number: {
            mode: 'nobody',
            always_allow_user_ids: ['user-2'],
            never_allow_user_ids: [],
          },
          calls: {
            mode: 'everyone',
            always_allow_user_ids: [],
            never_allow_user_ids: ['user-3'],
          },
        },
      },
      appearance: {
        theme: 'dark',
      },
      media: {
        auto_download_videos: 'never',
      },
    });

    expect(result.notifications.emailNotifications).toBe(false);
    expect(result.privacy.allowMessageRequests).toBe(true);
    expect(result.privacy.showPhone).toBe(true);
    expect(result.privacy.allowCalls).toBe(true);
    expect(result.privacy.selectivePrivacy.messageRequests.mode).toBe('contacts');
    expect(result.privacy.selectivePrivacy.phoneNumber.alwaysAllowUserIds).toEqual(['user-2']);
    expect(result.appearance.theme).toBe('dark');
    expect(result.media.autoDownloadVideos).toBe('never');
  });

  it('maps shared client settings into backend settings payloads', () => {
    const result = settingsToApi({
      privacy: {
        ...DEFAULT_PRIVACY_SETTINGS,
        selectivePrivacy: {
          ...DEFAULT_PRIVACY_SETTINGS.selectivePrivacy,
          phoneNumber: {
            mode: 'nobody',
            alwaysAllowUserIds: ['user-4'],
            neverAllowUserIds: [],
          },
        },
      },
      calls: {
        ...DEFAULT_CALLS_SETTINGS,
        defaultVideoResolution: '1080p',
      },
    });

    expect(result.show_phone).toBe(true);
    expect(result.allow_calls).toBe(true);
    expect(result.selective_privacy).toMatchObject({
      phone_number: {
        mode: 'nobody',
        always_allow_user_ids: ['user-4'],
      },
    });
    expect(result.default_video_resolution).toBe('1080p');
  });

  it('narrows realtime settings payloads to known valid API keys', () => {
    const result = narrowApiSettings({
      theme: 'system',
      font_size: 'giant',
      profile_visibility: 'friends',
      allow_group_invites: 'robots',
      email_notifications: true,
      custom_shortcuts: { ignored: true },
      selective_privacy: {
        phone_number: {
          mode: 'nobody',
          alwaysAllowUserIds: ['user-5'],
          neverAllowUserIds: [],
        },
      },
      default_video_resolution: '720p',
    });

    expect(result.theme).toBe('system');
    expect(result.font_size).toBeUndefined();
    expect(result.profile_visibility).toBe('friends');
    expect(result.allow_group_invites).toBeUndefined();
    expect(result.email_notifications).toBe(true);
    expect(result.custom_shortcuts).toBeUndefined();
    expect(result.selective_privacy?.phone_number.always_allow_user_ids).toEqual(['user-5']);
    expect(result.default_video_resolution).toBe('720p');
  });
});
