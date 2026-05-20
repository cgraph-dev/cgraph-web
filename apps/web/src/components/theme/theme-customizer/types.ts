/**
 * Theme Customizer Types
 *
 * Type definitions for theme customization components.
 */

import type {
  ThemeColorPreset,
  AvatarBorderType,
  ChatBubbleStylePreset,
} from '@/stores';

// COMPONENT PROPS

/**
 * Props for ThemeCustomizer component
 */
export interface ThemeCustomizerProps {
  onClose?: () => void;
  className?: string;
}

/**
 * Tab definition
 */
export interface TabDefinition {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Available tab IDs
 */
export type TabId = 'colors' | 'avatar' | 'bubbles';

// OPTION TYPES

/**
 * Avatar border option with tier requirement
 */
export interface AvatarBorderOption {
  value: AvatarBorderType;
  label: string;
  tier: 'free' | 'premium' | 'enterprise';
}

/**
 * Bubble style option with tier requirement
 */
export interface BubbleStyleOption {
  value: ChatBubbleStylePreset;
  label: string;
  tier: 'free' | 'premium' | 'enterprise';
}

/**
 * Quick preset option
 */
export interface QuickPresetOption {
  name: string;
  value: 'minimal' | 'modern' | 'vibrant' | 'elegant' | 'gaming';
}

// TAB PROPS

/**
 * Props for ColorTab component
 */
export interface ColorTabProps {
  selectedColor: ThemeColorPreset;
  onSelectColor: (color: ThemeColorPreset) => void;
}

/**
 * Props for AvatarTab component
 */
export interface AvatarTabProps {
  selectedBorder: AvatarBorderType;
  selectedColor: ThemeColorPreset;
  onSelectBorder: (border: AvatarBorderType) => void;
  onSelectColor: (color: ThemeColorPreset) => void;
  glowEnabled: boolean;
  onToggleGlow: () => void;
}

/**
 * Bubble settings state
 */
export interface BubbleSettings {
  radius: number;
  shadow: number;
  glass: boolean;
  tail: boolean;
  hover: boolean;
  entrance: string;
}

/**
 * Props for BubblesTab component
 */
export interface BubblesTabProps {
  selectedStyle: ChatBubbleStylePreset;
  selectedColor: ThemeColorPreset;
  bubbleSettings: BubbleSettings;
  onSelectStyle: (style: ChatBubbleStylePreset) => void;
  onSelectColor: (color: ThemeColorPreset) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
}
