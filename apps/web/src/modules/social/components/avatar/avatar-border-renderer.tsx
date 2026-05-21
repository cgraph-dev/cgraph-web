/**
 * AvatarBorderRenderer
 *
 * Renders animated avatar borders with support for:
 * - 150+ unique border styles across 20+ themes
 * - Lottie-backed frames for advanced effects
 * - Performance optimization with reduced motion support
 * - Custom color overrides
 *
 * @see ./avatar-border-renderer for modular implementation
 */

export {
  // Types
  type AvatarBorderRendererProps,
  type BorderColors,
  type AvatarBorderConfig,
  type BorderTheme,
  // Animations & Helpers
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getThemeStyles,
  // Components
  AvatarBorderRenderer,
  SimpleBorderAvatar,
  GlowBorderAvatar,
  default,
} from './avatar-border-renderer/index';
