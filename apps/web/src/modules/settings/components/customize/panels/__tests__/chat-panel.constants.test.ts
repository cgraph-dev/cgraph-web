import { describe, expect, it } from 'vitest';
import { CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS } from '@cgraph-dev/shared-types';

import { bubbleAnimations } from '../chat-panel.constants';

describe('chat panel constants', () => {
  it('uses the shared package entrance animation set', () => {
    expect(bubbleAnimations.map((animation) => animation.id)).toEqual(
      CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS
    );
    expect(bubbleAnimations.map((animation) => animation.id)).toEqual([
      'none',
      'slide',
      'fade',
      'scale',
      'bounce',
      'flip',
    ]);
  });
});
