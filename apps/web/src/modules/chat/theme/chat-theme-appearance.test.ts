import { describe, expect, it } from 'vitest';

import { chatThemeSettingsToAppearance } from './chat-theme-appearance';
import { CGRAPH_CHAT_WALLPAPERS } from './cgraph-chat-wallpapers';

describe('chat theme appearance', () => {
  it('uses the persisted T3G theme bundle for the live surface and bubbles', () => {
    const appearance = chatThemeSettingsToAppearance({
      base: 'tinted',
      presetId: 'preset:10',
      accentColor: 0x0088ff,
      messageColors: [0x517893, 0x285c96],
      wallpaper: {
        intensity: 40,
        backgroundColor: 0x1e3557,
        secondBackgroundColor: 0x182036,
        thirdBackgroundColor: 0x1c4352,
        fourthBackgroundColor: 0x16263a,
        dark: true,
      },
    });

    expect(appearance).toMatchObject({
      base: 'tinted',
      presetId: 'preset:10',
      conversationColor: 'ultramarine',
      ownBackground: 'linear-gradient(135deg, #517893, #285c96)',
      previewBackground: 'linear-gradient(145deg, #1e3557, #182036, #1c4352, #16263a)',
      outgoingBubbleStyle: {
        background: 'linear-gradient(135deg, #517893, #285c96)',
        color: '#f8fafc',
      },
      incomingBubbleStyle: {
        background: 'rgba(255, 255, 255, 0.12)',
        color: '#f8fafc',
      },
    });
    expect(appearance.surfaceStyle).toEqual({
      background: 'linear-gradient(145deg, #1e3557, #182036, #1c4352, #16263a)',
    });
  });

  it('resolves a per-conversation S1G custom color before the global default', () => {
    const appearance = chatThemeSettingsToAppearance(
      {
        base: 'classic',
        accentColor: 0x3390ec,
        messageColors: [0x5ca853],
      },
      {
        conversationColor: 'custom',
        customColor: {
          start: { hue: 90, saturation: 100 },
          end: { hue: 180, saturation: 50 },
          deg: 270,
        },
      },
      {
        color: 'custom',
        customColorData: {
          id: 'global-custom',
          value: { start: { hue: 300, saturation: 50 } },
        },
      },
    );

    expect(appearance.conversationColor).toBe('custom');
    expect(appearance.outgoingBubbleStyle).toEqual({
      backgroundImage: 'linear-gradient(0deg, hsl(90, 100%, 30%), hsl(180, 50%, 30%))',
      color: '#ffffff',
    });
  });

  it('uses an explicit CGraph conversation color over the T3G baseline bundle', () => {
    const appearance = chatThemeSettingsToAppearance(
      {
        base: 'day',
        accentColor: 0x0088ff,
        messageColors: [0x0088ff, 0xff53f4],
      },
      { conversationColor: 'crimson' },
    );

    expect(appearance.outgoingBubbleStyle).toEqual({
      background: '#d61f45',
      color: '#ffffff',
    });
  });

  it('renders the selected CGraph wallpaper pattern on the live surface', () => {
    const appearance = chatThemeSettingsToAppearance({
      base: 'classic',
      accentColor: 0x3390ec,
      messageColors: [0x5ca853],
      wallpaper: CGRAPH_CHAT_WALLPAPERS[0].wallpaper,
    });

    expect(appearance.surfaceStyle).toMatchObject({
      backgroundColor: '#e5f1fa',
      backgroundImage: expect.stringContaining('linear-gradient'),
      backgroundSize: '100% 100%, 28px 28px, 28px 28px',
    });
  });
});
