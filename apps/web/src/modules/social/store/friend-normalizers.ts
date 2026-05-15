/**
 * Friend Store – Normalizers
 *
 * Helper functions that transform raw API responses into typed
 * Friend / FriendRequest objects.
 *
 */

import type { Friend, FriendRequest } from './friend-types';
import { identityFieldsFromApi } from '@/lib/identity';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Type-safe field accessors for Record<string, unknown> API responses

function str(obj: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const v = obj?.[key];
  return typeof v === 'string' ? v : fallback;
}

function toRecord(val: unknown): Record<string, unknown> | undefined {
  return isRecord(val) ? val : undefined;
}

function normalizedFriendUser(
  userData: Record<string, unknown> | undefined
): FriendRequest['user'] {
  if (!userData) {
    return {
      id: 'unknown',
      username: 'Unknown User',
      displayName: null,
      avatarUrl: null,
    };
  }

  const identity = identityFieldsFromApi(userData);
  return {
    id: identity.id,
    username: identity.username || 'Unknown',
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
    avatarBorderId: identity.avatarBorderId,
    avatar_border_id: identity.avatarBorderId,
    equippedTitleId: identity.equippedTitleId,
    equippedBadgeIds: identity.equippedBadgeIds,
    equippedNameplateId: identity.equippedNameplateId,
    profileTheme: identity.profileTheme,
    chatTheme: identity.chatTheme,
    displayNameFont: identity.displayNameFont,
    displayNameEffect: identity.displayNameEffect,
    displayNameColor: identity.displayNameColor,
    displayNameSecondaryColor: identity.displayNameSecondaryColor,
  };
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
    user: normalizedFriendUser(userData),
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
      ...normalizedFriendUser(data),
      id: fromUserId,
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
  const identity = identityFieldsFromApi(userData ?? data);

  return {
    id: identity.id || str(data, 'id'),
    username: identity.username || 'Unknown',
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
    avatarBorderId: identity.avatarBorderId,
    avatar_border_id: identity.avatarBorderId,
    equippedTitleId: identity.equippedTitleId,
    equippedBadgeIds: identity.equippedBadgeIds,
    equippedNameplateId: identity.equippedNameplateId,
    profileTheme: identity.profileTheme,
    chatTheme: identity.chatTheme,
    displayNameFont: identity.displayNameFont,
    displayNameEffect: identity.displayNameEffect,
    displayNameColor: identity.displayNameColor,
    displayNameSecondaryColor: identity.displayNameSecondaryColor,
    status: 'offline',
    statusMessage: null,
    friendshipId: str(data, 'id'),
    createdAt: str(data, 'since') || str(data, 'created_at') || new Date().toISOString(),
  };
}
