/**
 * Gradient definitions.
 * Arrays are [startColor, endColor] or [start, mid, end] for multi-stop.
 */

export const gradients = {
  brand: ['#8b5cf6', '#06b6d4'] as const,
  brandText: ['#a78bfa', '#06b6d4', '#10b981'] as const,
  hero: ['#0d1117', '#0f1320', '#0d1117'] as const,
  glowPurple: 'rgba(139, 92, 246, 0.15)',
  glowCyan: 'rgba(6, 182, 212, 0.12)',
} as const;

export type Gradients = typeof gradients;
