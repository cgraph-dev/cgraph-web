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

  it('keeps foreground contrast with the selected swatch', () => {
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
