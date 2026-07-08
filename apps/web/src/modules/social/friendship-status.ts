import type { Friend } from './store';
import type { FriendshipStatus } from './types';

const FRIENDSHIP_STATUSES: readonly FriendshipStatus[] = [
  'none',
  'pending_sent',
  'pending_received',
  'friends',
  'blocked',
];

export interface FriendshipStatusSource {
  id: string;
  friendshipStatus?: unknown;
  friendship_status?: unknown;
  isFriend?: unknown;
  is_friend?: unknown;
  isBlocked?: unknown;
  is_blocked?: unknown;
  friendRequestSent?: unknown;
  friend_request_sent?: unknown;
  friendRequestReceived?: unknown;
  friend_request_received?: unknown;
}

export interface FriendshipCollections {
  friends?: readonly Pick<Friend, 'id'>[];
  pendingRequests?: readonly { user: { id: string } }[];
  sentRequests?: readonly { user: { id: string } }[];
}

export function normalizeFriendshipStatus(value: unknown): FriendshipStatus | null {
  return FRIENDSHIP_STATUSES.find((status) => status === value) ?? null;
}

function isTrue(value: unknown): boolean {
  return value === true;
}

export function resolveFriendshipStatus(
  source: FriendshipStatusSource,
  collections: FriendshipCollections
): FriendshipStatus {
  const explicitStatus = normalizeFriendshipStatus(source.friendshipStatus ?? source.friendship_status);

  if (explicitStatus === 'blocked' || isTrue(source.isBlocked) || isTrue(source.is_blocked)) {
    return 'blocked';
  }

  if (collections.friends?.some((friend) => friend.id === source.id)) return 'friends';

  if (collections.pendingRequests?.some((request) => request.user.id === source.id)) {
    return 'pending_received';
  }

  if (collections.sentRequests?.some((request) => request.user.id === source.id)) {
    return 'pending_sent';
  }

  if (explicitStatus) return explicitStatus;
  if (isTrue(source.isFriend) || isTrue(source.is_friend)) return 'friends';
  if (isTrue(source.friendRequestReceived) || isTrue(source.friend_request_received)) {
    return 'pending_received';
  }
  if (isTrue(source.friendRequestSent) || isTrue(source.friend_request_sent)) return 'pending_sent';

  return 'none';
}

export function friendshipActionLabel(
  friendshipStatus: FriendshipStatus,
  isSending = false
): string {
  if (isSending && friendshipStatus === 'none') return 'Sending';

  switch (friendshipStatus) {
    case 'friends':
      return 'Friends';
    case 'pending_sent':
      return 'Pending';
    case 'pending_received':
      return 'Review';
    case 'blocked':
      return 'Blocked';
    case 'none':
      return 'Add';
  }
}

export function isRelationshipActionDisabled(
  friendshipStatus: FriendshipStatus,
  isSending = false
): boolean {
  return (
    isSending ||
    friendshipStatus === 'friends' ||
    friendshipStatus === 'pending_sent' ||
    friendshipStatus === 'blocked'
  );
}
