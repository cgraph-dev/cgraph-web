/**
 * Social Hub - Type Definitions
 */

import type { Friend, FriendRequest } from '@/modules/social/store';

// TAB TYPES

export type SocialTab = 'friends' | 'notifications' | 'discover';

// NOTIFICATION TYPES

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'message'
  | 'group_invite'
  | 'group_mention'
  | 'channel_mention'
  | 'forum_reply'
  | 'forum_mention'
  | 'post_reply'
  | 'achievement'
  | 'mention'
  | 'level_up'
  | 'streak_reminder'
  | 'quest_completed'
  | 'gift_received'
  | 'event_reminder'
  | 'event_invite'
  | 'system';

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
  hasMore: boolean;
  isLoadingMore: boolean;
  onSearchChange: (query: string) => void;
  onLoadMore: () => void;
  onJoinGroup: (result: SearchResult) => Promise<void>;
  joiningGroupId: string | null;
}
