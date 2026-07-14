/**
 * Type definitions for the Cloud Chat conversation surface.
 */

import type { Message } from '@/modules/chat/store/chatStore.impl';
import type { MessagePayload } from '@/modules/chat/components/message-input';

export interface StickerSelection {
  id: string;
  packId: string;
  label: string;
  emoji: string;
}

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
  conversationId?: string;
  conversationName: string;
  avatarUrl?: string | null;
  avatarBorderId?: string | null;
  isOnline?: boolean;
  isTyping: boolean;
  canStartCall?: boolean;
  pinnedCount?: number;
  showPinnedMessages?: boolean;
  onTogglePinnedMessages?: () => void;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
}

export interface MessageInputAreaProps {
  conversationId?: string;
  attachmentNodePrice: number | null;
  isSending: boolean;
  replyTo: Message | null;
  onTyping: (isTyping: boolean) => void;
  onAttachmentNodePriceChange: (price: number | null) => void;
  onClearReply: () => void;
  onPayloadSend: (payload: MessagePayload) => Promise<void>;
}

export interface TypingIndicatorProps {
  typingUserIds: string[];
}
