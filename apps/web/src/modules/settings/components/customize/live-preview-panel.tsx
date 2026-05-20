/**
 * Live Preview Panel
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 *
 * Uses the unified customization store for all settings.
 *
 * @see ./live-preview-panel for modular implementation
 */

export {
  // Types
  type PreviewBadge,
  type ThemeColors,
  // Constants
  PREVIEW_BADGES,
  // Components
  ProfileCardPreview,
  LivePreviewPanel,
  default,
} from './live-preview-panel/index';
