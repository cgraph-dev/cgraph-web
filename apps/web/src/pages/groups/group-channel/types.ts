/**
 * GroupChannel Types
 *
 * Type definitions for the group channel page components.
 */

import type { ChannelMessage, Member } from '@/modules/groups/store';
import type { GifResult } from '@/modules/chat/components/gif-picker';

export interface StickerSelection {
  id: string;
  packId: string;
  label: string;
  emoji: string;
}

export interface VoiceRecordingData {
  blob: Blob;
  duration: number;
  waveform: number[];
}

/**
 * Message item component props
 */
export interface ChannelMessageItemProps {
  message: ChannelMessage;
  showHeader: boolean;
  isHighlighted?: boolean;
  onReply: () => void;
  onOpenThread: () => void;
  onReport?: () => void;
  onEditMessage?: (content: string) => Promise<void> | void;
  onDeleteMessage?: () => Promise<void> | void;
  onPinMessage?: () => Promise<void> | void;
  onCopyLink?: () => Promise<void> | void;
  onReaction: (emoji: string) => void;
  onToggleReaction: (emoji: string, hasReacted: boolean) => void;
  currentUserId?: string;
  canManageMessages?: boolean;
  threadReplyCount?: number;
}

/**
 * Member item component props
 */
export interface MemberItemProps {
  member: Member;
  isOffline?: boolean;
}

/**
 * Grouped messages for date-based organization
 */
export interface GroupedMessages {
  date: Date;
  messages: ChannelMessage[];
}

/**
 * Channel header props
 */
export interface ChannelHeaderProps {
  channelName: string;
  channelTopic?: string;
  channelType?: 'text' | 'announcement' | 'forum';
  channelLabel?: string;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
  notificationLevel?: 'all' | 'mentions' | 'none';
  isSavingNotifications?: boolean;
  onToggleNotifications?: () => void;
  showMembers: boolean;
  onToggleMembers: () => void;
  showPinnedMessages?: boolean;
  onTogglePinnedMessages?: () => void;
  pinnedCount?: number;
}

/**
 * Messages area props
 */
export interface MessagesAreaProps {
  groupedMessages: GroupedMessages[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  channelName: string;
  typing: readonly string[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  newMessagesBelow: number;
  onScroll: () => void;
  onJumpToLatest: () => void;
  onLoadMore: () => void;
  onReply: (message: ChannelMessage) => void;
  onOpenThread: (message: ChannelMessage) => void;
  onReport?: (message: ChannelMessage) => void;
  onEditMessage?: (message: ChannelMessage, content: string) => Promise<void> | void;
  onDeleteMessage?: (message: ChannelMessage) => Promise<void> | void;
  onPinMessage?: (message: ChannelMessage) => Promise<void> | void;
  onCopyMessageLink?: (message: ChannelMessage) => Promise<void> | void;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  currentUserId?: string;
  canManageMessages?: boolean;
  highlightedMessageId?: string | null;
  threadReplyCounts: Record<string, number>;
  formatDateHeader: (date: Date) => string;
}

/**
 * Message input props
 */
export interface MessageInputProps {
  channelName: string;
  placeholder?: string;
  messageInput: string;
  isSending: boolean;
  replyTo: ChannelMessage | null;
  attachment: File | null;
  isVoiceMode: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onVoiceModeChange: (value: boolean) => void;
  onCancelReply: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gif: GifResult) => void;
  onStickerSelect: (sticker: StickerSelection) => void;
  onVoiceComplete: (data: VoiceRecordingData) => void;
  onFileSelect: (file: File) => void;
  onClearAttachment: () => void;
}

/**
 * Members sidebar props
 */
export interface MembersSidebarProps {
  onlineMembers: readonly Member[];
  offlineMembers: readonly Member[];
  onClose?: () => void;
}

// Re-export store types for convenience
export type { ChannelMessage, Member } from '@/modules/groups/store';
