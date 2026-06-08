import { describe, expect, it } from 'vitest';
import { getNameplateBubbleStyle } from '../nameplate-bubble';

describe('getNameplateBubbleStyle', () => {
  it('returns null for empty or none nameplates', () => {
    expect(getNameplateBubbleStyle(null)).toBeNull();
    expect(getNameplateBubbleStyle('plate_none')).toBeNull();
  });

  it('derives a message surface from an equipped nameplate', () => {
    const result = getNameplateBubbleStyle('plate_stone_sentinel_01', {
      isOwn: false,
      surface: 'message',
    });

    expect(result?.entry.id).toBe('plate_stone_sentinel_01');
    expect(result?.className).toContain('nameplate-bubble-surface');
    expect(result?.className).toContain('nameplate-bubble--fantasy');
    expect(result?.style.border).toContain('rgba');
    expect(result?.style.background).toContain('linear-gradient');
  });
});
