/**
 * Profile Theme Card Module Types
 *
 * Type definitions for the profile theme card components.
 *
 */

import type { ProfileThemeConfig } from '@/data/profileThemes';

export interface ProfileThemeCardProps {
  /** Theme configuration data */
  theme: ProfileThemeConfig;
  /** Whether this theme is currently selected */
  isSelected: boolean;
  /** Callback when the theme card is clicked */
  onSelect: () => void;
  /** Whether to show the preview overlay */
  allowPreview?: boolean;
}

export interface ProfileThemeGridProps {
  /** Grid children (typically ProfileThemeCard instances) */
  children: React.ReactNode;
  /** Number of grid columns */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}
