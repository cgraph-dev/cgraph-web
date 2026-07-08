/**
 * Friend Store
 *
 * Manages friend list, friend requests, and user blocking functionality.
 * Provides real-time presence updates and friend status tracking.
 *
 */

import { create } from 'zustand';
import { createIdempotencyKey } from '@cgraph-dev/utils';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import {
  formatRateLimitWait,
  getMaxRateLimitRemainingMs,
  rememberRateLimit,
  USER_API_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';

// Re-export types so existing consumers keep working
export type { Friend, FriendRequest, FriendState } from './friend-types';

import type { FriendIdentityPatch, FriendState } from './friend-types';
import { normalizeFriend, normalizeRequest } from './friend-normalizers';
import { registerFriendBlockSyncHandler } from './friendStore.sync';
import { useNotificationStore } from './notificationStore.impl';

const FRIEND_READ_RATE_LIMIT_SCOPE = 'friends:read';
const FRIEND_WRITE_RATE_LIMIT_SCOPE = 'friends:write';
const FRIEND_READ_SCOPES = [USER_API_RATE_LIMIT_SCOPE, FRIEND_READ_RATE_LIMIT_SCOPE] as const;
const FRIEND_WRITE_SCOPES = [USER_API_RATE_LIMIT_SCOPE, FRIEND_WRITE_RATE_LIMIT_SCOPE] as const;

type FriendReadKey = 'friends' | 'incoming' | 'outgoing';

const friendReadInFlight = new Map<FriendReadKey, Promise<void>>();

function resetFriendReadGuards() {
  friendReadInFlight.clear();
}

function patchRequestUser(userId: string, patch: FriendIdentityPatch) {
  return (request: FriendState['pendingRequests'][number]) =>
    request.user.id === userId ? { ...request, user: { ...request.user, ...patch } } : request;
}

function requestUserIdById(requests: FriendState['pendingRequests'], requestId: string) {
  return requests.find((request) => request.id === requestId)?.user.id ?? '';
}

function dismissFriendRequestNotificationFrom(userId: string) {
  if (!userId) return;
  useNotificationStore.getState().dismissFriendRequestNotificationsFromUser(userId);
}

function shouldPauseFriendRead(set: (state: Partial<FriendState>) => void): boolean {
  const remaining = getMaxRateLimitRemainingMs(FRIEND_READ_SCOPES);
  if (remaining <= 0) return false;
  set({ isLoading: false });
  return true;
}

function handleFriendReadError(
  set: (state: Partial<FriendState>) => void,
  context: string,
  error: unknown
) {
  const rateLimitMessage = rememberRateLimit(FRIEND_READ_SCOPES, error);
  if (rateLimitMessage) {
    logger.warn(context, rateLimitMessage);
    set({ isLoading: false });
    return;
  }

  const message =
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error &&
    typeof error.error.message === 'string'
      ? error.error.message
      : 'Request failed';

  logger.error(context, error);
  set({ error: message, isLoading: false });
}

function runFriendRead(
  key: FriendReadKey,
  set: (state: Partial<FriendState>) => void,
  read: () => Promise<void>
) {
  if (shouldPauseFriendRead(set)) return Promise.resolve();

  const inFlight = friendReadInFlight.get(key);
  if (inFlight) return inFlight;

  const request = read().finally(() => {
    if (friendReadInFlight.get(key) === request) {
      friendReadInFlight.delete(key);
    }
  });

  friendReadInFlight.set(key, request);
  return request;
}

export const useFriendStore = create<FriendState>()((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: () =>
    runFriendRead('friends', set, async () => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.list();
    if (!result.ok) {
      handleFriendReadError(set, 'Failed to fetch friends', result);
      return;
    }
    set({
      friends: result.data.map(normalizeFriend),
      isLoading: false,
    });
    }),

  fetchPendingRequests: () =>
    runFriendRead('incoming', set, async () => {
    const result = await apiClient.friends.getIncomingRequests();
    if (!result.ok) {
      handleFriendReadError(set, 'Failed to fetch pending requests', result);
      return;
    }
    set({
      pendingRequests: result.data.map((r) => normalizeRequest(r, 'incoming')),
    });
    }),

  fetchSentRequests: () =>
    runFriendRead('outgoing', set, async () => {
    const result = await apiClient.friends.getOutgoingRequests();
    if (!result.ok) {
      handleFriendReadError(set, 'Failed to fetch sent requests', result);
      return;
    }
    set({
      sentRequests: result.data.map((r) => normalizeRequest(r, 'outgoing')),
    });
    }),

  upsertIncomingRequest: (request) => {
    set((state) => ({
      pendingRequests: [
        request,
        ...state.pendingRequests.filter(
          (existing) => existing.id !== request.id && existing.user.id !== request.user.id
        ),
      ],
      error: null,
    }));
  },

  sendRequest: async (usernameOrIdOrEmail: string) => {
    const remaining = getMaxRateLimitRemainingMs(FRIEND_WRITE_SCOPES);
    if (remaining > 0) {
      const message = formatRateLimitWait(remaining);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }

    set({ isLoading: true, error: null });
    const input = usernameOrIdOrEmail.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const cleaned = input.replace('#', '');
    const isUid = /^\d{1,10}$/.test(cleaned);
    const identifier = isUuid ? input : isEmail ? input : isUid ? cleaned : input;

    // Force a fresh idempotency key per request to avoid reuse conflicts in dev
    const idempotencyKey = createIdempotencyKey();

    const result = await apiClient.friends.sendRequest(identifier, undefined, idempotencyKey);
    if (!result.ok) {
      const rateLimitMessage = rememberRateLimit(FRIEND_WRITE_SCOPES, result);
      const message = rateLimitMessage ?? result.error.message;
      logger.error('Failed to send friend request', result.error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }

    if (result.data.id && result.data.to) {
      const request = normalizeRequest(result.data, 'outgoing');
      set((state) => ({
        sentRequests: [
          request,
          ...state.sentRequests.filter(
            (existing) => existing.id !== request.id && existing.user.id !== request.user.id
          ),
        ],
      }));
    } else if (result.data.id) {
      await get().fetchSentRequests();
    }

    set({ isLoading: false });
  },

  acceptRequest: async (requestId: string) => {
    const requesterId = requestUserIdById(get().pendingRequests, requestId);
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.acceptRequest(requestId);
    if (!result.ok) {
      logger.error('Failed to accept friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    dismissFriendRequestNotificationFrom(requesterId);
    await Promise.all([get().fetchFriends(), get().fetchPendingRequests()]);
    set({ isLoading: false });
  },

  declineRequest: async (requestId: string) => {
    const requesterId = requestUserIdById(get().pendingRequests, requestId);
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.declineRequest(requestId);
    if (!result.ok) {
      logger.error('Failed to decline friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    dismissFriendRequestNotificationFrom(requesterId);
    await get().fetchPendingRequests();
    set({ isLoading: false });
  },

  cancelRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.cancelRequest(requestId);
    if (!result.ok) {
      logger.error('Failed to cancel friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    set((state) => ({
      sentRequests: state.sentRequests.filter((request) => request.id !== requestId),
      isLoading: false,
    }));
  },

  removeFriend: async (friendId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.remove(friendId);
    if (!result.ok) {
      logger.error('Failed to remove friend', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    set((state) => ({
      friends: state.friends.filter((f) => f.friendshipId !== friendId),
      sentRequests: state.sentRequests.filter((r) => r.id !== friendId),
      isLoading: false,
    }));
  },

  blockUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.blockUser(userId);
    if (!result.ok) {
      logger.error('Failed to block user', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== userId),
      pendingRequests: state.pendingRequests.filter((r) => r.user.id !== userId),
      sentRequests: state.sentRequests.filter((r) => r.user.id !== userId),
      isLoading: false,
    }));
    dismissFriendRequestNotificationFrom(userId);
  },

  unblockUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.unblockUser(userId);
    if (!result.ok) {
      logger.error('Failed to unblock user', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    set({ isLoading: false });
  },

  applyIdentityPatch: (userId, patch) => {
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === userId ? { ...friend, ...patch } : friend
      ),
      pendingRequests: state.pendingRequests.map(patchRequestUser(userId, patch)),
      sentRequests: state.sentRequests.map(patchRequestUser(userId, patch)),
    }));
  },

  clearError: () => set({ error: null }),

  reset: () => {
    resetFriendReadGuards();
    set({
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      isLoading: false,
      error: null,
    });
  },
}));

registerFriendBlockSyncHandler((userId) => {
  const friendState = useFriendStore.getState();
  useFriendStore.setState({
    friends: friendState.friends.filter((friend) => friend.id !== userId),
    pendingRequests: friendState.pendingRequests.filter((request) => request.user.id !== userId),
    sentRequests: friendState.sentRequests.filter((request) => request.user.id !== userId),
  });
});
