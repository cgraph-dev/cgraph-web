/**
 * Conversation page types
 * Extracted from Conversation.tsx for modularity
 */

import type { Message } from '@/modules/chat/store/chatStore.impl';
import type { GifResult } from '@/modules/chat/components/gif-picker';
export type { UIPreferences } from '@/modules/chat/components/message-bubble';
export { DEFAULT_UI_PREFERENCES } from '@/modules/chat/components/message-bubble';

/**
 * Pending message for E2EE retry
 */
export interface PendingE2EEMessage {
  content: string;
  replyToId?: string;
  options?: {
    type?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Voice message data from recorder
 */
export interface VoiceMessageData {
  blob: Blob;
  duration: number;
  waveform: number[];
}

/**
 * Mutual friend info for chat info panel
 */
export interface MutualFriend {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Handler types for message operations
 */
export interface MessageHandlers {
  onSend: () => Promise<void>;
  onRetryE2EE: () => Promise<void>;
  onSendUnencrypted: () => Promise<void>;
  onGifSelect: (gif: GifResult) => Promise<void>;
  onEmojiSelect: (emoji: string) => void;
  onVoiceComplete: (data: VoiceMessageData) => Promise<void>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onTyping: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onLoadMore: () => void;
}

/**
 * Call modal handlers
 */
export interface CallHandlers {
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
}

/**
 * Search result click handler params
 */
export interface SearchResultClickParams {
  conversationId: string;
  messageId: string;
}

/**
 * Re-export Message type for convenience
 */
export type { Message, GifResult };
