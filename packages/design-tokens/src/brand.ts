/**
 * CGraph brand colors.
 * These are the core identity colors used across all themes.
 * Extracted from apps/web/src/index.css :root variables.
 */

export const brand = {
  purple: '#8b5cf6',
  purpleDark: '#7c3aed',
  cyan: '#06b6d4',
  teal: '#10b981',
  green: '#22c55e',
} as const;

export const backgrounds = {
  space: '#0d1117',
  deep: '#0f1320',
  elevated: '#131628',
  sunken: '#080b14',
} as const;

export const text = {
  primary: '#ffffff',
  secondary: '#94a3b8',
  muted: '#475569',
  accent: '#a78bfa',
  inverse: '#0d0f1c',
} as const;

export type BrandColors = typeof brand;
export type BackgroundColors = typeof backgrounds;
export type TextColors = typeof text;
