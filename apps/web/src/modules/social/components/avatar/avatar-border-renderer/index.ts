/**
 * Avatar Border Renderer Module
 *
 * Provides animated avatar borders with 150+ styles,
 * Lottie-backed frames, and theme support.
 */

// Types
export type {
  AvatarBorderRendererProps,
  BorderColors,
  AvatarBorderConfig,
  BorderTheme,
} from './types';

// Animations & Helpers
export {
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getThemeStyles,
} from './animations';

// Components
export { AvatarBorderRenderer, default } from './avatar-border-renderer';
export { SimpleBorderAvatar, GlowBorderAvatar } from './presets';
