/**
 * Social Hub - Type Definitions
 */

import type { Friend, FriendRequest } from '@/modules/social/store';

// TAB TYPES

export type SocialTab = 'friends' | 'notifications' | 'discover';

// NOTIFICATION TYPES

export type NotificationType =
  | 'friend_request'
  | 'message'
  | 'forum_reply'
  | 'achievement'
  | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatarUrl?: string;
}

// SEARCH TYPES

export type SearchResultType = 'user' | 'forum' | 'group';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  description: string;
  username?: string;
  slug?: string;
  route?: string;
  canonicalUrl?: string;
  defaultChannelId?: string;
  avatarUrl?: string;
  memberCount?: number;
  isJoined?: boolean;
}

// TAB PROPS

export interface FriendsTabProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (friendshipId: string) => Promise<void>;
  onBlockUser: (userId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface NotificationsTabProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export interface DiscoverTabProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearchChange: (query: string) => void;
  onJoinGroup: (result: SearchResult) => Promise<void>;
  joiningGroupId: string | null;
}
