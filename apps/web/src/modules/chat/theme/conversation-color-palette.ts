import {
  CHAT_THEME_CONVERSATION_COLORS,
  type ChatThemeConversationPresetColor,
} from '@cgraph-dev/shared-types/chat-theme';

export interface ConversationColorSwatch {
  readonly background: string;
  readonly foreground: string;
}

/** CGraph-owned visual adapter for the shared cross-platform color identifiers. */
export const CONVERSATION_COLOR_PALETTE = {
  ultramarine: { background: '#3f51b5', foreground: '#ffffff' },
  crimson: { background: '#d61f45', foreground: '#ffffff' },
  vermilion: { background: '#e9502c', foreground: '#ffffff' },
  burlap: { background: '#8a6e4b', foreground: '#ffffff' },
  forest: { background: '#2b7a4b', foreground: '#ffffff' },
  wintergreen: { background: '#1b8f77', foreground: '#ffffff' },
  teal: { background: '#147d8d', foreground: '#ffffff' },
  blue: { background: '#2679d9', foreground: '#ffffff' },
  indigo: { background: '#5f58cb', foreground: '#ffffff' },
  violet: { background: '#8c57c9', foreground: '#ffffff' },
  plum: { background: '#a85b96', foreground: '#ffffff' },
  taupe: { background: '#806e70', foreground: '#ffffff' },
  steel: { background: '#617c95', foreground: '#ffffff' },
  ember: { background: '#d96d3b', foreground: '#ffffff' },
  midnight: { background: '#34466e', foreground: '#ffffff' },
  infrared: { background: '#e3335c', foreground: '#ffffff' },
  lagoon: { background: '#247d99', foreground: '#ffffff' },
  fluorescent: { background: '#7ba72c', foreground: '#111827' },
  basil: { background: '#5b8e43', foreground: '#ffffff' },
  sublime: { background: '#377da0', foreground: '#ffffff' },
  sea: { background: '#278b81', foreground: '#ffffff' },
  tangerine: { background: '#e7852a', foreground: '#111827' },
} as const satisfies Readonly<Record<ChatThemeConversationPresetColor, ConversationColorSwatch>>;

export function getConversationColorSwatch(
  color: ChatThemeConversationPresetColor,
): ConversationColorSwatch {
  return CONVERSATION_COLOR_PALETTE[color];
}

export const CONVERSATION_COLOR_IDS = CHAT_THEME_CONVERSATION_COLORS;
