/**
 * Glass card style constant definitions.
 */
import type { ThemeVariant } from '@/lib/theme/types';

interface VariantStyle {
  background: string;
  blur: string;
  border: string;
}

type GlassVariant = 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'aurora';

/** Aurora glass theme — purple tinted glass with deep space backgrounds */
const auroraVariantStyles: Record<GlassVariant, VariantStyle> = {
  default: {
    background: 'rgba(17, 24, 39, 0.6)',
    blur: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  frosted: {
    background: 'rgba(31, 41, 55, 0.4)',
    blur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  crystal: {
    background: 'rgba(17, 24, 39, 0.6)',
    blur: 'blur(24px)',
    border: '1px solid rgba(139, 92, 246, 0.18)',
  },
  neon: {
    background: 'rgba(17, 24, 39, 0.5)',
    blur: 'blur(16px)',
    border: '2px solid rgba(139, 92, 246, 0.3)',
  },
  holographic: {
    background:
      'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(59, 130, 246, 0.12) 100%)',
    blur: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  aurora: {
    background:
      'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
    blur: 'blur(20px)',
    border: '1px solid rgba(139, 92, 246, 0.16)',
  },
};

/** Dark chrome theme — steel gray with subtle lime (#DFFF0A) accent borders */
const darkVariantStyles: Record<GlassVariant, VariantStyle> = {
  default: {
    background: 'rgba(255, 255, 255, 0.03)',
    blur: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  frosted: {
    background: 'rgba(255, 255, 255, 0.04)',
    blur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  crystal: {
    background: 'rgba(255, 255, 255, 0.05)',
    blur: 'blur(24px)',
    border: '1px solid rgba(223, 255, 10, 0.10)',
  },
  neon: {
    background: 'rgba(223, 255, 10, 0.04)',
    blur: 'blur(16px)',
    border: '2px solid rgba(223, 255, 10, 0.22)',
  },
  holographic: {
    background:
      'linear-gradient(135deg, rgba(223, 255, 10, 0.06) 0%, rgba(195, 224, 0, 0.03) 100%)',
    blur: 'blur(16px)',
    border: '1px solid rgba(223, 255, 10, 0.10)',
  },
  aurora: {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(223, 255, 10, 0.02) 100%)',
    blur: 'blur(20px)',
    border: '1px solid rgba(223, 255, 10, 0.08)',
  },
};

/** Light theme — clean flat cards with subtle sapphire (#2563eb) accent differentiation */
const lightVariantStyles: Record<GlassVariant, VariantStyle> = {
  default: {
    background: '#ffffff',
    blur: 'none',
    border: '1px solid #e2e5ea',
  },
  frosted: {
    background: '#f8f9fb',
    blur: 'none',
    border: '1px solid #e2e5ea',
  },
  crystal: {
    background: '#ffffff',
    blur: 'none',
    border: '1px solid rgba(37, 99, 235, 0.18)',
  },
  neon: {
    background: '#ffffff',
    blur: 'none',
    border: '1px solid rgba(37, 99, 235, 0.35)',
  },
  holographic: {
    background: '#f8faff',
    blur: 'none',
    border: '1px solid rgba(37, 99, 235, 0.14)',
  },
  aurora: {
    background: '#ffffff',
    blur: 'none',
    border: '1px solid #e2e5ea',
  },
};

/** Bubble liquid-glass theme — glass droplet with specular depth, transparent enough for aurora to show through */
const bubbleVariantStyles: Record<GlassVariant, VariantStyle> = {
  default: {
    background: 'rgba(255, 255, 255, 0.05)',
    blur: 'blur(20px)',
    border: '1.5px solid rgba(255, 255, 255, 0.15)',
  },
  frosted: {
    background: 'rgba(255, 255, 255, 0.06)',
    blur: 'blur(24px)',
    border: '1.5px solid rgba(255, 255, 255, 0.18)',
  },
  crystal: {
    background: 'rgba(255, 255, 255, 0.08)',
    blur: 'blur(28px)',
    border: '1.5px solid rgba(255, 255, 255, 0.22)',
  },
  neon: {
    background: 'rgba(139, 92, 246, 0.08)',
    blur: 'blur(20px)',
    border: '1.5px solid rgba(139, 92, 246, 0.22)',
  },
  holographic: {
    background: 'rgba(255, 255, 255, 0.05)',
    blur: 'blur(24px)',
    border: '1.5px solid rgba(255, 255, 255, 0.18)',
  },
  aurora: {
    background: 'rgba(139, 92, 246, 0.05)',
    blur: 'blur(24px)',
    border: '1.5px solid rgba(255, 255, 255, 0.15)',
  },
};

/** Per-theme variant style mapping. Aurora = original glass look. */
export const themeVariantStyles: Record<ThemeVariant, Record<GlassVariant, VariantStyle>> = {
  aurora: auroraVariantStyles,
  dark: darkVariantStyles,
  light: lightVariantStyles,
  bubble: bubbleVariantStyles,
};

/** @deprecated Use themeVariantStyles.aurora instead. Kept for backward-compat imports. */
export const variantStyles = auroraVariantStyles;

/** Per-theme behavior flags */
interface ThemeBehavior {
  /** Whether spotlight effect is allowed */
  spotlight: boolean;
  /** Whether shimmer effect is allowed */
  shimmer: boolean;
  /** Whether particles are allowed */
  particles: boolean;
  /** Spotlight color */
  spotlightColor: string;
  /** Additional box-shadow applied to the card */
  boxShadow: string;
  /** Hover box-shadow */
  hoverBoxShadow: string;
}

export const themeBehavior: Record<ThemeVariant, ThemeBehavior> = {
  aurora: {
    spotlight: true,
    shimmer: true,
    particles: true,
    spotlightColor: 'rgba(139, 92, 246, 0.14)',
    boxShadow: '0 10px 30px rgba(5, 8, 20, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
    hoverBoxShadow:
      '0 18px 40px rgba(5, 8, 20, 0.32), 0 0 0 1px rgba(139, 92, 246, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  },
  dark: {
    spotlight: true,
    shimmer: false,
    particles: false,
    spotlightColor: 'rgba(223, 255, 10, 0.06)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    hoverBoxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  light: {
    spotlight: false,
    shimmer: false,
    particles: false,
    spotlightColor: 'transparent',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    hoverBoxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
  },
  bubble: {
    spotlight: true,
    shimmer: true,
    particles: false,
    spotlightColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow:
      '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 2px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.10)',
    hoverBoxShadow:
      '0 12px 36px rgba(0, 0, 0, 0.20), inset 0 2px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.14), 0 14px 40px -6px rgba(139, 92, 246, 0.30)',
  },
};
