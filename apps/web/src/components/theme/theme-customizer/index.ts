/**
 * Theme Customizer Module
 *
 * Comprehensive theme customization panel with live preview.
 *
 */

// Main component
export { ThemeCustomizer, default } from './theme-customizer';

// Tab components
export { ColorTab } from './color-tab';
export { AvatarTab } from './avatar-tab';
export { BubblesTab } from './bubbles-tab';
export { LivePreview } from './live-preview';

// Constants
export { TABS, AVATAR_BORDER_OPTIONS, BUBBLE_STYLE_OPTIONS, QUICK_PRESETS } from './constants';

// Types
export type {
  ThemeCustomizerProps,
  TabId,
  TabDefinition,
  AvatarBorderOption,
  BubbleStyleOption,
  QuickPresetOption,
  ColorTabProps,
  AvatarTabProps,
  BubblesTabProps,
  BubbleSettings,
} from './types';
