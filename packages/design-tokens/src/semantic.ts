/**
 * Semantic, status, rarity, and premium color tokens.
 * Shared across all themes — these don't change with theme selection.
 */

export const semantic = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

export const status = {
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#94a3b8',
  invisible: '#6b7280',
} as const;

export const rarity = {
  free: '#6b7280',
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ec4899',
  divine: '#f97316',
} as const;

export const rarityDark = {
  free: '#9ca3af',
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
  mythic: '#f472b6',
  divine: '#fb923c',
} as const;

export const premium = {
  gold: '#eab308',
  goldLight: '#fef3c7',
  goldDark: '#ca8a04',
} as const;

export const premiumDark = {
  gold: '#fbbf24',
  goldLight: '#854d0e',
  goldDark: '#eab308',
} as const;

export type SemanticColors = typeof semantic;
export type StatusColors = typeof status;
export type RarityColors = typeof rarity;
export type PremiumColors = typeof premium;
