import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALLS_SETTINGS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_STICKERS_EMOJI_SETTINGS,
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
});
