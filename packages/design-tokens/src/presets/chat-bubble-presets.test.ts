import { describe, expect, it } from 'vitest';

import {
  CHAT_BUBBLE_PRESET_IDS,
  chatBubblePresets,
  chatBubblePresetsById,
  getChatBubblePreset,
  normalizeChatBubbleAnimationId,
  normalizeChatBubbleStyleId,
} from './chat-bubble-presets';

describe('chat bubble preset semantics', () => {
  it('defines every shared preset exactly once', () => {
    const presetIds = chatBubblePresets.map((preset) => preset.id);

    expect(presetIds).toEqual([...CHAT_BUBBLE_PRESET_IDS]);
    expect(new Set(presetIds).size).toBe(presetIds.length);
  });

  it('keeps renderer-neutral metadata on each preset', () => {
    for (const preset of chatBubblePresets) {
      expect(preset.shape).toBeTruthy();
      expect(preset.density).toBeTruthy();
      expect(preset.animationId).toBeTruthy();
      expect(typeof preset.borderRadius).toBe('number');
    }
  });

  it('normalizes legacy web style ids to shared preset ids', () => {
    expect(normalizeChatBubbleStyleId('bubble-default')).toBe('default');
    expect(normalizeChatBubbleStyleId('bubble-glass')).toBe('glass');
    expect(normalizeChatBubbleStyleId('glassmorphism')).toBe('glass');
    expect(normalizeChatBubbleStyleId('3d')).toBe('three-d');
    expect(normalizeChatBubbleStyleId('missing-style')).toBe('default');
  });

  it('normalizes legacy animation ids without leaking CSS class names into semantics', () => {
    expect(normalizeChatBubbleAnimationId('bubble-pill')).toBe('pill');
    expect(normalizeChatBubbleAnimationId('bubble-asymmetric')).toBe('asymmetric');
    expect(normalizeChatBubbleAnimationId('bubble-default')).toBe('rounded');
    expect(normalizeChatBubbleAnimationId('missing-animation')).toBe('default');
  });

  it('provides preset lookup by normalized id', () => {
    expect(chatBubblePresetsById.glass.id).toBe('glass');
    expect(getChatBubblePreset('glassmorphism').id).toBe('glass');
  });
});
