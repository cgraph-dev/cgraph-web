import { describe, it, expect } from 'vitest';
import { getPermState, cyclePermState, applyPermChange } from '../permission-utils';
import { PERMISSION_FLAGS } from '../types';

describe('permission-utils', () => {
  it('matches the backend channel permission bit contract exactly', () => {
    expect(Object.fromEntries(PERMISSION_FLAGS.map(({ label, bit }) => [label, bit]))).toEqual({
      'View Channel': 1,
      'Send Messages': 2,
      'Attach Files': 4,
      'Embed Links': 8,
      'Add Reactions': 16,
      'Use External Emoji': 32,
      'Mention Everyone': 64,
      'Manage Messages': 128,
      'Read Message History': 256,
      Connect: 512,
      Speak: 1024,
    });
  });

  it('uses one unique power-of-two bit per permission', () => {
    const bits = PERMISSION_FLAGS.map(({ bit }) => bit);
    expect(new Set(bits).size).toBe(bits.length);
    expect(bits.every((bit) => bit > 0 && (bit & (bit - 1)) === 0)).toBe(true);
  });

  describe('getPermState', () => {
    const BIT = 0b0100;

    it('returns allow when bit is set in allow', () => {
      expect(getPermState(BIT, 0, BIT)).toBe('allow');
    });

    it('returns deny when bit is set in deny', () => {
      expect(getPermState(0, BIT, BIT)).toBe('deny');
    });

    it('returns inherit when bit is in neither', () => {
      expect(getPermState(0, 0, BIT)).toBe('inherit');
    });
  });

  describe('cyclePermState', () => {
    it('cycles inherit → allow → deny → inherit', () => {
      expect(cyclePermState('inherit')).toBe('allow');
      expect(cyclePermState('allow')).toBe('deny');
      expect(cyclePermState('deny')).toBe('inherit');
    });
  });

  describe('applyPermChange', () => {
    const BIT = 0b0010;

    it('sets allow bit', () => {
      const { allow, deny } = applyPermChange(0, 0, BIT, 'allow');
      expect(allow & BIT).toBeTruthy();
      expect(deny & BIT).toBeFalsy();
    });

    it('sets deny bit', () => {
      const { allow, deny } = applyPermChange(0, 0, BIT, 'deny');
      expect(allow & BIT).toBeFalsy();
      expect(deny & BIT).toBeTruthy();
    });

    it('clears both for inherit', () => {
      const { allow, deny } = applyPermChange(BIT, BIT, BIT, 'inherit');
      expect(allow & BIT).toBeFalsy();
      expect(deny & BIT).toBeFalsy();
    });

    it('preserves other bits', () => {
      const OTHER = 0b1000;
      const { allow, deny } = applyPermChange(OTHER, OTHER, BIT, 'allow');
      expect(allow & OTHER).toBeTruthy();
      expect(deny & OTHER).toBeTruthy();
    });
  });
});
