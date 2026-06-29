/**
 * ConversationList type definitions
 */

import type { Conversation } from '@/modules/chat/store/chatStore.impl';

export type FilterType = 'all' | 'direct' | 'group' | 'unread';

export interface ConversationListProps {
  className?: string;
}

export interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: string;
  typingUsers: readonly string[];
  draftPreview?: string | null;
  onClick: () => void;
}

export interface ConversationMenuProps {
  conversation: Conversation;
  onAction: (action: 'pin' | 'mute' | 'archive' | 'delete') => void;
}

export interface NewChatModalProps {
  onClose: () => void;
}

export interface AddFriendModalProps {
  onClose: () => void;
}

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'online' | 'offline';
}

export interface FilterOption {
  id: FilterType;
  label: string;
}

export interface UseConversationListReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  pinnedConversations: Conversation[];
  regularConversations: Conversation[];
  filteredConversations: Conversation[];
  handleConversationClick: (conv: Conversation) => void;
}
