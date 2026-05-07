/**
 * Friend Store
 *
 * Manages friend list, friend requests, and user blocking functionality.
 * Provides real-time presence updates and friend status tracking.
 *
 */

import { create } from 'zustand';
import { createIdempotencyKey } from '@cgraph/utils';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// Re-export types so existing consumers keep working
export type { Friend, FriendRequest, FriendState } from './friend-types';

import type { FriendState } from './friend-types';
import { normalizeFriend, normalizeRequest } from './friend-normalizers';

export const useFriendStore = create<FriendState>()((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.list();
    if (!result.ok) {
      logger.error('Failed to fetch friends', result.error);
      set({ error: result.error.message, isLoading: false });
      return;
    }
    set({
      friends: result.data.map(normalizeFriend),
      isLoading: false,
    });
  },

  fetchPendingRequests: async () => {
    const result = await apiClient.friends.getIncomingRequests();
    if (!result.ok) {
      logger.error('Failed to fetch pending requests', result.error);
      set({ error: result.error.message });
      return;
    }
    set({
      pendingRequests: result.data.map((r) => normalizeRequest(r, 'incoming')),
    });
  },

  fetchSentRequests: async () => {
    const result = await apiClient.friends.getOutgoingRequests();
    if (!result.ok) {
      logger.error('Failed to fetch sent requests', result.error);
      set({ error: result.error.message });
      return;
    }
    set({
      sentRequests: result.data.map((r) => normalizeRequest(r, 'outgoing')),
    });
  },

  upsertIncomingRequest: (request) => {
    set((state) => {
      const pendingRequests = state.pendingRequests.filter(
        (existing) => existing.id !== request.id && existing.user.id !== request.user.id
      );

      return {
        pendingRequests: [request, ...pendingRequests],
        error: null,
      };
    });
  },

  sendRequest: async (usernameOrIdOrEmail: string) => {
    set({ isLoading: true, error: null });
    const input = usernameOrIdOrEmail.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const cleaned = input.replace('#', '');
    const isUid = /^\d{1,10}$/.test(cleaned);
    const identifier = isUuid ? input : isEmail ? input : isUid ? cleaned : input;

    // Force a fresh idempotency key per request to avoid reuse conflicts in dev
    void createIdempotencyKey();

    const result = await apiClient.friends.sendRequest(identifier);
    if (!result.ok) {
      logger.error('Failed to send friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    await get().fetchSentRequests();
    set({ isLoading: false });
  },

  acceptRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.acceptRequest(requestId);
    if (!result.ok) {
      logger.error('Failed to accept friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    await Promise.all([get().fetchFriends(), get().fetchPendingRequests()]);
    set({ isLoading: false });
  },

  declineRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    const result = await apiClient.friends.declineRequest(requestId);
    if (!result.ok) {
      logger.error('Failed to decline friend request', result.error);
      set({ error: result.error.message, isLoading: false });
      throw new Error(result.error.message);
    }
    await get().fetchPendingRequests();
    set({ isLoading: false });
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
      isLoading: false,
    }));
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

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      isLoading: false,
      error: null,
    }),
}));
