/**
 * AvatarBorderRenderer - Main component
 *
 * Renders animated avatar borders with support for:
 * - 150+ unique border styles across 20+ themes
 * - Performance optimization with reduced motion support
 * - Custom color overrides
 */

import { durations } from '@cgraph-dev/animation-constants';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { THEME_COLORS } from '@/types/avatar-borders';
import { LottieBorderRenderer } from '@/lib/lottie/lottie-border-renderer';
import type { AvatarBorderRendererProps, BorderColors } from './types';
import {
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getThemeStyles,
} from './animations';

/** Type guard: is the value a lottie animation config object? */
function isLottieConfig(
  val: unknown
): val is { loop?: boolean; speed?: number; segment?: [number, number] } {
  return typeof val === 'object' && val !== null;
}

/** Type guard: is the key a valid ANIMATION_KEYFRAMES entry? */
function isAnimationKey(key: string): key is keyof typeof ANIMATION_KEYFRAMES {
  return key in ANIMATION_KEYFRAMES;
}

/** CSS properties with CSS custom property support */
type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string>;

export const AvatarBorderRenderer = memo(function AvatarBorderRenderer({
  src,
  alt = 'Avatar',
  border: propBorder,
  size = 80,
  avatarScale,
  className,
  animationSpeed = 1,
  interactive = true,
  onClick,
  customColors,
  reducedMotion: propReducedMotion,
  children,
  fallback,
}: AvatarBorderRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const preferences = {
    reducedMotion: false,
    animationSpeed: 1,
  };
  const displayBorder = null;

  // Use prop border or store border
  const border = propBorder ?? displayBorder;

  const reducedMotion = propReducedMotion ?? preferences.reducedMotion;
  const finalAnimationSpeed = animationSpeed * preferences.animationSpeed;

  // Get colors
  const colors = useMemo((): BorderColors => {
    if (!border) return THEME_COLORS.free;
    const themeColors = THEME_COLORS[border.theme] || THEME_COLORS.free;
    return {
      primary: customColors?.primary ?? border.primaryColor ?? themeColors.primary,
      secondary: customColors?.secondary ?? border.secondaryColor ?? themeColors.secondary,
      accent: customColors?.accent ?? border.accentColor ?? themeColors.accent,
    };
  }, [border, customColors]);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  // Resolved avatar content: children override > img > empty
  const avatarContent =
    children ??
    (src && !imageFailed ? (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    ) : (
      fallback ?? null
    ));

  // If no border or 'none', just render the avatar
  if (!border || border.id === 'none') {
    return (
      <div
        className={cn('relative overflow-hidden rounded-full', className)}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        {avatarContent}
      </div>
    );
  }

  // Lottie border path: delegate to LottieBorderRenderer
  const lottieUrl: string | undefined = (() => {
    if ('lottieUrl' in border && typeof border.lottieUrl === 'string') return border.lottieUrl;
    if ('lottie_url' in border && typeof border.lottie_url === 'string') return border.lottie_url;
    return undefined;
  })();
  const imageUrl: string | undefined = (() => {
    if ('imageUrl' in border && typeof border.imageUrl === 'string') return border.imageUrl;
    if ('previewUrl' in border && typeof border.previewUrl === 'string') return border.previewUrl;
    if ('image_url' in border && typeof border.image_url === 'string') return border.image_url;
    if ('preview_url' in border && typeof border.preview_url === 'string') return border.preview_url;
    return undefined;
  })();
  const isLottieType =
    border.type?.includes('lottie') ||
    ('animationType' in border && border.animationType === 'lottie') ||
    ('animation_type' in border && border.animation_type === 'lottie');
  if (imageUrl) {
    const avatarSize = Math.round(size * (avatarScale ?? 0.66));
    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'cgraph-game-avatar-frame relative isolate flex items-center justify-center overflow-visible',
          interactive && 'cursor-pointer',
          className
        )}
        style={{ width: size, height: size }}
        onClick={onClick}
        whileHover={interactive && !reducedMotion ? { scale: 1.05 } : undefined}
        whileTap={interactive && !reducedMotion ? { scale: 0.98 } : undefined}
      >
        <img
          src={imageUrl}
          alt=""
          className="cgraph-game-avatar-frame-asset pointer-events-none absolute inset-0 z-[3] h-full w-full object-contain"
          loading="lazy"
        />
        <div
          className="relative z-[1] overflow-hidden rounded-full bg-[var(--token-card-bg)] opacity-100 shadow-inner shadow-black/30"
          style={{ width: avatarSize, height: avatarSize }}
        >
          {avatarContent}
        </div>
      </motion.div>
    );
  }
  if (isLottieType && lottieUrl) {
    const rawConfig =
      ('lottieConfig' in border ? border.lottieConfig : undefined) ??
      ('lottie_config' in border ? border.lottie_config : undefined);
    const lottieConfig = isLottieConfig(rawConfig) ? rawConfig : undefined;
    // Use the same proportions as ThemedBorderCard (0.65 avatar, 0.18 border)
    // so the Lottie frame is properly visible around the avatar
    const lottieAvatarSize = Math.round(size * (avatarScale ?? 0.65));
    const lottieBorderWidth = Math.round(size * 0.18);
    return (
      <LottieBorderRenderer
        lottieUrl={lottieUrl}
        avatarSize={lottieAvatarSize}
        borderWidth={lottieBorderWidth}
        lottieConfig={lottieConfig}
        fallbackColor={colors.primary}
        className={className}
      >
        {avatarContent}
      </LottieBorderRenderer>
    );
  }

  // Calculate dimensions
  const borderWidth = Math.max(3, size * 0.06);
  const innerSize = size - borderWidth * 2;
  const avatarSize = avatarScale ? Math.round(size * avatarScale) : innerSize;

  // Get theme-specific styles
  const themeStyles = getThemeStyles(border.theme, colors);

  // Get animation based on border type
  const getAnimationVariant = () => {
    if (reducedMotion) return {};

    const animationType = getAnimationTypeFromBorder(border.type);

    if (!isAnimationKey(animationType)) return {};
    const baseAnimation = ANIMATION_KEYFRAMES[animationType];

    if (typeof baseAnimation === 'function') {
      return baseAnimation(0, 1);
    }

    if (baseAnimation) {
      return {
        ...baseAnimation,
        transition: {
          ...baseAnimation.transition,
          duration: (baseAnimation.transition?.duration || 2) / finalAnimationSpeed,
        },
      };
    }

    return {};
  };

  const containerStyle: CSSPropertiesWithVars = {
    width: size,
    height: size,
    '--glow-color': colors.accent,
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative flex items-center justify-center', interactive && 'cursor-pointer', className)}
      style={containerStyle}
      onClick={onClick}
      whileHover={interactive && !reducedMotion ? { scale: 1.05 } : undefined}
      whileTap={interactive && !reducedMotion ? { scale: 0.98 } : undefined}
    >
      {/* Animated border ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          ...themeStyles,
          padding: borderWidth,
        }}
        animate={getAnimationVariant()}
      >
        {/* Rotating ring for rotate animations */}
        {(getAnimationTypeFromBorder(border.type) === 'rotate' ||
          border.type.includes('rotating')) &&
          !reducedMotion && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
                borderRadius: 'inherit',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: durations.cinematic.ms / 1000 / finalAnimationSpeed,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
      </motion.div>

      {/* Avatar image container */}
      <div
        className="relative z-10 overflow-hidden rounded-full bg-[var(--token-card-bg)]"
        style={{
          width: avatarSize,
          height: avatarSize,
        }}
      >
        {avatarContent}
      </div>

      {/* Premium badge indicator */}
      {border.isPremium && (
        <div
          className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full text-[8px]"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            boxShadow: `0 0 6px ${colors.accent}`,
          }}
        >
          ★
        </div>
      )}
    </motion.div>
  );
});

export default AvatarBorderRenderer;
