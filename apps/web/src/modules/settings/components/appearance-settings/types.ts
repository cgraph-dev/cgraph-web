/**
 * Appearance Settings Types
 *
 * Type definitions for appearance settings components.
 */

import type { Theme } from '@/lib/theme/theme-engine';
import type { ReactNode } from 'react';

// COMPONENT PROPS

export interface ThemeCardProps {
  /** Theme to display */
  theme: Theme;
  /** Whether this theme is currently active */
  isActive: boolean;
  /** Callback when theme is selected */
  onSelect: () => void;
  /** Optional callback to delete custom theme */
  onDelete?: () => void;
  /** Whether this is a premium theme */
  isPremium?: boolean;
}

export interface SliderProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Label text */
  label: string;
  /** Optional formatted display value */
  displayValue?: string;
  /** Optional icon element */
  icon?: ReactNode;
}

export interface ToggleProps {
  /** Whether toggle is enabled */
  enabled: boolean;
  /** Change handler */
  onChange: () => void;
  /** Label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Whether toggle is disabled */
  disabled?: boolean;
}

export interface SectionHeaderProps {
  /** Icon element */
  icon: ReactNode;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
}

// THEME GROUPS

/**
 * Organized theme groups by category
 */
export interface ThemeGroups {
  dark: Theme[];
  light: Theme[];
  custom: Theme[];
}
