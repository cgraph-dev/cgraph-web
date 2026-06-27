import { durations } from '@cgraph-dev/animation-constants';
import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'motion/react';

interface GlowTextProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly gradient?: string | string[];
  readonly animate?: boolean;
  readonly glowIntensity?: 'low' | 'medium' | 'high';
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  readonly shimmer?: boolean;
  readonly gradientFlow?: boolean;
  readonly as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const glowIntensities = {
  low: 0.3,
  medium: 0.5,
  high: 0.8,
};

const glowBlur = {
  low: '8px',
  medium: '16px',
  high: '24px',
};

/** Glow Text. */
export default function GlowText({
  children,
  className = '',
  style,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  animate = true,
  glowIntensity = 'medium',
  size = 'xl',
  shimmer: _shimmer = false,
  gradientFlow = false,
  as: Component = 'span',
}: GlowTextProps) {
  // Parse gradient
  const gradientValue = Array.isArray(gradient)
    ? `linear-gradient(135deg, ${gradient.join(', ')})`
    : gradient;

  // Extract primary color for glow (simple extraction from gradient)
  const _primaryColor = Array.isArray(gradient)
    ? gradient[0]
    : gradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb[a]?\([^)]+\)/)?.[0] || '#667eea';
  void _primaryColor; // Reserved for future enhanced glow effects
  void _shimmer; // Prop kept for API compatibility; moving shine is disabled globally.
  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      className={`relative inline-block font-bold ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {/* Glow layer (behind) */}
      {animate && (
        <motion.span
          className="absolute inset-0 -z-10"
          style={{
            background: gradientValue,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            filter: `blur(${glowBlur[glowIntensity]})`,
            opacity: glowIntensities[glowIntensity],
          }}
          animate={{
            opacity: [
              glowIntensities[glowIntensity],
              glowIntensities[glowIntensity] * 1.5,
              glowIntensities[glowIntensity],
            ],
          }}
          transition={{
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {children}
        </motion.span>
      )}

      {/* Main text — with optional gradient flow animation */}
      {gradientFlow ? (
        <motion.span
          className="relative"
          style={{
            background:
              'linear-gradient(90deg, #10b981, var(--color-brand-purple), #06b6d4, #10b981)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            backgroundSize: '300% 100%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {children}
        </motion.span>
      ) : (
        <span
          className="relative"
          style={{
            background: gradientValue,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            backgroundSize: '100% 100%',
          }}
        >
          {children}
        </span>
      )}
    </MotionComponent>
  );
}

/**
 * Fire-animated text for legendary/epic items
 */
export function FireText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <GlowText
      className={className}
      size={size}
      gradient={['#ff4500', '#ff8c00', '#ffd700']}
      glowIntensity="high"
      shimmer
    >
      {children}
    </GlowText>
  );
}

/**
 * Electric-animated text for rare items
 */
export function ElectricText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <GlowText
      className={className}
      size={size}
      gradient={['#00ffff', '#0080ff', '#8000ff']}
      glowIntensity="high"
      shimmer
    >
      {children}
    </GlowText>
  );
}

/**
 * Rainbow-animated text for special occasions
 */
export function RainbowText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <motion.span
      className={`relative inline-block font-bold ${sizeClasses[size]} ${className}`}
      style={{
        background:
          'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff00ff, #ff0000)',
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%'],
      }}
      transition={{
        duration: durations.cinematic.ms / 1000,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}
