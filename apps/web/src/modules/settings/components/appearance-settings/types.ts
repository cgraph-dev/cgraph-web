/**
 * Appearance Settings Types
 *
 * Type definitions for appearance settings components.
 */

import type { ReactNode } from 'react';

// COMPONENT PROPS

/**
 * Props for Toggle component
 */
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

/**
 * Props for SectionHeader component
 */
export interface SectionHeaderProps {
  /** Icon element */
  icon: ReactNode;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
}
