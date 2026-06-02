import { describe, expect, it } from 'vitest';
import { getAvatarBorderStyle } from '../avatar-border-style';

describe('getAvatarBorderStyle', () => {
  it('returns empty className for empty border ids', () => {
    expect(getAvatarBorderStyle(null)).toEqual({ className: '' });
    expect(getAvatarBorderStyle('')).toEqual({ className: '' });
    expect(getAvatarBorderStyle('none')).toEqual({ className: '' });
  });

  it('maps supported CSS border ids to avatar classes', () => {
    expect(getAvatarBorderStyle('static')).toEqual({ className: 'avatar-border-static' });
    expect(getAvatarBorderStyle('simple-glow')).toEqual({ className: 'avatar-border-glow' });
    expect(getAvatarBorderStyle('gentle-pulse')).toEqual({ className: 'avatar-border-pulse' });
    expect(getAvatarBorderStyle('rotating-ring')).toEqual({ className: 'avatar-border-rotating' });
    expect(getAvatarBorderStyle('dual-ring')).toEqual({ className: 'avatar-border-dual-ring' });
    expect(getAvatarBorderStyle('rainbow-spin')).toEqual({ className: 'avatar-border-rainbow' });
    expect(getAvatarBorderStyle('electric-arc')).toEqual({ className: 'avatar-border-electric' });
    expect(getAvatarBorderStyle('flame-ring')).toEqual({ className: 'avatar-border-flame' });
    expect(getAvatarBorderStyle('ice-crystal')).toEqual({ className: 'avatar-border-ice' });
    expect(getAvatarBorderStyle('toxic-glow')).toEqual({ className: 'avatar-border-toxic' });
    expect(getAvatarBorderStyle('holy-light')).toEqual({ className: 'avatar-border-holy' });
    expect(getAvatarBorderStyle('shadow-wisp')).toEqual({ className: 'avatar-border-shadow' });
    expect(getAvatarBorderStyle('cosmic-drift')).toEqual({ className: 'avatar-border-cosmic' });
  });

  it('leaves lottie-only and unknown ids unstyled by legacy CSS classes', () => {
    expect(getAvatarBorderStyle('particle-orbit')).toEqual({ className: '' });
    expect(getAvatarBorderStyle('unknown-border')).toEqual({ className: '' });
  });
});
