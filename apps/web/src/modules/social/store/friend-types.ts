/**
 * Friend Store – Type Definitions
 *
 * Interfaces for friends, friend requests, and the overall friend-store state.
 *
 */

import type { ProfileColorId } from '@cgraph-dev/shared-types';

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  equippedTitleId?: string | null;
  equippedBadgeIds?: readonly string[];
  equippedNameplateId?: string | null;
  profileColor?: ProfileColorId | null;
  profileTheme?: string | null;
  chatTheme?: string | null;
  displayNameFont?: string | null;
  displayNameEffect?: string | null;
  displayNameColor?: string | null;
  displayNameSecondaryColor?: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  friendshipId: string;
  createdAt: string;
  lastSeenAt?: string | null;
}

export interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
    equippedTitleId?: string | null;
    equippedBadgeIds?: readonly string[];
    equippedNameplateId?: string | null;
    profileColor?: ProfileColorId | null;
    profileTheme?: string | null;
    chatTheme?: string | null;
    displayNameFont?: string | null;
    displayNameEffect?: string | null;
    displayNameColor?: string | null;
    displayNameSecondaryColor?: string | null;
  };
  createdAt: string;
  type: 'incoming' | 'outgoing';
}

export interface FriendIdentityPatch {
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  status?: Friend['status'];
  statusMessage?: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  equippedTitleId?: string | null;
  equippedBadgeIds?: readonly string[];
  equippedNameplateId?: string | null;
  profileColor?: ProfileColorId | null;
  profileTheme?: string | null;
  chatTheme?: string | null;
  displayNameFont?: string | null;
  displayNameEffect?: string | null;
  displayNameColor?: string | null;
  displayNameSecondaryColor?: string | null;
}

export interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  upsertIncomingRequest: (request: FriendRequest) => void;
  sendRequest: (usernameOrId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  applyIdentityPatch: (userId: string, patch: FriendIdentityPatch) => void;
  clearError: () => void;
  reset: () => void;
}
