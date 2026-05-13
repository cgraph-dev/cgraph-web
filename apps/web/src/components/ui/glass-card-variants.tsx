/**
 * Glass card style variant components.
 */
import GlassCard from './glass-card';
import type { GlassCardProps } from './glass-card.types';

/**
 */
/**
 * Glass Card Neon display component.
 */
export function GlassCardNeon({ children, className, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard variant="neon" glow borderGradient shimmer className={className} {...props}>
      {children}
    </GlassCard>
  );
}
