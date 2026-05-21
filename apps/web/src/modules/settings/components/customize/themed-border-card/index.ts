/**
 * themed-border-card barrel exports
 *
 * Modularized ThemedBorderCard following Google/Meta coding standards
 */

// Main component
export { default, default as ThemedBorderCard } from './themed-border-card';

// Sub-components
export { BorderCardGrid } from './border-card-grid';
export { CornerBrackets } from './corner-brackets';

// Animations
export { getBorderAnimation } from './animations';

// Types
export type {
  ThemedBorderCardProps,
  SizeConfig,
  BorderAnimationResult,
  BorderCardGridProps,
} from './types';

// Constants
export { SIZE_CONFIG, COLUMN_CLASSES } from './constants';
