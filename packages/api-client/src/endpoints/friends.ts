/**
 * Friends endpoints.
 *
 * Endpoints under /api/v1/friends and /api/v1/users.
 * All methods return ApiResult<T> — errors are surfaced, never swallowed.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  FriendRawSchema,
  FriendRequestRawSchema,
  FriendSuggestionSchema,
  UserProfileSchema,
  MutualFriendSchema,
  MutualGroupSchema,
  BlockedUserSchema,
  OnlineCountSchema,
  ToggleFavoriteSchema,
  SendRequestResponseSchema,
  UserSearchResultSchema,
} from '../schemas/friends';
import type {
  FriendRaw,
  FriendRequestRaw,
  FriendSuggestion,
  UserProfile,
  MutualFriend,
  MutualGroup,
  BlockedUser,
  OnlineCount,
  ToggleFavorite,
  SendRequestResponse,
  UserSearchResult,
} from '../schemas/friends';

export type {
  FriendRaw,
  FriendRequestRaw,
  FriendSuggestion,
  UserProfile,
  MutualFriend,
  MutualGroup,
  BlockedUser,
  OnlineCount,
  ToggleFavorite,
  SendRequestResponse,
  UserSearchResult,
};

/** Schema for endpoints that return an empty body (204 / `{}`). */
const EmptySchema = z.object({}).passthrough();

/**
 * Creates friends endpoints for managing the friend list, requests, and user actions.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all friends-related endpoint methods
 */
export function createFriendsEndpoints(http: AxiosInstance) {
  return {
    /** Get friend list. */
    async list(options?: {
      readonly limit?: number;
      readonly offset?: number;
      readonly status?: 'online' | 'offline' | 'all';
      readonly search?: string;
    }): Promise<ApiResult<FriendRaw[]>> {
      const params = {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        status: options?.status !== 'all' ? options?.status : undefined,
        search: options?.search,
      };
      return apiCall(() => http.get('/api/v1/friends', { params }), FriendRawSchema.array());
    },

    /** Get online friends count. */
    async getOnlineCount(): Promise<ApiResult<OnlineCount>> {
      return apiCall(() => http.get('/api/v1/friends/online/count'), OnlineCountSchema);
    },

    /** Get favorite friends. */
    async getFavorites(): Promise<ApiResult<FriendRaw[]>> {
      return apiCall(() => http.get('/api/v1/friends/favorites'), FriendRawSchema.array());
    },

    /** Toggle favorite status. */
    async toggleFavorite(friendshipId: string): Promise<ApiResult<ToggleFavorite>> {
      return apiCall(
        () => http.post(`/api/v1/friends/${friendshipId}/favorite`),
        ToggleFavoriteSchema
      );
    },

    /** Set friend nickname. */
    async setNickname(
      friendshipId: string,
      nickname: string | null
    ): Promise<ApiResult<FriendRaw>> {
      return apiCall(
        () => http.patch(`/api/v1/friends/${friendshipId}`, { nickname }),
        FriendRawSchema
      );
    },

    /** Remove friend. */
    async remove(friendshipId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/friends/${friendshipId}`), EmptySchema);
    },

    /** Get incoming friend requests. */
    async getIncomingRequests(): Promise<ApiResult<FriendRequestRaw[]>> {
      return apiCall(() => http.get('/api/v1/friends/requests'), FriendRequestRawSchema.array());
    },

    /** Get outgoing friend requests. */
    async getOutgoingRequests(): Promise<ApiResult<FriendRequestRaw[]>> {
      return apiCall(() => http.get('/api/v1/friends/sent'), FriendRequestRawSchema.array());
    },

    /** Send friend request. */
    async sendRequest(identifier: string, message?: string): Promise<ApiResult<SendRequestResponse>> {
      const value = identifier.trim();
      const withoutHash = value.replace('#', '');
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isUid = /^\d{1,10}$/.test(withoutHash);
      const body = isUuid
        ? { user_id: value, message }
        : isEmail
          ? { email: value, message }
          : isUid
            ? { uid: withoutHash, message }
            : { username: value, message };

      return apiCall(
        () => http.post('/api/v1/friends', body),
        SendRequestResponseSchema
      );
    },

    /** Accept friend request. */
    async acceptRequest(requestId: string): Promise<ApiResult<FriendRequestRaw>> {
      return apiCall(
        () => http.post(`/api/v1/friends/${requestId}/accept`),
        FriendRequestRawSchema
      );
    },

    /** Decline friend request. */
    async declineRequest(requestId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post(`/api/v1/friends/${requestId}/decline`), EmptySchema);
    },

    /** Cancel outgoing friend request. */
    async cancelRequest(requestId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/friends/${requestId}`), EmptySchema);
    },

    /** Get friend suggestions. */
    async getSuggestions(limit?: number): Promise<ApiResult<FriendSuggestion[]>> {
      const params = limit ? { limit } : {};
      return apiCall(
        () => http.get('/api/v1/friends/suggestions', { params }),
        FriendSuggestionSchema.array()
      );
    },

    /** Get user profile by ID. */
    async getUserProfile(userId: string): Promise<ApiResult<UserProfile>> {
      return apiCall(() => http.get(`/api/v1/users/${userId}`), UserProfileSchema);
    },

    /** Get mutual friends with a user. */
    async getMutualFriends(userId: string): Promise<ApiResult<MutualFriend[]>> {
      return apiCall(
        () => http.get(`/api/v1/friends/${userId}/mutual`),
        MutualFriendSchema.array()
      );
    },

    /** Get mutual groups with a user. */
    async getMutualGroups(userId: string): Promise<ApiResult<MutualGroup[]>> {
      return apiCall(
        () => http.get(`/api/v1/users/${userId}/mutual-groups`),
        MutualGroupSchema.array()
      );
    },

    /** Block a user. */
    async blockUser(userId: string, reason?: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post(`/api/v1/friends/${userId}/block`, { reason }), EmptySchema);
    },

    /** Unblock a user. */
    async unblockUser(userId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/friends/${userId}/block`), EmptySchema);
    },

    /** Get blocked users. */
    async getBlockedUsers(): Promise<ApiResult<BlockedUser[]>> {
      return apiCall(() => http.get('/api/v1/friends/blocked'), BlockedUserSchema.array());
    },

    /** Report a user. */
    async reportUser(
      userId: string,
      reason: string,
      details?: string
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.post(`/api/v1/users/${userId}/report`, { reason, details }),
        EmptySchema
      );
    },

    /** Search users. */
    async searchUsers(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
      }
    ): Promise<ApiResult<UserSearchResult[]>> {
      const params = {
        q: query,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
      };
      return apiCall(
        () => http.get('/api/v1/users/search', { params }),
        UserSearchResultSchema.array()
      );
    },
  };
}
