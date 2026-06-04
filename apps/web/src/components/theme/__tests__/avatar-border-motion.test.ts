import { describe, expect, it } from 'vitest';
import { getLegacyAvatarBorderAnimation } from '../avatar-border-motion';

const colors = {
  primary: '#111111',
  secondary: '#222222',
  glow: 'rgba(17, 17, 17, 0.5)',
};

describe('getLegacyAvatarBorderAnimation', () => {
  it('returns no motion for absent or catalog-rendered border families', () => {
    expect(
      getLegacyAvatarBorderAnimation({ border: 'none', colors, glowEnabled: true })
    ).toEqual({});
    expect(
      getLegacyAvatarBorderAnimation({ border: 'lottie', colors, glowEnabled: true })
    ).toEqual({});
  });

  it('keeps static border glow conditional', () => {
    expect(
      getLegacyAvatarBorderAnimation({ border: 'static', colors, glowEnabled: true })
    ).toEqual({
      boxShadow: '0 0 20px rgba(17, 17, 17, 0.5)',
    });

    expect(
      getLegacyAvatarBorderAnimation({ border: 'static', colors, glowEnabled: false })
    ).toEqual({
      boxShadow: 'none',
    });
  });

  it('returns legacy motion presets for animated css border families', () => {
    expect(
      getLegacyAvatarBorderAnimation({ border: 'pulse', colors, glowEnabled: true })
    ).toMatchObject({
      scale: [1, 1.05, 1],
    });

    expect(
      getLegacyAvatarBorderAnimation({ border: 'legendary', colors, glowEnabled: true })
    ).toMatchObject({
      rotate: [0, 5, -5, 0],
    });
  });
});
