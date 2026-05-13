/**
 * Logo Module
 *
 * CGraph circuit board logo system.
 * LogoIcon is the primary logo component.
 *
 */

// Main component
export { LogoIcon } from './logo-icon';

// Types
export type { LogoProps, LogoColorVariant } from './types';

// Constants
export { colorPalettes } from './colors';
export type { LogoColorPalette } from './colors';

// Default export for backward compatibility
export { LogoIcon as default } from './logo-icon';
