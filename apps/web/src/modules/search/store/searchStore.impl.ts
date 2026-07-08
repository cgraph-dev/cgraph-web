/**
 * Search store implementation.
 */
import { create } from 'zustand';
import { apiClient, http } from '@/lib/api-client';
import { ensureObject, extractErrorMessage } from '@/lib/api-utils';
import {
  formatRateLimitWait,
  getMaxRateLimitRemainingMs,
  rememberRateLimit,
  USER_API_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';
import type {
  SearchUser,
  SearchGroup,
  SearchForum,
  SearchPost,
  SearchMessage,
  SearchResult as ApiSearchResult,
} from '@cgraph-dev/api-client';

export type { SearchUser, SearchGroup, SearchForum, SearchPost, SearchMessage };

export type SearchCategory = 'all' | 'users' | 'groups' | 'forums' | 'posts' | 'messages';

export interface SearchState {
  query: string;
  category: SearchCategory;
  users: SearchUser[];
  groups: SearchGroup[];
  forums: SearchForum[];
  posts: SearchPost[];
  messages: SearchMessage[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  activeRequestId: number | null;

  // Actions
  setQuery: (query: string) => void;
  setCategory: (category: SearchCategory) => void;
  search: (query?: string) => Promise<void>;
  searchById: (
    type: 'user' | 'group' | 'forum',
    id: string
  ) => Promise<SearchUser | SearchGroup | SearchForum | null>;
  clearResults: () => void;
  clearError: () => void;
  reset: () => void;
}

const MAX_SEARCH_USERS = 100;
const MAX_SEARCH_GROUPS = 50;
const MAX_SEARCH_FORUMS = 50;
const MAX_SEARCH_POSTS = 100;
const MAX_SEARCH_MESSAGES = 100;
const MAX_GLOBAL_SEARCH_RESULTS = 50;
const SEARCH_RATE_LIMIT_SCOPES = [USER_API_RATE_LIMIT_SCOPE] as const;

type SearchBuckets = Pick<SearchState, 'users' | 'groups' | 'forums' | 'posts' | 'messages'>;

let latestSearchRequestId = 0;

function nextSearchRequestId(): number {
  latestSearchRequestId += 1;
  return latestSearchRequestId;
}

function cancelSearchRequest(): void {
  latestSearchRequestId += 1;
}

function isCurrentSearchRequest(requestId: number, activeRequestId: number | null): boolean {
  return activeRequestId === requestId && latestSearchRequestId === requestId;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toBooleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function metadataValue(result: ApiSearchResult, key: string): unknown {
  return result.metadata?.[key];
}

function metadataString(result: ApiSearchResult, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = toStringValue(metadataValue(result, key));
    if (value) return value;
  }
  return undefined;
}

function metadataNumber(result: ApiSearchResult, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = toNumberValue(metadataValue(result, key));
    if (value !== undefined) return value;
  }
  return undefined;
}

function metadataBoolean(result: ApiSearchResult, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = toBooleanValue(metadataValue(result, key));
    if (value !== undefined) return value;
  }
  return undefined;
}

function firstString(...values: readonly unknown[]): string | undefined {
  for (const value of values) {
    const text = toStringValue(value);
    if (text) return text;
  }
  return undefined;
}

function normalizeResultType(type: string): 'user' | 'group' | 'forum' | 'post' | 'message' | null {
  switch (type.toLowerCase()) {
    case 'user':
    case 'users':
      return 'user';
    case 'group':
    case 'groups':
      return 'group';
    case 'forum':
    case 'forums':
      return 'forum';
    case 'post':
    case 'posts':
      return 'post';
    case 'message':
    case 'messages':
      return 'message';
    default:
      return null;
  }
}

function emptyBuckets(): SearchBuckets {
  return {
    users: [],
    groups: [],
    forums: [],
    posts: [],
    messages: [],
  };
}

