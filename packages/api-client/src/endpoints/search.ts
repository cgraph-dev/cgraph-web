/**
 * Search endpoints.
 *
 * Endpoints under /api/v1/search.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  GlobalSearchResponseSchema,
  SearchSuggestionSchema,
  SearchUserSchema,
  SearchGroupSchema,
  SearchMessageSchema,
  SearchForumSchema,
  SearchPostSchema,
  RecentSearchSchema,
} from '../schemas/search';
import type {
  GlobalSearchResponse,
  SearchSuggestion,
  SearchUser,
  SearchGroup,
  SearchMessage,
  SearchForum,
  SearchPost,
  RecentSearch,
} from '../schemas/search';

const EmptySchema = z.object({}).passthrough();

export type {
  GlobalSearchResponse,
  SearchSuggestion,
  SearchUser,
  SearchGroup,
  SearchMessage,
  SearchForum,
  SearchPost,
  RecentSearch,
};

export interface SearchFilters {
  readonly type?: 'user' | 'group' | 'channel' | 'message' | 'forum' | 'post';
  readonly time_range?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  readonly sort_by?: 'relevance' | 'date' | 'popularity';
  readonly group_id?: string;
  readonly forum_id?: string;
  readonly channel_id?: string;
  readonly from_user_id?: string;
  readonly min_level?: number;
  readonly verified?: boolean;
}

/**
 * Creates search endpoints for global, per-type, and history search.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all search-related endpoint methods
 */
export function createSearchEndpoints(http: AxiosInstance) {
  return {
    /** Perform global search across all content types. */
    async global(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly filters?: SearchFilters;
      }
    ): Promise<ApiResult<GlobalSearchResponse>> {
      const params = {
        q: query,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        ...options?.filters,
      };
      return apiCall(() => http.get('/api/v1/search', { params }), GlobalSearchResponseSchema);
    },

    /** Get search suggestions. */
    async getSuggestions(query: string): Promise<ApiResult<SearchSuggestion[]>> {
      return apiCall(
        () => http.get('/api/v1/search/suggestions', { params: { q: query } }),
        SearchSuggestionSchema.array()
      );
    },

    /** Get recent searches. */
    async getRecent(): Promise<ApiResult<RecentSearch[]>> {
      return apiCall(() => http.get('/api/v1/search/recent'), RecentSearchSchema.array());
    },

    /** Get trending searches. */
    async getTrending(): Promise<ApiResult<SearchSuggestion[]>> {
      return apiCall(
        () => http.get('/api/v1/search/trending'),
        SearchSuggestionSchema.array()
      );
    },

    /** Clear recent searches. */
    async clearRecent(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete('/api/v1/search/recent'), EmptySchema);
    },

    /** Save search to history. */
    async saveToHistory(query: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/search/recent', { query }), EmptySchema);
    },

    /** Search users. */
    async searchUsers(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly min_level?: number;
        readonly verified?: boolean;
        readonly online?: boolean;
      }
    ): Promise<ApiResult<SearchUser[]>> {
      const params = { q: query, ...options };
      return apiCall(() => http.get('/api/v1/search/users', { params }), SearchUserSchema.array());
    },

    /** Search groups. */
    async searchGroups(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly category?: string;
        readonly public_only?: boolean;
        readonly sort_by?: 'relevance' | 'members' | 'activity' | 'created';
      }
    ): Promise<ApiResult<SearchGroup[]>> {
      const params = { q: query, ...options };
      return apiCall(
        () => http.get('/api/v1/search/groups', { params }),
        SearchGroupSchema.array()
      );
    },

    /** Search messages. */
    async searchMessages(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly channel_id?: string;
        readonly group_id?: string;
        readonly from_user_id?: string;
        readonly time_range?: string;
      }
    ): Promise<ApiResult<SearchMessage[]>> {
      const params = { q: query, ...options };
      return apiCall(
        () => http.get('/api/v1/search/messages', { params }),
        SearchMessageSchema.array()
      );
    },

    /** Search forums. */
    async searchForums(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly category?: string;
      }
    ): Promise<ApiResult<SearchForum[]>> {
      const params = { q: query, ...options };
      return apiCall(
        () => http.get('/api/v1/search/forums', { params }),
        SearchForumSchema.array()
      );
    },

    /** Search forum posts. */
    async searchPosts(
      query: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly forum_id?: string;
        readonly author_id?: string;
        readonly time_range?: string;
        readonly sort_by?: 'relevance' | 'date' | 'likes' | 'replies';
      }
    ): Promise<ApiResult<SearchPost[]>> {
      const params = { q: query, ...options };
      return apiCall(
        () => http.get('/api/v1/search/posts', { params }),
        SearchPostSchema.array()
      );
    },
  };
}
