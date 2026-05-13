/**
 * Friend Store – Normalizers
 *
 * Helper functions that transform raw API responses into typed
 * Friend / FriendRequest objects.
 *
 */

import type { Friend, FriendRequest } from './friend-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Type-safe field accessors for Record<string, unknown> API responses

function str(obj: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const v = obj?.[key];
  return typeof v === 'string' ? v : fallback;
}

function strOrNull(obj: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = obj?.[key];
    if (typeof v === 'string') return v;
  }
  return null;
}

function toRecord(val: unknown): Record<string, unknown> | undefined {
  return isRecord(val) ? val : undefined;
}

/**
 * Normalize a raw API response object to our FriendRequest format.
 *
 * Backend returns `from` for incoming and `to` for outgoing requests.
 */
export function normalizeRequest(
  data: Record<string, unknown>,
  type: 'incoming' | 'outgoing'
): FriendRequest {
  const userData = toRecord(type === 'incoming' ? data.from : data.to);

  return {
    id: str(data, 'id'),
    user: userData
      ? {
          id: str(userData, 'id'),
          username: str(userData, 'username', 'Unknown'),
          displayName: strOrNull(userData, 'display_name', 'displayName'),
          avatarUrl: strOrNull(userData, 'avatar_url', 'avatarUrl'),
          avatarBorderId: strOrNull(userData, 'avatar_border_id', 'avatarBorderId'),
          avatar_border_id: strOrNull(userData, 'avatar_border_id'),
        }
      : {
          id: 'unknown',
          username: 'Unknown User',
          displayName: null,
          avatarUrl: null,
        },
    createdAt: str(data, 'sent_at') || str(data, 'created_at') || new Date().toISOString(),
    type,
  };
}

/**
 * Normalize a realtime incoming friend-request event into store state.
 */
export function normalizeIncomingRequestEvent(data: Record<string, unknown>): FriendRequest | null {
  const requestId = str(data, 'request_id') || str(data, 'id');
  const fromUserId = str(data, 'from_user_id') || str(data, 'user_id');

  if (!requestId || !fromUserId) {
    return null;
  }

  return {
    id: requestId,
    user: {
      id: fromUserId,
      username: str(data, 'from_username') || str(data, 'username', 'Unknown'),
      displayName: strOrNull(data, 'from_display_name', 'display_name', 'displayName'),
      avatarUrl: strOrNull(data, 'from_avatar_url', 'avatar_url', 'avatarUrl'),
      avatarBorderId: strOrNull(
        data,
        'from_avatar_border_id',
        'avatar_border_id',
        'avatarBorderId'
      ),
      avatar_border_id: strOrNull(data, 'from_avatar_border_id', 'avatar_border_id'),
    },
    createdAt: str(data, 'created_at') || str(data, 'sent_at') || new Date().toISOString(),
    type: 'incoming',
  };
}

/**
 * Normalize friend data from API into our Friend interface.
 */
export function normalizeFriend(data: Record<string, unknown>): Friend {
  const userData = toRecord(data.user);

  return {
    id: str(userData, 'id') || str(data, 'id'),
    username: str(userData, 'username', 'Unknown'),
    displayName: strOrNull(userData, 'display_name', 'displayName'),
    avatarUrl: strOrNull(userData, 'avatar_url', 'avatarUrl'),
    avatarBorderId: strOrNull(userData, 'avatar_border_id', 'avatarBorderId'),
    avatar_border_id: strOrNull(userData, 'avatar_border_id'),
    status: 'offline',
    statusMessage: null,
    friendshipId: str(data, 'id'),
    createdAt: str(data, 'since') || str(data, 'created_at') || new Date().toISOString(),
  };
}
