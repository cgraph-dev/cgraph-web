/**
 * Type definitions for LivePreviewPanel module
 */

export interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp?: string;
  senderName?: string;
}

export interface PreviewBadge {
  emoji: string;
  color: string;
  name?: string;
  rarity?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}
