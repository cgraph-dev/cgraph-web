/**
 * NameplateBar — decorative horizontal bar behind a username.
 *
 * Renders a layered nameplate composed of:
 *   1. Lottie animated background (or CSS gradient fallback)
 *   2. Border frame (solid / gradient / glow / animated / double)
 *   3. Emblem icon
 *   4. Text effect overlay (holo, rainbow, glitch, glow, fire, ice, neon, metallic, etc.)
 *
 * Design tokens are sourced from `@cgraph-dev/animation-constants` (shared with mobile).
 *
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';
import {
  NAME_FONTS,
  getNameplateById,
  type NameFont,
  type NameplateEntry,
  type NameplateBorderStyle,
  type NameplateTextEffect,
} from '@cgraph-dev/animation-constants';
/** Default canvas dimensions matching the registry spec (300×48). */
const BAR_WIDTH = 300;
const BAR_HEIGHT = 48;
export interface NameplateBarProps {
  /** Nameplate ID from the registry (e.g. 'plate_gold_shimmer'). null → hidden. */
  nameplateId: string | null;
  /** Optional className for the outermost wrapper. */
  className?: string;
  /** Custom width override. @default 300 */
  width?: number;
  /** Custom height override. @default 48 */
  height?: number;
  /** Actual username to display inside the nameplate. */
  username?: string;
  /** Optional user-selected display name font override. */
  displayNameFont?: string;
  /** Optional user-selected display name effect override. */
  displayNameEffect?: string;
  /** Optional user-selected display name color override. */
  displayNameColor?: string;
  /** Optional user-selected secondary display name color override. */
  displayNameSecondaryColor?: string | null;
}

const textEffectReset: React.CSSProperties = {
  animation: undefined,
  background: undefined,
  backgroundClip: undefined,
  backgroundSize: undefined,
  filter: undefined,
  textShadow: undefined,
  WebkitBackgroundClip: undefined,
  WebkitTextFillColor: undefined,
};

function isNameFont(value: string | undefined): value is NameFont {
  return Boolean(value && value in NAME_FONTS);
}

