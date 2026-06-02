import type { CSSProperties } from 'react';

const AVATAR_BORDER_CLASS_BY_ID: Record<string, string> = {
  static: 'avatar-border-static',
  'simple-glow': 'avatar-border-glow',
  'gentle-pulse': 'avatar-border-pulse',
  'rotating-ring': 'avatar-border-rotating',
  'dual-ring': 'avatar-border-dual-ring',
  'rainbow-spin': 'avatar-border-rainbow',
  'electric-arc': 'avatar-border-electric',
  'flame-ring': 'avatar-border-flame',
  'ice-crystal': 'avatar-border-ice',
  'toxic-glow': 'avatar-border-toxic',
  'holy-light': 'avatar-border-holy',
  'shadow-wisp': 'avatar-border-shadow',
  'cosmic-drift': 'avatar-border-cosmic',
};

export function getAvatarBorderStyle(borderId: string | null): {
  className: string;
  style?: CSSProperties;
} {
  if (!borderId || borderId === 'none') {
    return { className: '' };
  }

  return {
    className: AVATAR_BORDER_CLASS_BY_ID[borderId] || '',
  };
}
