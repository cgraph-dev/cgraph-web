/**
 * Theme-aware avatar component.
 */
import { durations } from '@cgraph-dev/animation-constants';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useThemeStore, THEME_COLORS } from '@/stores';

import type { AvatarBorderType, EffectPreset, ThemeColorPreset, UserTheme } from '@/stores';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import type { AvatarBorderConfig } from '@/types/avatar-borders';
import { getBorderById } from '@/data/avatar-borders';
import { tweens, loop } from '@/lib/animation-presets';
import { getLegacyAvatarBorderAnimation } from './avatar-border-motion';

interface ThemedAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  className?: string;
  userTheme?: Partial<UserTheme>; // For displaying other users' avatars with their theme
  avatarBorderId?: string | null;
  avatarBorderConfig?: AvatarBorderConfig;
  /** Gamification equipped border (animated CSS borders) */
  equippedBorder?: Record<string, unknown> | null;
  /** Initials or short fallback text shown when no avatar image is available. */
  fallbackText?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

interface AvatarTheme {
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ThemeColorPreset;
  animationSpeed: NonNullable<UserTheme['animationSpeed']>;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  effectPreset: EffectPreset;
}

const sizeMap = {
  xs: 'w-6 h-6',
  small: 'w-8 h-8',
  medium: 'w-12 h-12',
  large: 'w-16 h-16',
  xlarge: 'w-24 h-24',
  xxlarge: 'w-28 h-28',
};

const borderWidthMap = {
  xs: 1,
  small: 2,
  medium: 3,
  large: 4,
  xlarge: 5,
  xxlarge: 5,
};

const sizePxMap = {
  xs: 24,
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
  xxlarge: 112,
};

// Animation speed multipliers - extracted from nested ternary
const ANIMATION_SPEED_MULTIPLIERS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 2,
  normal: 1,
  fast: 0.5,
};

/**
 */
/**
 * Themed Avatar component.
 */
export function ThemedAvatar({
  src,
  alt = 'Avatar',
  size = 'medium',
  className = '',
  userTheme,
  avatarBorderId,
  avatarBorderConfig,
  equippedBorder,
  fallbackText,
  onClick,
  style,
}: ThemedAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const currentUserTheme: AvatarTheme = {
    avatarBorder: useThemeStore((state) => state.avatarBorder),
    avatarBorderColor: useThemeStore((state) => state.avatarBorderColor),
    animationSpeed: useThemeStore((state) => state.animationSpeed),
    particlesEnabled: useThemeStore((state) => state.particlesEnabled),
    glowEnabled: useThemeStore((state) => state.glowEnabled),
    effectPreset: useThemeStore((state) => state.effectPreset),
  };

  const theme: AvatarTheme = {
    avatarBorder: userTheme?.avatarBorder ?? currentUserTheme.avatarBorder,
    avatarBorderColor: userTheme?.avatarBorderColor ?? currentUserTheme.avatarBorderColor,
    animationSpeed: userTheme?.animationSpeed ?? currentUserTheme.animationSpeed,
    particlesEnabled: userTheme?.particlesEnabled ?? currentUserTheme.particlesEnabled,
    glowEnabled: userTheme?.glowEnabled ?? currentUserTheme.glowEnabled,
    effectPreset: currentUserTheme.effectPreset,
  };
  const colors = THEME_COLORS[theme.avatarBorderColor];

  const borderWidth = borderWidthMap[size];
  const speedMultiplier = ANIMATION_SPEED_MULTIPLIERS[theme.animationSpeed];
  const displaySrc = src && !imageFailed ? src : null;
  const fallbackInitial =
    (fallbackText || alt || 'U').trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const fallbackNode = (
    <span
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600 font-black text-white"
      aria-hidden="true"
    >
      {fallbackInitial}
    </span>
  );

  // Prefer advanced avatar borders when provided (discord-style compatibility)
  const resolvedBorder: AvatarBorderConfig | undefined =
    avatarBorderConfig ||
    (avatarBorderId ? getBorderById(avatarBorderId) : undefined) ||
    (equippedBorder && typeof equippedBorder.id === 'string'
      ? getBorderById(equippedBorder.id)
      : undefined);

  if (resolvedBorder) {
    return (
      <div className={className} style={style} data-avatar-border-id={resolvedBorder.id}>
        <AvatarBorderRenderer
          src={displaySrc || undefined}
          alt={alt}
          border={resolvedBorder}
          size={sizePxMap[size]}
          animationSpeed={speedMultiplier}
          interactive={!!onClick}
          onClick={onClick}
          fallback={fallbackNode}
        >
          {!displaySrc ? fallbackNode : undefined}
        </AvatarBorderRenderer>
      </div>
    );
  }

  const animation = getLegacyAvatarBorderAnimation({
    border: theme.avatarBorder,
    colors,
    glowEnabled: theme.glowEnabled,
  });
  const hasAnimation = Object.keys(animation).length > 0;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-full ${sizeMap[size]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        border: theme.avatarBorder !== 'none' ? `${borderWidth}px solid ${colors.primary}` : 'none',
        ...style,
      }}
      animate={hasAnimation ? animation : undefined}
      transition={
        hasAnimation
          ? {
              duration: (durations.loop.ms / 1000) * speedMultiplier,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
      whileHover={onClick ? { scale: 1 } : undefined}
      whileTap={onClick ? { scale: 1 } : undefined}
      onClick={onClick}
      data-avatar-border-id={avatarBorderId ?? undefined}
    >
      {/* Avatar Image */}
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        fallbackNode
      )}

      {/* Gradient overlay for glassmorphism effect */}
      {theme.effectPreset === 'glassmorphism' && theme.glowEnabled && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}

      {/* Holographic effect */}
      {theme.effectPreset === 'holographic' && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
          transition={loop(tweens.decorative)}
        />
      )}
    </motion.div>
  );
}
