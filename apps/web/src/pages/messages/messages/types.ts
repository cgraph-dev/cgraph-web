/**
 * Messages Types
 *
 * Type definitions for the messages page components.
 */

import type { Conversation } from '@/modules/chat/store/chatStore.impl';
import type { ConversationSpace } from './conversation-spaces';

/**
 * Online status map by conversation-user key
 */
export type OnlineStatusMap = Record<string, boolean>;

/**
 * ConversationItem component props
 */
export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onlineStatus: OnlineStatusMap;
  onMarkAsRead: (conversationId: string) => void;
  onMarkAsUnread: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
  onUnarchive: (conversationId: string) => void;
  onPin: (conversationId: string, pinned: boolean) => void;
  onMute: (conversationId: string, muted: boolean) => void;
  spaces: readonly ConversationSpace[];
  onToggleSpace: (conversationId: string, spaceId: string, shouldInclude: boolean) => void;
  showArchived: boolean;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  searchQuery: string;
}

/**
 * Conversation sidebar props
 */
export interface ConversationSidebarProps {
  conversations: readonly Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  onlineStatus: OnlineStatusMap;
  searchQuery: string;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onOpenSearch: () => void;
  onNewConversation: () => void;
  onMarkAsRead: (conversationId: string) => void;
  onMarkAsUnread: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
  onUnarchive: (conversationId: string) => void;
  onPin: (conversationId: string, pinned: boolean) => void;
  onMute: (conversationId: string, muted: boolean) => void;
  spaces: readonly ConversationSpace[];
  onToggleSpace: (conversationId: string, spaceId: string, shouldInclude: boolean) => void;
  showArchived: boolean;
  onShowArchivedChange: (showArchived: boolean) => void;
}

// Re-export store types for convenience
export type { Conversation } from '@/modules/chat/store/chatStore.impl';
