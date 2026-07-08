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
  GlobalSearchResponse,
  GlobalSearchPageInfo,
  GlobalSearchPageInfoByType,
} from '@cgraph-dev/api-client';

export type { SearchUser, SearchGroup, SearchForum, SearchPost, SearchMessage };

export type SearchCategory = 'all' | 'users' | 'groups' | 'forums' | 'posts' | 'messages';
export type SearchResultCategory = Exclude<SearchCategory, 'all'>;

export interface SearchPageInfo {
  count: number;
  total: number;
  limit: number;
  has_more: boolean;
  end_reached: boolean;
  start_cursor: string | null;
  end_cursor: string | null;
}

export type SearchPageInfoByCategory = Partial<Record<SearchResultCategory, SearchPageInfo>>;

export interface SearchState {
  query: string;
  category: SearchCategory;
  users: SearchUser[];
  groups: SearchGroup[];
  forums: SearchForum[];
  posts: SearchPost[];
  messages: SearchMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasSearched: boolean;
  activeRequestId: number | null;
  pageInfo: SearchPageInfoByCategory;
  hasMore: boolean;

  // Actions
  setQuery: (query: string) => void;
  setCategory: (category: SearchCategory) => void;
  search: (query?: string) => Promise<void>;
  loadMore: (category?: SearchResultCategory) => Promise<void>;
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
const DEFAULT_TYPED_SEARCH_LIMIT = 20;
const SEARCH_RATE_LIMIT_SCOPES = [USER_API_RATE_LIMIT_SCOPE] as const;
const SEARCH_RESULT_CATEGORIES = ['users', 'groups', 'forums', 'posts', 'messages'] as const;
const SEARCH_RESULT_LIMITS: Record<SearchResultCategory, number> = {
  users: MAX_SEARCH_USERS,
  groups: MAX_SEARCH_GROUPS,
  forums: MAX_SEARCH_FORUMS,
  posts: MAX_SEARCH_POSTS,
  messages: MAX_SEARCH_MESSAGES,
};
const GLOBAL_LOAD_MORE_CATEGORIES = ['users', 'groups', 'posts', 'messages'] as const;

type SearchBuckets = Pick<SearchState, 'users' | 'groups' | 'forums' | 'posts' | 'messages'>;
type GlobalLoadMoreCategory = (typeof GLOBAL_LOAD_MORE_CATEGORIES)[number];
type GlobalLoadMoreCursors = Partial<Record<GlobalLoadMoreCategory, string>>;

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

function emptyPageInfo(): SearchPageInfoByCategory {
  return {};
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

function trimBuckets(buckets: SearchBuckets): SearchBuckets {
  return {
    users: buckets.users.slice(0, MAX_SEARCH_USERS),
    groups: buckets.groups.slice(0, MAX_SEARCH_GROUPS),
    forums: buckets.forums.slice(0, MAX_SEARCH_FORUMS),
    posts: buckets.posts.slice(0, MAX_SEARCH_POSTS),
    messages: buckets.messages.slice(0, MAX_SEARCH_MESSAGES),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberFromRecord(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function booleanFromRecord(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

function stringOrNullFromRecord(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' || value === null ? value : null;
}

function normalizePageInfoFields(
  raw: GlobalSearchPageInfo | Record<string, unknown> | undefined,
  resultCount: number,
  requestedLimit: number
): SearchPageInfo {
  const info = isRecord(raw) ? raw : {};
  const limit = numberFromRecord(info, 'limit') ?? requestedLimit;
  const count = numberFromRecord(info, 'count') ?? resultCount;
  const total = numberFromRecord(info, 'total') ?? numberFromRecord(info, 'total_count') ?? count;
  const explicitEndReached = booleanFromRecord(info, 'end_reached');
  const hasMore =
    booleanFromRecord(info, 'has_more') ??
    booleanFromRecord(info, 'has_next_page') ??
    (explicitEndReached !== undefined ? !explicitEndReached : count >= limit);

  return {
    count,
    total,
    limit,
    has_more: hasMore,
    end_reached: explicitEndReached ?? !hasMore,
    start_cursor: stringOrNullFromRecord(info, 'start_cursor'),
    end_cursor: stringOrNullFromRecord(info, 'end_cursor'),
  };
}

function normalizeGlobalPageInfo(
  pageInfo: GlobalSearchPageInfoByType | undefined,
  buckets: SearchBuckets,
  requestedLimit: number
): SearchPageInfoByCategory {
  const normalized: SearchPageInfoByCategory = {};

  for (const category of SEARCH_RESULT_CATEGORIES) {
    const results = buckets[category];
    const info = pageInfo?.[category];
    if (info || results.length > 0) {
      normalized[category] = normalizePageInfoFields(info, results.length, requestedLimit);
    }
  }

  return normalized;
}

function hasMoreFromPageInfo(pageInfo: SearchPageInfoByCategory): boolean {
  return Object.values(pageInfo).some((info) => info?.has_more === true);
}

function isGlobalLoadMoreCategory(category: SearchResultCategory): category is GlobalLoadMoreCategory {
  return GLOBAL_LOAD_MORE_CATEGORIES.includes(category as GlobalLoadMoreCategory);
}

function globalLoadMoreCursors(
  pageInfo: SearchPageInfoByCategory,
  category?: SearchResultCategory
): GlobalLoadMoreCursors {
  const categories = category ? [category] : GLOBAL_LOAD_MORE_CATEGORIES;
  const cursors: GlobalLoadMoreCursors = {};

  for (const resultCategory of categories) {
    if (!isGlobalLoadMoreCategory(resultCategory)) continue;

    const info = pageInfo[resultCategory];
    if (info?.has_more && info.end_cursor) {
      cursors[resultCategory] = info.end_cursor;
    }
  }

  return cursors;
}

function globalLoadMoreTypes(cursors: GlobalLoadMoreCursors): GlobalLoadMoreCategory[] {
  return GLOBAL_LOAD_MORE_CATEGORIES.filter((category) => Boolean(cursors[category]));
}

function appendUniqueById<T extends { id: string }>(
  current: readonly T[],
  next: readonly T[],
  maxItems: number
): T[] {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];

  for (const item of next) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged.slice(0, maxItems);
}

function mergeBuckets(current: SearchBuckets, next: SearchBuckets): SearchBuckets {
  return {
    users: appendUniqueById(current.users, next.users, MAX_SEARCH_USERS),
    groups: appendUniqueById(current.groups, next.groups, MAX_SEARCH_GROUPS),
    forums: appendUniqueById(current.forums, next.forums, MAX_SEARCH_FORUMS),
    posts: appendUniqueById(current.posts, next.posts, MAX_SEARCH_POSTS),
    messages: appendUniqueById(current.messages, next.messages, MAX_SEARCH_MESSAGES),
  };
}

function mergePageInfo(
  current: SearchPageInfoByCategory,
  next: SearchPageInfoByCategory,
  buckets: SearchBuckets
): SearchPageInfoByCategory {
  const merged = { ...current, ...next };

  for (const category of SEARCH_RESULT_CATEGORIES) {
    const info = merged[category];
    if (info) {
      const reachedClientLimit = buckets[category].length >= SEARCH_RESULT_LIMITS[category];
      merged[category] = {
        ...info,
        count: buckets[category].length,
        has_more: reachedClientLimit ? false : info.has_more,
        end_reached: reachedClientLimit ? true : info.end_reached,
        end_cursor: reachedClientLimit ? null : info.end_cursor,
      };
    }
  }

  return merged;
}

function normalizeTypedPageInfo(
  rawPageInfo: unknown,
  category: SearchResultCategory,
  resultCount: number,
  requestedLimit = DEFAULT_TYPED_SEARCH_LIMIT
): SearchPageInfoByCategory {
  return {
    [category]: normalizePageInfoFields(
      isRecord(rawPageInfo) ? rawPageInfo : undefined,
      resultCount,
      requestedLimit
    ),
  };
}

function normalizeGlobalResponse(response: GlobalSearchResponse): {
  buckets: SearchBuckets;
  pageInfo: SearchPageInfoByCategory;
} {
  const bucketed = trimBuckets({
    users: response.users,
    groups: response.groups,
    forums: response.forums,
    posts: response.posts,
    messages: response.messages,
  });

  const buckets =
    bucketed.users.length > 0 ||
    bucketed.groups.length > 0 ||
    bucketed.forums.length > 0 ||
    bucketed.posts.length > 0 ||
    bucketed.messages.length > 0
      ? bucketed
      : normalizeGlobalResults(response.results);

  return {
    buckets,
    pageInfo: normalizeGlobalPageInfo(response.page_info, buckets, MAX_GLOBAL_SEARCH_RESULTS),
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
  isLoadingMore: false,
  error: null,
  hasSearched: false,
  activeRequestId: null,
  pageInfo: {},
  hasMore: false,

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
        pageInfo: emptyPageInfo(),
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
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
        pageInfo: emptyPageInfo(),
        hasMore: false,
        error: cooldownMessage,
        isLoading: false,
        isLoadingMore: false,
        hasSearched: true,
        activeRequestId: null,
      });
      return;
    }

    set({ isLoading: true, isLoadingMore: false, error: null, activeRequestId: requestId });

    try {
      if (category === 'all') {
        const result = await apiClient.search.global(query, { limit: MAX_GLOBAL_SEARCH_RESULTS });
        const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
        if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
        const normalized = result.ok
          ? normalizeGlobalResponse(result.data)
          : { buckets: emptyBuckets(), pageInfo: emptyPageInfo() };
        set({
          ...normalized.buckets,
          pageInfo: normalized.pageInfo,
          hasMore: hasMoreFromPageInfo(normalized.pageInfo),
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
        const users = result.ok ? result.data.slice(0, MAX_SEARCH_USERS) : [];
        const pageInfo = result.ok
          ? normalizeTypedPageInfo(result.pageInfo, 'users', users.length)
          : emptyPageInfo();
        set({
          users,
          pageInfo,
          hasMore: hasMoreFromPageInfo(pageInfo),
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
        const messages = result.ok ? result.data.slice(0, MAX_SEARCH_MESSAGES) : [];
        const pageInfo = result.ok
          ? normalizeTypedPageInfo(result.pageInfo, 'messages', messages.length)
          : emptyPageInfo();
        set({
          messages,
          pageInfo,
          hasMore: hasMoreFromPageInfo(pageInfo),
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
        const posts = result.ok ? result.data.slice(0, MAX_SEARCH_POSTS) : [];
        const pageInfo = result.ok
          ? normalizeTypedPageInfo(result.pageInfo, 'posts', posts.length)
          : emptyPageInfo();
        set({
          posts,
          pageInfo,
          hasMore: hasMoreFromPageInfo(pageInfo),
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
        const groups = result.ok ? result.data.slice(0, MAX_SEARCH_GROUPS) : [];
        const pageInfo = result.ok
          ? normalizeTypedPageInfo(result.pageInfo, 'groups', groups.length)
          : emptyPageInfo();
        set({
          groups,
          pageInfo,
          hasMore: hasMoreFromPageInfo(pageInfo),
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
        const forums = result.ok ? result.data.slice(0, MAX_SEARCH_FORUMS) : [];
        const pageInfo = result.ok
          ? normalizeTypedPageInfo(result.pageInfo, 'forums', forums.length)
          : emptyPageInfo();
        set({
          forums,
          pageInfo,
          hasMore: hasMoreFromPageInfo(pageInfo),
          error: rateLimitMessage,
          isLoading: false,
          hasSearched: true,
          activeRequestId: null,
        });
        return;
      }

      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
      set({ isLoading: false, hasSearched: true, activeRequestId: null, hasMore: false });
    } catch (error: unknown) {
      const rateLimitMessage = rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, error);
      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
      set({
        error: rateLimitMessage ?? extractErrorMessage(error, 'Search failed'),
        pageInfo: emptyPageInfo(),
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        hasSearched: true,
        activeRequestId: null,
      });
    }
  },

  loadMore: async (category) => {
    const state = get();
    const query = state.query.trim();

    if (
      !query ||
      state.category !== 'all' ||
      state.isLoading ||
      state.isLoadingMore ||
      !state.hasMore
    ) {
      return;
    }

    const cursors = globalLoadMoreCursors(state.pageInfo, category);
    const types = globalLoadMoreTypes(cursors);
    if (types.length === 0) return;

    const cooldownMessage = getSearchCooldownMessage();
    if (cooldownMessage) {
      set({ error: cooldownMessage, isLoadingMore: false, activeRequestId: null });
      return;
    }

    const requestId = nextSearchRequestId();
    set({ isLoadingMore: true, error: null, activeRequestId: requestId });

    try {
      const result = await apiClient.search.global(query, {
        limit: MAX_GLOBAL_SEARCH_RESULTS,
        types,
        cursors,
      });
      const rateLimitMessage = result.ok ? null : rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, result);
      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;

      if (!result.ok) {
        set({
          error: rateLimitMessage ?? extractErrorMessage(result, 'Search failed'),
          isLoadingMore: false,
          activeRequestId: null,
        });
        return;
      }

      const normalized = normalizeGlobalResponse(result.data);
      const current = get();
      const buckets = mergeBuckets(current, normalized.buckets);
      const pageInfo = mergePageInfo(current.pageInfo, normalized.pageInfo, buckets);

      set({
        ...buckets,
        pageInfo,
        hasMore: hasMoreFromPageInfo(pageInfo),
        error: rateLimitMessage,
        isLoadingMore: false,
        hasSearched: true,
        activeRequestId: null,
      });
    } catch (error: unknown) {
      const rateLimitMessage = rememberRateLimit(SEARCH_RATE_LIMIT_SCOPES, error);
      if (!isCurrentSearchRequest(requestId, get().activeRequestId)) return;
      set({
        error: rateLimitMessage ?? extractErrorMessage(error, 'Search failed'),
        isLoadingMore: false,
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
      pageInfo: emptyPageInfo(),
      hasMore: false,
      query: '',
      isLoading: false,
      isLoadingMore: false,
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
      pageInfo: emptyPageInfo(),
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasSearched: false,
      activeRequestId: null,
    });
  },
}));
