import { ReactNode, HTMLAttributes } from 'react';
import type { ThemeVariant } from '@/lib/theme/types';

export interface GlassCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'children'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
> {
  readonly children: ReactNode;
  readonly variant?: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'aurora';
  readonly intensity?: 'subtle' | 'medium' | 'strong';
  readonly glow?: boolean;
  readonly glowColor?: string;
  readonly shimmer?: boolean;
  readonly borderGradient?: boolean;
  readonly particles?: boolean;
  readonly spotlight?: boolean;
  readonly themeVariant?: ThemeVariant;
  readonly className?: string;
}
