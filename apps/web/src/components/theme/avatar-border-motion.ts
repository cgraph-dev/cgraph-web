import type { TargetAndTransition } from 'motion/react';
import type { AvatarBorderType } from '@/stores';

interface AvatarBorderMotionColors {
  readonly primary: string;
  readonly secondary: string;
  readonly glow: string;
}

interface AvatarBorderMotionInput {
  readonly border: AvatarBorderType;
  readonly colors: AvatarBorderMotionColors;
  readonly glowEnabled: boolean;
}

export type AvatarBorderMotion = TargetAndTransition;

export function getLegacyAvatarBorderAnimation({
  border,
  colors,
  glowEnabled,
}: AvatarBorderMotionInput): AvatarBorderMotion {
  switch (border) {
    case 'none':
    case 'lottie':
      return {};
    case 'static':
      return {
        boxShadow: glowEnabled ? `0 0 20px ${colors.glow}` : 'none',
      };
    case 'glow':
      return {
        boxShadow: [
          `0 0 10px ${colors.glow}`,
          `0 0 25px ${colors.glow}`,
          `0 0 10px ${colors.glow}`,
        ],
      };
    case 'pulse':
      return {
        boxShadow: [
          `0 0 10px ${colors.glow}`,
          `0 0 30px ${colors.glow}`,
          `0 0 10px ${colors.glow}`,
        ],
        scale: [1, 1.05, 1],
      };
    case 'rotate':
      return {
        rotate: [0, 360],
      };
    case 'fire':
      return {
        boxShadow: [
          '0 0 15px rgba(249, 115, 22, 0.6)',
          '0 0 30px rgba(249, 115, 22, 0.8)',
          '0 0 15px rgba(249, 115, 22, 0.6)',
        ],
      };
    case 'ice':
      return {
        boxShadow: [
          '0 0 15px rgba(56, 189, 248, 0.6)',
          '0 0 30px rgba(56, 189, 248, 0.8)',
          '0 0 15px rgba(56, 189, 248, 0.6)',
        ],
      };
    case 'electric':
      return {
        boxShadow: [
          '0 0 15px rgba(234, 179, 8, 0.6)',
          '0 0 35px rgba(234, 179, 8, 0.9)',
          '0 0 15px rgba(234, 179, 8, 0.6)',
        ],
      };
    case 'legendary':
      return {
        boxShadow: [
          `0 0 20px ${colors.primary}, 0 0 40px ${colors.secondary}`,
          `0 0 30px ${colors.primary}, 0 0 60px ${colors.secondary}`,
          `0 0 20px ${colors.primary}, 0 0 40px ${colors.secondary}`,
        ],
        rotate: [0, 5, -5, 0],
      };
    case 'mythic':
      return {
        boxShadow: [
          `0 0 25px ${colors.primary}, 0 0 50px ${colors.secondary}, inset 0 0 20px ${colors.glow}`,
          `0 0 40px ${colors.primary}, 0 0 80px ${colors.secondary}, inset 0 0 30px ${colors.glow}`,
          `0 0 25px ${colors.primary}, 0 0 50px ${colors.secondary}, inset 0 0 20px ${colors.glow}`,
        ],
        scale: [1, 1.08, 1],
        rotate: [0, 360],
      };
    default:
      return {};
  }
}
