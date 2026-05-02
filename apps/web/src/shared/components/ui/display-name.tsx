/**
 * DisplayName — styled display name with font and effect variants.
 *
 * CSS equivalent of the mobile DisplayName component.
 * Supports 5 effects (solid, gradient, neon, toon, pop) and 8 fonts
 * from the shared @cgraph/animation-constants package.
 */

import { NAME_FONTS, type NameFont, type NameEffect } from '@cgraph/animation-constants';

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

const VALID_EFFECTS = new Set<string>(['solid', 'gradient', 'neon', 'toon', 'pop']);

/** Type guard for NameFont keys */
function isNameFont(value: string): value is NameFont {
  return value in NAME_FONTS;
}

/** Type guard for NameEffect keys */
function isNameEffect(value: string): value is NameEffect {
  return VALID_EFFECTS.has(value);
}

/** Darken a hex color by a factor (0-1) for pop shadow fallback */
function darkenColor(hex: string, factor: number): string {
  const cleaned = hex.replace('#', '');
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
const CSS_FONT_WEIGHTS: Record<string, React.CSSProperties['fontWeight']> = {
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
function buildFontStyle(font: NameFont, size: string): React.CSSProperties {
  const config = NAME_FONTS[font];
  return {
    fontSize: size,
    fontWeight: CSS_FONT_WEIGHTS[config.fontWeight ?? '600'] ?? 600,
    fontFamily: config.fontFamily ?? 'inherit',
    fontStyle: config.fontStyle ?? 'normal',
    letterSpacing: config.letterSpacing != null ? `${config.letterSpacing}px` : undefined,
    lineHeight: 1.3,
  };
}

/** Build CSS effect styles (color, gradient, text-shadow, etc.) */
function buildEffectStyle(
  effect: NameEffect,
  color: string,
  secondaryColor: string
): React.CSSProperties {
  switch (effect) {
    case 'gradient':
      return {
        background: `linear-gradient(135deg, ${color}, ${secondaryColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    case 'neon':
      return {
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}80`,
      };
    case 'toon':
      return {
        color,
        textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
      };
    case 'pop':
      return {
        color,
        textShadow: `2px 2px 0 ${secondaryColor}`,
      };
    case 'solid':
    default:
      return { color };
  }
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
  const effectKey: NameEffect = isNameEffect(effect) ? effect : 'solid';
  const resolvedColor = color ?? 'currentColor';
  const resolvedSecondary =
    secondaryColor ??
    darkenColor(resolvedColor === 'currentColor' ? '#ffffff' : resolvedColor, 0.3);

  const fontStyle = buildFontStyle(fontKey, size);
  const effectStyle = buildEffectStyle(effectKey, resolvedColor, resolvedSecondary);

  return (
    <span
      className={className}
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
