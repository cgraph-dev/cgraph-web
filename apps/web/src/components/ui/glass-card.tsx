import { cn } from '@/lib/utils';
import type { GlassCardProps } from './glass-card.types';

export type { GlassCardProps } from './glass-card.types';

const materialByVariant: Record<
  NonNullable<GlassCardProps['variant']>,
  'solid' | 'recessed' | 'floating' | 'glass'
> = {
  default: 'solid',
  frosted: 'glass',
  crystal: 'floating',
  neon: 'floating',
  holographic: 'glass',
  aurora: 'glass',
};

/**
 * Theme-aware material surface.
 *
 * The legacy API remains stable for callers, but visual rendering is owned by
 * the shared product material contract. Cursor spotlights, particles, shimmer,
 * and hover glows are intentionally not rendered.
 */
export default function GlassCard({
  children,
  variant = 'default',
  glow = false,
  borderGradient = false,
  intensity: _intensity,
  glowColor: _glowColor,
  shimmer: _shimmer,
  particles: _particles,
  spotlight: _spotlight,
  themeVariant,
  className,
  ...props
}: GlassCardProps) {
  const emphasized = glow || borderGradient || variant === 'neon';

  return (
    <div
      className={cn('cgraph-card relative overflow-hidden', className)}
      data-cgraph-emphasis={emphasized || undefined}
      data-cgraph-material={materialByVariant[variant]}
      data-cgraph-surface="card"
      data-cgraph-theme={themeVariant}
      {...props}
    >
      {children}
    </div>
  );
}
