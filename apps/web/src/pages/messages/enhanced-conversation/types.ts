/**
 * Type definitions for EnhancedConversation module
 */

import type { Message } from '@/modules/chat/store/chatStore.impl';
import type { VoiceRecordingData } from './voice-message-upload';

export interface EnhancedMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  index: number;
  onAvatarClick?: (userId: string) => void;
}

export interface ConversationHeaderProps {
  conversationName: string;
  isTyping: boolean;
  canStartCall?: boolean;
  pinnedCount?: number;
  showPinnedMessages?: boolean;
  onTogglePinnedMessages?: () => void;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
}

export interface MessageInputAreaProps {
  messageInput: string;
  attachment: File | null;
  isSending: boolean;
  isVoiceMode: boolean;
  replyTo: Message | null;
  onVoiceModeChange: (value: boolean) => void;
  onMessageChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  onClearAttachment: () => void;
  onClearReply: () => void;
  onVoiceComplete: (data: VoiceRecordingData) => void;
  onSend: () => void;
}

export interface TypingIndicatorProps {
  typingUserIds: string[];
}
