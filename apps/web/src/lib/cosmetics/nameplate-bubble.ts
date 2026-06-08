import type { CSSProperties } from 'react';
import {
  getNameplateById,
  type NameplateEntry,
} from '@cgraph-dev/animation-constants';

type NameplateBubbleSurface = 'message' | 'group' | 'forum';

type CssVars = CSSProperties & Record<`--${string}`, string>;

export interface NameplateBubbleStyle {
  readonly entry: NameplateEntry;
  readonly className: string;
  readonly style: CssVars;
}

interface NameplateBubbleOptions {
  readonly isOwn?: boolean;
  readonly surface?: NameplateBubbleSurface;
}

function normalizeHex(hex: string): string | null {
  if (!hex.startsWith('#')) return null;

  const raw = hex.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return raw
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) return raw;

  return null;
}

function hexToRgba(color: string | null | undefined, alpha: number, fallback: string): string {
  if (!color) return fallback;

  const normalized = normalizeHex(color);
  if (!normalized) return color;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function safeCategoryClass(category: string | undefined): string {
  return (category ?? 'nameplate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function firstDefinedColor(...colors: Array<string | null | undefined>): string {
  return colors.find((color): color is string => typeof color === 'string' && color.length > 0) ?? '#8b5cf6';
}

function surfaceOpacity(surface: NameplateBubbleSurface): number {
  switch (surface) {
    case 'forum':
      return 0.58;
    case 'group':
      return 0.68;
    case 'message':
    default:
      return 0.76;
  }
}

export function getNameplateBubbleStyle(
  nameplateId: string | null | undefined,
  options: NameplateBubbleOptions = {}
): NameplateBubbleStyle | null {
  if (!nameplateId) return null;

  const entry = getNameplateById(nameplateId);
  if (!entry || entry.id === 'plate_none') return null;

  const surface = options.surface ?? 'message';
  const opacity = surfaceOpacity(surface);
  const [gradientStart, gradientEnd] = entry.barGradient ?? ['#111827', '#020617'];
  const accent = firstDefinedColor(entry.borderColor, entry.textColorSecondary, entry.textColor);
  const highlight = firstDefinedColor(entry.textColor, entry.textColorSecondary, '#ffffff');
  const ownAnchor = options.isOwn ? '88% 18%' : '12% 18%';

  const style: CssVars = {
    '--nameplate-bubble-accent': accent,
    '--nameplate-bubble-accent-soft': hexToRgba(accent, 0.24, accent),
    '--nameplate-bubble-accent-strong': hexToRgba(accent, 0.5, accent),
    '--nameplate-bubble-highlight': hexToRgba(highlight, 0.16, highlight),
    '--nameplate-bubble-sheen-x': options.isOwn ? '115%' : '-15%',
    background: [
      `radial-gradient(circle at ${ownAnchor}, ${hexToRgba(accent, 0.22, accent)} 0%, transparent 36%)`,
      `linear-gradient(135deg, ${hexToRgba(gradientStart, opacity, gradientStart)} 0%, ${hexToRgba(gradientEnd, Math.max(0.48, opacity - 0.12), gradientEnd)} 100%)`,
    ].join(', '),
    border: `1px solid ${hexToRgba(accent, 0.36, accent)}`,
    boxShadow: [
      `inset 0 0 0 1px ${hexToRgba(highlight, 0.08, highlight)}`,
      `0 10px 26px ${hexToRgba(accent, 0.16, accent)}`,
    ].join(', '),
  };

  return {
    entry,
    className: `nameplate-bubble-surface nameplate-bubble--${safeCategoryClass(entry.category)}`,
    style,
  };
}
