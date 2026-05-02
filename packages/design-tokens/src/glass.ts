/**
 * Glass morphism design tokens.
 * Values from apps/web/src/index.css glass system.
 */

export const glass = {
  bg: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderMd: 'rgba(255, 255, 255, 0.12)',
  borderLg: 'rgba(255, 255, 255, 0.18)',
  blurSm: 8,
  blurMd: 16,
  blurLg: 32,
  blurXl: 48,
} as const;

export const glowShadows = {
  accent: '0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.15)',
  purple: '0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.15)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.4), 0 0 60px rgba(6, 182, 212, 0.15)',
  green: '0 0 20px rgba(195, 224, 0, 0.4), 0 0 60px rgba(195, 224, 0, 0.15)',
  white: '0 0 20px rgba(255, 255, 255, 0.15)',
} as const;

export type GlassTokens = typeof glass;
export type GlowShadows = typeof glowShadows;
