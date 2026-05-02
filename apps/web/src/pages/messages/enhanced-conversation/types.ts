/**
 * Type definitions for EnhancedConversation module
 */

import type { Message } from '@/modules/chat/store/chatStore.impl';

export interface EnhancedMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  index: number;
  onAvatarClick?: (userId: string) => void;
}

export interface ConversationHeaderProps {
  conversationName: string;
  isTyping: boolean;
  onGenerateTheme?: () => void;
  canStartCall?: boolean;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
}

export interface MessageInputAreaProps {
  messageInput: string;
  isSending: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
}

export interface TypingIndicatorProps {
  typingUserIds: string[];
}
