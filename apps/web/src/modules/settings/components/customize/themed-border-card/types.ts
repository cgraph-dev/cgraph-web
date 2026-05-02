/**
 * Type definitions for ThemedBorderCard module
 */

import type { BorderDefinition, BorderRarity } from '@/data/avatar-borders';
import type { CSSProperties } from 'react';
import type { TargetAndTransition, Transition } from 'motion/react';

/** Size configuration for border cards */
export interface SizeConfig {
  container: string;
  avatar: string;
  text: string;
  badge: string;
}

/** Result of border animation calculation */
export interface BorderAnimationResult {
  animate?: TargetAndTransition;
  transition?: Transition;
  style?: CSSProperties;
}

export interface ThemedBorderCardProps {
  border: BorderDefinition;
  isSelected: boolean;
  onSelect: () => void;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowPreview?: boolean;
}

export interface BorderCardGridProps {
  children: React.ReactNode;
  cardSize?: 'sm' | 'md' | 'lg';
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

/** Re-export necessary types */
export type { BorderDefinition, BorderRarity };
