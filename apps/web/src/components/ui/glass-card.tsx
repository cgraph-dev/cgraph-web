import { durations } from '@cgraph-dev/animation-constants';
import { useState } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';
import { cn } from '@/lib/utils';
import { useThrottledCallback, usePrefersReducedMotion } from '@/hooks';
import { useThemeEnhanced } from '@/providers/theme-enhanced';
import type { ThemeVariant } from '@/lib/theme/types';
import type { GlassCardProps } from './glass-card.types';
import { themeVariantStyles, themeBehavior } from './glass-card.constants';

export type { GlassCardProps } from './glass-card.types';

/** Resolves the theme variant, defaulting to aurora if not specified. */
function resolveThemeVariant(theme: { variant?: ThemeVariant }): ThemeVariant {
  return theme.variant ?? 'aurora';
}
/** Glassmorphism card with optional glow and theme-aware styling. */
export default function GlassCard({
  children,
  variant = 'default',
  intensity: _intensity = 'medium',
  glow = false,
  glowColor: glowColorProp,
  shimmer: _shimmer = false,
  borderGradient = false,
  particles = false,
  spotlight = false,
  themeVariant: themeVariantOverride,
  className,
  ...props
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // --- Theme awareness ---
  const { theme } = useThemeEnhanced();
  const activeVariant: ThemeVariant = themeVariantOverride ?? resolveThemeVariant(theme);
  const behavior = themeBehavior[activeVariant];

  // Theme-aware default glow color
  const GLOW_COLORS: Record<ThemeVariant, string> = {
    aurora: 'color-mix(in srgb, var(--color-brand-purple) 30%, transparent)',
    dark: 'rgba(223, 255, 10, 0.25)',
    light: 'rgba(37, 99, 235, 0.15)',
    bubble: 'rgba(139, 92, 246, 0.3)',
  };
  const glowColor = glowColorProp ?? GLOW_COLORS[activeVariant];

  const resolvedStyles = themeVariantStyles[activeVariant][variant];

  // --- Feature gating per theme + reduced motion ---
  const effectiveSpotlight = spotlight && behavior.spotlight && !prefersReducedMotion;
  const effectiveParticles = particles && behavior.particles && !prefersReducedMotion;

  // Pixel-space mouse position for spotlight
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);

  // Spotlight remains opt-in. Profile/theme surfaces must never receive a
  // synthetic moving reflection on top of user-selected artwork.
  const spotlightBackground = useMotionTemplate`radial-gradient(300px circle at ${spotlightX}px ${spotlightY}px, ${behavior.spotlightColor}, transparent 70%)`;

  const handleMouseMoveInternal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (effectiveSpotlight) {
      const rect = e.currentTarget.getBoundingClientRect();
      spotlightX.set(e.clientX - rect.left);
      spotlightY.set(e.clientY - rect.top);
    }
  };

  // Throttle mouse move handler to 16ms (~60fps) for smooth but efficient updates
  const handleMouseMove = useThrottledCallback(
    (e: React.MouseEvent<HTMLDivElement>) => handleMouseMoveInternal(e),
    16
  );

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const { blur: backdropFilter, border, background } = resolvedStyles;

  const composedBoxShadow = (() => {
    const parts: string[] = [];
    const themeShadow = isHovered ? behavior.hoverBoxShadow : behavior.boxShadow;
    if (themeShadow && themeShadow !== 'none') parts.push(themeShadow);
    if (glow) {
      parts.push(
        isHovered
          ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, inset 0 0 10px ${glowColor}`
          : `0 0 10px ${glowColor}, inset 0 0 5px ${glowColor}`
      );
    }
    return parts.length > 0 ? parts.join(', ') : undefined;
  })();

  return (
    <motion.div
      className={cn(
        'glass-card-container relative overflow-hidden rounded-2xl',
        // Only add transition classes for compositor-friendly props
        'transition-shadow duration-300',
        className
      )}
      style={{
        boxShadow: composedBoxShadow,
        // Container query support
        containerType: 'inline-size',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Background with blur */}
      <div
        className="absolute inset-0 -z-10 rounded-2xl"
        style={{
          background,
          backdropFilter: backdropFilter !== 'none' ? backdropFilter : undefined,
          WebkitBackdropFilter: backdropFilter !== 'none' ? backdropFilter : undefined,
        }}
      />

      {/* Border gradient overlay — aurora/dark only */}
      {borderGradient && activeVariant !== 'light' && (
        <div
          className="absolute inset-0 -z-10 rounded-2xl"
          style={{
            padding: '2px',
            background:
              activeVariant === 'dark'
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))'
                : 'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 42%, transparent), rgba(59, 130, 246, 0.28))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Particles effect - only animate when hovered, gated by theme */}
      {effectiveParticles && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-[var(--token-interactive-primary)]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3,
                willChange: isHovered ? 'transform, opacity' : 'auto',
                transform: 'translateZ(0)',
              }}
              animate={
                isHovered
                  ? {
                      y: [0, -20, 0],
                      opacity: [0.3, 0.6, 0.3],
                    }
                  : { y: 0, opacity: 0.3 }
              }
              transition={{
                duration: durations.loop.ms / 1000 + Math.random() * 2,
                repeat: isHovered ? Infinity : 0,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Holographic gradient overlay — aurora theme only */}
      {variant === 'holographic' && activeVariant === 'aurora' && (
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: `linear-gradient(
              135deg,
              color-mix(in srgb, var(--color-brand-purple) 20%, transparent),
              rgba(59, 130, 246, 0.16),
              color-mix(in srgb, var(--color-brand-purple) 14%, transparent)
            )`,
          }}
        />
      )}

      {/* Border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ border }} />

      {/* Spotlight border — radial gradient following cursor */}
      {effectiveSpotlight && isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: spotlightBackground }}
        />
      )}

      {/* Content — responsive padding via container query */}
      <div
        className="relative z-10"
        style={
          {
            // @container fallback — CSS container queries handled via className
            // See glass-card-container above with containerType: 'inline-size'
          }
        }
      >
        {children}
      </div>

      {/* Inner glow highlight — aurora/dark only, without pointer motion. */}
      {isHovered && glow && activeVariant !== 'light' && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
            opacity: 0.2,
          }}
        />
      )}
    </motion.div>
  );
}
