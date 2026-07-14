import { describe, expect, it } from 'vitest';
import { countIsolatedAnimatedEmojis } from '../emoji-text-renderer';

describe('countIsolatedAnimatedEmojis', () => {
  it('recognizes one to three supported emoji as isolated content', () => {
    expect(countIsolatedAnimatedEmojis('😂')).toBe(1);
    expect(countIsolatedAnimatedEmojis(' 👍 😂 ')).toBe(2);
    expect(countIsolatedAnimatedEmojis('😂👍❤️')).toBe(3);
  });

  it('keeps text, unsupported emoji, and larger runs in normal message bubbles', () => {
    expect(countIsolatedAnimatedEmojis('hello 😂')).toBe(0);
    expect(countIsolatedAnimatedEmojis('🥜')).toBe(0);
    expect(countIsolatedAnimatedEmojis('😂😂😂😂')).toBe(0);
    expect(countIsolatedAnimatedEmojis('')).toBe(0);
  });
});