function getDisplayNameOverrideStyles({
  font,
  effect,
  color,
  secondaryColor,
}: {
  font?: string;
  effect?: string;
  color?: string;
  secondaryColor?: string | null;
}): React.CSSProperties | null {
  const hasFontOverride = isNameFont(font) && font !== 'default';
  const hasEffectOverride = Boolean(effect && effect !== 'solid');
  const hasColorOverride = Boolean(color);

  if (!hasFontOverride && !hasEffectOverride && !hasColorOverride) {
    return null;
  }

  const primary = color ?? '#ffffff';
  const secondary = secondaryColor ?? primary;
  const style: React.CSSProperties = { ...textEffectReset };

  if (hasFontOverride) {
    const fontConfig = NAME_FONTS[font];
    style.fontFamily = fontConfig.fontFamily;
    style.fontWeight = fontConfig.fontWeight;
    style.fontStyle = fontConfig.fontStyle;
    style.letterSpacing =
      fontConfig.letterSpacing != null ? `${fontConfig.letterSpacing}px` : undefined;
  }

  switch (effect) {
    case 'gradient':
      return {
        ...style,
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    case 'neon':
      return {
        ...style,
        color: primary,
        textShadow: `0 0 7px ${primary}, 0 0 10px ${primary}, 0 0 21px ${primary}, 0 0 42px ${secondary}`,
      };
    case 'toon':
      return {
        ...style,
        color: primary,
        WebkitTextStroke: '1px rgba(0,0,0,0.6)',
        textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
      };
    case 'pop':
      return {
        ...style,
        color: primary,
        textShadow: `3px 3px 0 ${secondary}, -1px -1px 0 rgba(0,0,0,0.2)`,
      };
    default:
      return hasColorOverride ? { ...style, color: primary } : style;
  }
}

/** Resolve border CSS for the given border style. */
function resolveBorderStyle(
  style: NameplateBorderStyle,
  color: string | null
): React.CSSProperties {
  const c = color ?? 'transparent';
  switch (style) {
    case 'solid':
      return { border: `1px solid ${c}` };
    case 'gradient':
      return {
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `inset 0 0 0 1px ${c}, 0 0 6px ${c}40`,
      };
    case 'glow':
      return {
        border: `1px solid ${c}60`,
        boxShadow: `0 0 8px ${c}80, 0 0 16px ${c}40`,
      };
    case 'animated':
      return {
        border: `1px solid ${c}80`,
        boxShadow: `0 0 10px ${c}60, 0 0 20px ${c}30`,
      };
    case 'double':
      return {
        border: `3px double ${c}`,
      };
    case 'none':
    default:
      return {};
  }
}
/** Produce inline style for the specified text effect. */
function resolveTextEffectStyle(
  effect: NameplateTextEffect,
  color: string,
  secondary: string | null
): React.CSSProperties {
  const sec = secondary ?? color;
  switch (effect) {
    case 'glow':
      return {
        color,
        textShadow: `0 0 6px ${color}80, 0 0 12px ${color}40`,
      };
    case 'metallic':
      return {
        background: `linear-gradient(135deg, ${color}, ${sec}, ${color})`,
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    case 'holographic':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'nameplate-holo 3s linear infinite',
      };
    case 'fire':
      return {
        color,
        textShadow: `0 0 4px ${sec}, 0 -2px 8px ${sec}80, 0 -4px 12px ${sec}40`,
      };
    case 'ice':
      return {
        color,
        textShadow: `0 0 6px ${sec}80, 0 0 12px ${sec}40`,
        filter: 'brightness(1.1)',
      };
    case 'neon':
      return {
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${sec}, 0 0 40px ${sec}`,
      };
    case 'glitch':
      return {
        color,
        animation: 'nameplate-glitch 2s steps(10, end) infinite',
      };
    case 'rainbow':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'nameplate-rainbow 4s linear infinite',
      };
    case 'shadow':
      return {
        color,
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      };
    case 'emboss':
      return {
        color,
        textShadow: '1px 1px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.3)',
      };
    case 'none':
    default:
      return { color };
  }
}
function GradientBackground({ gradient }: { gradient: readonly [string, string] | null }) {
  if (!gradient) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        borderRadius: 'inherit',
      }}
      aria-hidden="true"
    />
  );
}
/**
 * NameplateBar — renders a fully layered decorative nameplate bar.
 *
 * Layers (back→front): gradient bg → Lottie bg → border → emblem + text effect.
 *
 * @example
 * ```tsx
 * <NameplateBar nameplateId="plate_gold_shimmer" />
 * ```
 */
export const NameplateBar = memo(function NameplateBar({
  nameplateId,
  className = '',
  width = BAR_WIDTH,
  height = BAR_HEIGHT,
  username,
  displayNameFont,
  displayNameEffect,
  displayNameColor,
  displayNameSecondaryColor,
}: NameplateBarProps) {
  const prefersReducedMotion = useReducedMotion();

  // Resolve entry from shared registry
  const entry: NameplateEntry | undefined = nameplateId ? getNameplateById(nameplateId) : undefined;
  const imageUrl = entry?.imageUrl ?? entry?.previewUrl;

  const hasLottie = Boolean(entry?.lottieUrl);

  if (!entry || entry.id === 'plate_none') {
    return null;
  }

  const borderStyles = resolveBorderStyle(entry.borderStyle, entry.borderColor);
  const textStyles =
    getDisplayNameOverrideStyles({
      font: displayNameFont,
      effect: displayNameEffect,
      color: displayNameColor,
      secondaryColor: displayNameSecondaryColor,
    }) ?? resolveTextEffectStyle(entry.textEffect, entry.textColor, entry.textColorSecondary);

  // Animated border rotation for 'animated' border style
  const animatedBorderProps =
    entry.borderStyle === 'animated' && !prefersReducedMotion
      ? {
          animate: {
            boxShadow: [
              `0 0 8px ${entry.borderColor}60, 0 0 16px ${entry.borderColor}30`,
              `0 0 14px ${entry.borderColor}80, 0 0 28px ${entry.borderColor}40`,
              `0 0 8px ${entry.borderColor}60, 0 0 16px ${entry.borderColor}30`,
            ],
          },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        }
      : {};

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={entry.id}
        className={`relative overflow-hidden ${className}`}
        style={{
          width,
          height,
          borderRadius: 8,
          ...borderStyles,
        }}
        initial={{ opacity: 0, scaleX: 0.85 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0.85 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        role="img"
        aria-label={`${entry.name} nameplate`}
        data-nameplate-id={entry.id}
        data-display-name-effect={displayNameEffect ?? undefined}
        {...animatedBorderProps}
      >
        {/* Layer 1: CSS gradient background (always renders as fallback) */}
        <GradientBackground gradient={entry.barGradient} />

        {/* Layer 2: static release asset or Lottie animated background */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill opacity-95"
            loading="lazy"
          />
        ) : hasLottie && !prefersReducedMotion ? (
          <LottieAssetRenderer
            path={entry.lottieUrl}
            fallbackPath="/lottie/nameplates/placeholder.json"
            label={`${entry.name} nameplate animation`}
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-80"
            fallback={null}
          />
        ) : null}

        {/* Layer 3: Content — emblem + username text effect */}
        <div
          className="relative z-10 flex h-full items-center justify-center gap-2 px-4"
          style={{ width, height }}
        >
          {/* Emblem */}
          {entry.emblem && (
            <motion.span
              className="flex-shrink-0 text-base"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
              aria-hidden="true"
            >
              {entry.emblem}
            </motion.span>
          )}

          {/* Text effect preview */}
          <span className="truncate text-sm font-bold" style={textStyles}>
            {username || 'Username'}
          </span>

          {/* Trailing emblem for symmetry on high-rarity plates */}
          {entry.emblem && (entry.rarity === 'legendary' || entry.rarity === 'mythic') && (
            <motion.span
              className="flex-shrink-0 text-base"
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              aria-hidden="true"
            >
              {entry.emblem}
            </motion.span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default NameplateBar;
