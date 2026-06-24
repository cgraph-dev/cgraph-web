/**
 * DisplayName — styled display name with font and effect variants.
 *
 * CSS equivalent of the mobile DisplayName component. Effects are CSS-based
 * so they render consistently in chat, profile cards, and live previews.
 */

import {
  NAME_EFFECTS,
  NAME_FONTS,
  type NameFont,
} from '@cgraph-dev/animation-constants';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

interface DisplayNameProps {
  readonly name: string;
  /** Font key from NAME_FONTS — accepts string for API compatibility; falls back to 'default' */
  readonly font?: string;
  /** Effect key — accepts string for API compatibility; falls back to 'solid' */
  readonly effect?: string;
  readonly color?: string;
  readonly secondaryColor?: string;
  readonly size?: string;
  readonly className?: string;
}

export const WEB_NAME_EFFECT_KEYS = [
  'solid',
  'gradient',
  'neon',
  'toon',
  'pop',
  'holo',
  'glitch',
  'chrome',
  'pulse',
  'ember',
  'frost',
] as const;

export type WebNameEffect = (typeof WEB_NAME_EFFECT_KEYS)[number];

export const WEB_NAME_EFFECTS: Record<WebNameEffect, { label: string; description: string }> = {
  ...NAME_EFFECTS,
  holo: { label: 'Holo', description: 'Prismatic sweep' },
  glitch: { label: 'Glitch', description: 'Split signal jitter' },
  chrome: { label: 'Chrome', description: 'Polished metal pass' },
  pulse: { label: 'Pulse', description: 'Breathing energy glow' },
  ember: { label: 'Ember', description: 'Warm molten flicker' },
  frost: { label: 'Frost', description: 'Cold glass shimmer' },
};

const VALID_EFFECTS = new Set<string>(WEB_NAME_EFFECT_KEYS);

type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string>;

/** Type guard for NameFont keys */
function isNameFont(value: string): value is NameFont {
  return value in NAME_FONTS;
}

/** Type guard for NameEffect keys */
function isNameEffect(value: string): value is WebNameEffect {
  return VALID_EFFECTS.has(value);
}

/** Darken a hex color by a factor (0-1) for pop shadow fallback */
function darkenColor(hex: string, factor: number): string {
  const cleaned = hex.replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) {
    return hex;
  }
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(expanded, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - factor)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - factor)));
  const b = Math.max(0, Math.round((num & 255) * (1 - factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Map config weight strings to CSS-typed values */
const CSS_FONT_WEIGHTS: Record<string, CSSProperties['fontWeight']> = {
  '100': 100,
  '200': 200,
  '300': 300,
  '400': 400,
  '500': 500,
  '600': 600,
  '700': 700,
  '800': 800,
  '900': 900,
  normal: 'normal',
  bold: 'bold',
} as const;

/** Build CSS font styles from the NAME_FONTS registry */
function buildFontStyle(font: NameFont, size: string): CSSProperties {
  const config = NAME_FONTS[font];
  return {
    fontSize: size,
    fontWeight: CSS_FONT_WEIGHTS[config.fontWeight ?? '600'] ?? 600,
    fontFamily: config.fontFamily ?? 'inherit',
    fontStyle: config.fontStyle ?? 'normal',
    letterSpacing:
      config.letterSpacing != null ? `${Math.max(0, config.letterSpacing)}px` : undefined,
    lineHeight: 1.3,
  };
}

/** Build CSS variables consumed by the effect classes. */
function buildEffectStyle(
  effect: WebNameEffect,
  color: string,
  secondaryColor: string
): CSSPropertiesWithVars {
  return {
    color,
    '--cgraph-name-primary': color,
    '--cgraph-name-secondary': secondaryColor,
    '--cgraph-name-shadow': darkenColor(color === 'currentColor' ? '#ffffff' : color, 0.45),
    '--cgraph-name-effect': effect,
  };
}

/**
 * Renders a styled display name with configurable font and text effect.
 */
export function DisplayName({
  name,
  font = 'default',
  effect = 'solid',
  color,
  secondaryColor,
  size = '1rem',
  className,
}: DisplayNameProps): React.ReactNode {
  const fontKey: NameFont = isNameFont(font) ? font : 'default';
  const effectKey: WebNameEffect = isNameEffect(effect) ? effect : 'solid';
  const resolvedColor = color ?? 'currentColor';
  const resolvedSecondary =
    secondaryColor ??
    darkenColor(resolvedColor === 'currentColor' ? '#ffffff' : resolvedColor, 0.3);

  const fontStyle = buildFontStyle(fontKey, size);
  const effectStyle = buildEffectStyle(effectKey, resolvedColor, resolvedSecondary);

  return (
    <span
      className={cn(
        'cgraph-display-name',
        `cgraph-display-name--effect-${effectKey}`,
        className
      )}
      data-text={name}
      data-display-name-effect={effectKey}
      style={{
        ...fontStyle,
        ...effectStyle,
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  );
}
