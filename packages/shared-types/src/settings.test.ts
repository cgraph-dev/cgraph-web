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
});
