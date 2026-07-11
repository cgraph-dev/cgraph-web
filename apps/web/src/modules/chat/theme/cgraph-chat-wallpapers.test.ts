import { describe, expect, it } from 'vitest';

import {
  CGRAPH_CHAT_WALLPAPERS,
  DEFAULT_CGRAPH_CHAT_WALLPAPER,
  getCGraphChatWallpaper,
  getCGraphChatWallpaperStyle,
} from './cgraph-chat-wallpapers';

describe('CGraph chat wallpapers', () => {
  it('keeps an original built-in catalog with unique persisted color tuples', () => {
    const signatures = CGRAPH_CHAT_WALLPAPERS.map(({ wallpaper }) =>
      [
        wallpaper.intensity,
        wallpaper.backgroundColor,
        wallpaper.secondBackgroundColor,
        wallpaper.thirdBackgroundColor,
        wallpaper.fourthBackgroundColor,
        wallpaper.dark,
      ].join(':'),
    );

    expect(new Set(signatures)).toHaveLength(CGRAPH_CHAT_WALLPAPERS.length);
    expect(getCGraphChatWallpaper(DEFAULT_CGRAPH_CHAT_WALLPAPER)?.id).toBe(
      'lattice',
    );
  });

  it('renders a deterministic pattern for a selected built-in wallpaper', () => {
    const style = getCGraphChatWallpaperStyle(
      CGRAPH_CHAT_WALLPAPERS[1].wallpaper,
    );

    expect(style).toMatchObject({
      backgroundColor: '#e2f1eb',
      backgroundImage: expect.stringContaining('repeating-radial-gradient'),
    });
  });

  it('leaves unknown or legacy tuples to the gradient fallback', () => {
    expect(
      getCGraphChatWallpaperStyle({
        intensity: 50,
        backgroundColor: 0xdbddbb,
        secondBackgroundColor: 0x6ba587,
        thirdBackgroundColor: 0xd5d88d,
        fourthBackgroundColor: 0x88b884,
        dark: false,
      }),
    ).toBeUndefined();
  });
});
