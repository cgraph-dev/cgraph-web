import { describe, expect, it } from 'vitest';
import {
  CHAT_THEME_CONVERSATION_COLORS,
} from '@cgraph-dev/shared-types/chat-theme';

import {
  CONVERSATION_COLOR_PALETTE,
  getConversationColorSwatch,
} from './conversation-color-palette';

describe('conversation color palette', () => {
  it('provides one CGraph-owned swatch for every shared semantic color id', () => {
    expect(Object.keys(CONVERSATION_COLOR_PALETTE)).toEqual(CHAT_THEME_CONVERSATION_COLORS);
  });

  it('keeps every selected foreground at AA text contrast', () => {
    for (const { background, foreground } of Object.values(CONVERSATION_COLOR_PALETTE)) {
      expect(contrastRatio(background, foreground)).toBeGreaterThanOrEqual(4.5);
    }

    expect(getConversationColorSwatch('ultramarine')).toEqual({
      background: '#3f51b5',
      foreground: '#ffffff',
    });
    expect(getConversationColorSwatch('tangerine')).toEqual({
      background: '#e7852a',
      foreground: '#111827',
    });
  });
});

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: string): number {
  const channels = color
    .slice(1)
    .match(/../g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
