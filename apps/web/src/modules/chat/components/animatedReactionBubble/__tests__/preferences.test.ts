import { describe, expect, it } from 'vitest';
import { getReactionStyleClass } from '../preferences';

describe('animated reaction CSS adapter', () => {
  it('maps supported reaction animation styles to web CSS classes', () => {
    expect(getReactionStyleClass('bounce')).toBe('reaction-bounce');
    expect(getReactionStyleClass('pop')).toBe('reaction-pop');
    expect(getReactionStyleClass('float')).toBe('reaction-float');
    expect(getReactionStyleClass('spin')).toBe('reaction-spin');
    expect(getReactionStyleClass('shake')).toBe('reaction-shake');
    expect(getReactionStyleClass('zoom')).toBe('reaction-zoom');
  });

  it('normalizes unknown reaction styles to the default web CSS class', () => {
    expect(getReactionStyleClass('unknown')).toBe('reaction-bounce');
    expect(getReactionStyleClass('')).toBe('reaction-bounce');
  });
});