function getSearchCooldownMessage(): string | null {
  const remaining = getMaxRateLimitRemainingMs(SEARCH_RATE_LIMIT_SCOPES);
  return remaining > 0 ? formatRateLimitWait(remaining) : null;
}

function normalizeGlobalResults(results: readonly ApiSearchResult[]): SearchBuckets {
  const buckets = emptyBuckets();

  for (const result of results) {
    const type = normalizeResultType(result.type);
    if (!type) continue;

    switch (type) {
      case 'user': {
        const username =
          firstString(result.username, metadataValue(result, 'username'), result.name, result.title) ??
          result.id;
        buckets.users.push({
          id: result.id,
          username,
          display_name: firstString(result.name, result.title, metadataValue(result, 'display_name')),
          avatar_url: firstString(result.avatar_url, result.image_url),
          canonical_url: firstString(result.url, metadataValue(result, 'canonical_url')),
          avatar_border_id: metadataString(result, 'avatar_border_id', 'avatarBorderId'),
          status: metadataString(result, 'status'),
          level: metadataNumber(result, 'level'),
          verified: metadataBoolean(result, 'verified'),
          is_online: metadataBoolean(result, 'is_online', 'isOnline'),
        });
        break;
      }

      case 'group':
        buckets.groups.push({
          id: result.id,
          name: firstString(result.name, result.title) ?? result.id,
          slug: metadataString(result, 'slug'),
          description: firstString(result.description, result.subtitle, result.match_context),
          icon_url: firstString(result.image_url, result.avatar_url),
          member_count: metadataNumber(result, 'member_count', 'memberCount'),
          is_public: metadataBoolean(result, 'is_public', 'isPublic'),
          is_member: metadataBoolean(result, 'is_member', 'isMember'),
          default_channel_id: metadataString(result, 'default_channel_id', 'defaultChannelId'),
          canonical_url: firstString(result.url, metadataValue(result, 'canonical_url')),
          category: metadataString(result, 'category'),
          created_at: result.created_at ?? undefined,
        });
        break;

      case 'forum':
        buckets.forums.push({
          id: result.id,
          name: firstString(result.name, result.title) ?? result.id,
          slug: metadataString(result, 'slug'),
          description: firstString(result.description, result.subtitle, result.match_context),
          icon_url: firstString(result.image_url, result.avatar_url),
          post_count: metadataNumber(result, 'post_count', 'postCount'),
          member_count: metadataNumber(result, 'member_count', 'memberCount'),
          is_public: metadataBoolean(result, 'is_public', 'isPublic'),
          canonical_url: firstString(result.url, metadataValue(result, 'canonical_url')),
          category: metadataString(result, 'category'),
          created_at: result.created_at ?? undefined,
        });
        break;

      case 'post':
        buckets.posts.push({
          id: result.id,
          title: firstString(result.title, result.name),
          content: firstString(result.match_context, result.description, result.subtitle),
          author_id: metadataString(result, 'author_id', 'authorId'),
          forum_id: metadataString(result, 'forum_id', 'forumId'),
          forum_slug: metadataString(result, 'forum_slug', 'forumSlug'),
          score: metadataNumber(result, 'score'),
          reply_count: metadataNumber(result, 'reply_count', 'replyCount'),
          created_at: result.created_at ?? result.timestamp ?? undefined,
          updated_at: metadataString(result, 'updated_at', 'updatedAt'),
        });
        break;

      case 'message':
        buckets.messages.push({
          id: result.id,
          content: firstString(result.match_context, result.description, result.subtitle, result.title),
          sender_id: metadataString(result, 'sender_id', 'senderId'),
          conversation_id: metadataString(result, 'conversation_id', 'conversationId'),
          channel_id: metadataString(result, 'channel_id', 'channelId') ?? null,
          group_id: metadataString(result, 'group_id', 'groupId') ?? null,
          created_at: result.created_at ?? result.timestamp ?? undefined,
          match_context: result.match_context ?? undefined,
        });
        break;
    }
  }

  return {
    users: buckets.users.slice(0, MAX_SEARCH_USERS),
    groups: buckets.groups.slice(0, MAX_SEARCH_GROUPS),
    forums: buckets.forums.slice(0, MAX_SEARCH_FORUMS),
    posts: buckets.posts.slice(0, MAX_SEARCH_POSTS),
    messages: buckets.messages.slice(0, MAX_SEARCH_MESSAGES),
  };
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  query: '',
  category: 'all',
  users: [],
  groups: [],
  forums: [],
  posts: [],
  messages: [],
  isLoading: false,
  error: null,
  hasSearched: false,
  activeRequestId: null,

  setQuery: (query) => set({ query }),

  setCategory: (category) => set({ category }),

  search: async (queryOverride) => {
    const { query: stateQuery, category } = get();
    const query = queryOverride ?? stateQuery;

    if (!query.trim()) {
      cancelSearchRequest();
      set({
        users: [],
        groups: [],
        forums: [],
        posts: [],
        messages: [],
        isLoading: false,
        hasSearched: false,
        activeRequestId: null,
      });
      return;
    }

    const requestId = nextSearchRequestId();

    const cooldownMessage = getSearchCooldownMessage();
    if (cooldownMessage) {
      set({
        ...emptyBuckets(),
        error: cooldownMessage,
        isLoading: false,
        hasSearched: true,
        activeRequestId: null,
      });
      return;
    }

    set({ isLoading: true, error: null, activeRequestId: requestId });

    try {
      if (category === 'all') {
        const result = await apiClient.search.global(query, { limit: MAX_GLOBAL_SEARCH_RESULTS });
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          ...(result.ok ? normalizeGlobalResults(result.data.results) : emptyBuckets()),
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (category === 'users') {
        const result = await apiClient.search.searchUsers(query);
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          users: result.ok ? result.data.slice(0, MAX_SEARCH_USERS) : [],
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (category === 'messages') {
        const result = await apiClient.search.searchMessages(query);
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          messages: result.ok ? result.data.slice(0, MAX_SEARCH_MESSAGES) : [],
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (category === 'posts') {
        const result = await apiClient.search.searchPosts(query);
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          posts: result.ok ? result.data.slice(0, MAX_SEARCH_POSTS) : [],
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (category === 'groups') {
        const result = await apiClient.search.searchGroups(query);
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          groups: result.ok ? result.data.slice(0, MAX_SEARCH_GROUPS) : [],
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (category === 'forums') {
        const result = await apiClient.search.searchForums(query);
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        set({
          forums: result.ok ? result.data.slice(0, MAX_SEARCH_FORUMS) : [],
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
      set({ isLoading: false, hasSearched: true, activeRequestId: null });
    } catch (error: unknown) {
      const rateLimitMessage = rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, error);
      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
      set({
        error: rateLimitMessage ?? extractErrorMessage(error, 'Search failed'),
        isLoading: false,
        hasSearched: true,
        activeRequestId: null,
      });
    }
  },

  searchById: async (type, id) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'user':
          endpoint = `/api/v1/users/${id}`;
          break;
        case 'group':
          endpoint = `/api/v1/groups/${id}`;
          break;
        case 'forum':
          endpoint = `/api/v1/forums/${id}`;
          break;
      }

      const response = await http.get(endpoint);
      return ensureObject(response.data);
    } catch {
      return null;
    }
  },

  clearResults: () => {
    cancelSearchRequest();
    set({
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      query: '',
      isLoading: false,
      hasSearched: false,
      activeRequestId: null,
    });
  },

  clearError: () => set({ error: null }),

  reset: () => {
    cancelSearchRequest();
    set({
      query: '',
      category: 'all',
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      isLoading: false,
      error: null,
      hasSearched: false,
      activeRequestId: null,
    });
  },
}));
