/**
 * Search Store Unit Tests
 *
 * Tests for the modular Zustand search store (modules/search/store).
 * Covers query/category management, multi-category search, searchById,
 * result clearing, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSearchStore } from '@/modules/search/store';
import type {
  SearchUser,
  SearchGroup,
  SearchForum,
  SearchPost,
  SearchMessage,
  SearchCategory,
} from '@/modules/search/store';
import type { GlobalSearchResponse } from '@cgraph-dev/api-client';

// Mock the raw api module (used only by searchById)
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock apiClient so search methods return ApiResult values
vi.mock('@/lib/api-client', () => {
  const rawApi = { get: vi.fn() };
  return {
    api: rawApi,
    http: rawApi,
    apiClient: {
      search: {
        global: vi.fn(),
        searchUsers: vi.fn(),
        searchGroups: vi.fn(),
        searchForums: vi.fn(),
        searchPosts: vi.fn(),
        searchMessages: vi.fn(),
      },
    },
  };
});

import { api } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import {
  clearRateLimitScopes,
  rememberRateLimit,
  SEARCH_READ_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';

// Typed mock helpers — vi.mocked() is the assertion-free Vitest idiom
const mockedApiGet = vi.mocked(api.get);
const mockedSearch = {
  global: vi.mocked(apiClient.search.global),
  searchUsers: vi.mocked(apiClient.search.searchUsers),
  searchGroups: vi.mocked(apiClient.search.searchGroups),
  searchForums: vi.mocked(apiClient.search.searchForums),
  searchPosts: vi.mocked(apiClient.search.searchPosts),
  searchMessages: vi.mocked(apiClient.search.searchMessages),
};

// Fixtures — field names match the Zod schemas (snake_case)

const mockUser: SearchUser = {
  id: 'u1',
  username: 'alice',
  display_name: 'Alice',
  avatar_url: 'https://cdn.example.com/alice.png',
  status: 'online',
};

const relatedUser: SearchUser = {
  id: 'u-related',
  username: 'brenda',
  display_name: 'Brenda',
  avatar_url: null,
  friendship_status: 'pending_received',
  is_friend: false,
  is_blocked: false,
  friend_request_sent: false,
  friend_request_received: true,
};

const mockGroup: SearchGroup = {
  id: 'g1',
  name: 'Developers',
  slug: 'developers',
  description: 'A group for devs',
  icon_url: null,
  member_count: 42,
  is_public: true,
};

const mockForum: SearchForum = {
  id: 'f1',
  name: 'General',
  slug: 'general',
  description: 'General discussion',
  icon_url: null,
  post_count: 1024,
  is_public: true,
};

const mockPost: SearchPost = {
  id: 'p1',
  title: 'Hello World',
  content: 'This is a post',
  forum_slug: 'general',
  created_at: '2026-02-01T00:00:00Z',
};

const mockMessage: SearchMessage = {
  id: 'm1',
  content: 'Hey there',
  conversation_id: 'conv-1',
  created_at: '2026-02-02T00:00:00Z',
};

const mockGlobalResults = [
  {
    id: 'u1',
    type: 'user',
    username: 'alice',
    name: 'Alice',
    avatar_url: 'https://cdn.example.com/alice.png',
    metadata: { status: 'online' },
  },
  {
    id: 'g1',
    type: 'group',
    name: 'Developers',
    description: 'A group for devs',
    metadata: { slug: 'developers', member_count: 42, is_public: true },
  },
  {
    id: 'f1',
    type: 'forum',
    name: 'General',
    description: 'General discussion',
    metadata: { slug: 'general', post_count: 1024, is_public: true },
  },
  {
    id: 'p1',
    type: 'post',
    title: 'Hello World',
    match_context: 'This is a post',
    created_at: '2026-02-01T00:00:00Z',
    metadata: { forum_slug: 'general' },
  },
  {
    id: 'm1',
    type: 'message',
    match_context: 'Hey there',
    created_at: '2026-02-02T00:00:00Z',
    metadata: { conversation_id: 'conv-1' },
  },
];

// Helpers

const okResult = <T>(data: T) => ({ ok: true as const, data });
const globalResponse = (overrides: Partial<GlobalSearchResponse> = {}): GlobalSearchResponse => ({
  users: [],
  groups: [],
  forums: [],
  posts: [],
  messages: [],
  results: [],
  ...overrides,
});
const errResult = () => ({
  ok: false as const,
  error: { code: 'error', message: 'failed' },
  status: 500,
});

const getInitialState = () => ({
  query: '',
  category: 'all' as SearchCategory,
  users: [] as SearchUser[],
  groups: [] as SearchGroup[],
  forums: [] as SearchForum[],
  posts: [] as SearchPost[],
  messages: [] as SearchMessage[],
  isLoading: false,
  isLoadingMore: false,
  error: null as string | null,
  hasSearched: false,
  activeRequestId: null as number | null,
  pageInfo: {},
  hasMore: false,
});

// Default: all search mocks return empty ok results
function setupEmptyMocks() {
  mockedSearch.global.mockResolvedValue(okResult(globalResponse()));
  mockedSearch.searchUsers.mockResolvedValue(okResult([]));
  mockedSearch.searchGroups.mockResolvedValue(okResult([]));
  mockedSearch.searchForums.mockResolvedValue(okResult([]));
  mockedSearch.searchPosts.mockResolvedValue(okResult([]));
  mockedSearch.searchMessages.mockResolvedValue(okResult([]));
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

// Tests

afterEach(() => {
  clearRateLimitScopes([SEARCH_READ_RATE_LIMIT_SCOPE]);
  useSearchStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('Search Store', () => {
  // 1. Initial state
  describe('initial state', () => {
    beforeEach(() => {
      useSearchStore.setState(getInitialState());
    });

    it('should have empty query', () => {
      expect(useSearchStore.getState().query).toBe('');
    });

    it('should default category to "all"', () => {
      expect(useSearchStore.getState().category).toBe('all');
    });

    it('should have empty result arrays', () => {
      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.groups).toEqual([]);
      expect(s.forums).toEqual([]);
      expect(s.posts).toEqual([]);
      expect(s.messages).toEqual([]);
    });

    it('should not be loading', () => {
      expect(useSearchStore.getState().isLoading).toBe(false);
    });

    it('should not be loading more', () => {
      expect(useSearchStore.getState().isLoadingMore).toBe(false);
    });

    it('should have no error', () => {
      expect(useSearchStore.getState().error).toBeNull();
    });

    it('should have hasSearched as false', () => {
      expect(useSearchStore.getState().hasSearched).toBe(false);
    });

    it('should have no active search request', () => {
      expect(useSearchStore.getState().activeRequestId).toBeNull();
    });
  });

  // 2. setQuery
  describe('setQuery', () => {
    it('should update the query', () => {
      useSearchStore.getState().setQuery('hello');
      expect(useSearchStore.getState().query).toBe('hello');
    });

    it('should allow setting back to empty string', () => {
      useSearchStore.getState().setQuery('test');
      useSearchStore.getState().setQuery('');
      expect(useSearchStore.getState().query).toBe('');
    });
  });

  // 3. setCategory
  describe('setCategory', () => {
    const categories: SearchCategory[] = ['all', 'users', 'groups', 'forums', 'posts', 'messages'];

    it.each(categories)('should set category to "%s"', (cat) => {
      useSearchStore.getState().setCategory(cat);
      expect(useSearchStore.getState().category).toBe(cat);
    });

    it('should switch categories without affecting query', () => {
      useSearchStore.getState().setQuery('my query');
      useSearchStore.getState().setCategory('posts');
      expect(useSearchStore.getState().query).toBe('my query');
      expect(useSearchStore.getState().category).toBe('posts');
    });
  });

  // 4. search – category "all"
  describe('search (category: all)', () => {
    beforeEach(() => {
      useSearchStore.setState({ category: 'all' });
    });

    it('should set isLoading while searching', async () => {
      mockedSearch.global.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(okResult(globalResponse())), 50))
      );

      useSearchStore.getState().setQuery('test');
      const p = useSearchStore.getState().search();
      expect(useSearchStore.getState().isLoading).toBe(true);
      await p;
      expect(useSearchStore.getState().isLoading).toBe(false);
    });

    it('should use the single global search endpoint', async () => {
      setupEmptyMocks();
      useSearchStore.getState().setQuery('hello');
      await useSearchStore.getState().search();

      expect(mockedSearch.global).toHaveBeenCalledWith('hello', { limit: 50 });
      expect(mockedSearch.searchUsers).not.toHaveBeenCalled();
      expect(mockedSearch.searchMessages).not.toHaveBeenCalled();
      expect(mockedSearch.searchPosts).not.toHaveBeenCalled();
      expect(mockedSearch.searchGroups).not.toHaveBeenCalled();
      expect(mockedSearch.searchForums).not.toHaveBeenCalled();
    });

    it('should populate result arrays from the global API response', async () => {
      mockedSearch.global.mockResolvedValue(okResult(globalResponse({ results: mockGlobalResults })));

      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toHaveLength(1);
      expect(s.groups).toHaveLength(1);
      expect(s.forums).toHaveLength(1);
      expect(s.posts).toHaveLength(1);
      expect(s.messages).toHaveLength(1);
      expect(s.hasSearched).toBe(true);
    });

    it('should populate buckets and page info from the backend global response', async () => {
      mockedSearch.global.mockResolvedValue(
        okResult(globalResponse({
          query: 'test',
          users: [mockUser],
          groups: [mockGroup],
          forums: [],
          posts: [mockPost],
          messages: [mockMessage],
          results: [],
          page_info: {
            users: {
              count: 1,
              total: 3,
              limit: 1,
              has_more: true,
              end_reached: false,
              start_cursor: null,
              end_cursor: 'users-cursor',
            },
            posts: {
              count: 1,
              total: 1,
              limit: 1,
              has_more: false,
              end_reached: true,
              start_cursor: null,
              end_cursor: null,
            },
          },
        }))
      );

      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([mockUser]);
      expect(s.groups).toEqual([mockGroup]);
      expect(s.posts).toEqual([mockPost]);
      expect(s.messages).toEqual([mockMessage]);
      expect(s.pageInfo.users).toMatchObject({
        count: 1,
        total: 3,
        limit: 1,
        has_more: true,
        end_reached: false,
        end_cursor: 'users-cursor',
      });
      expect(s.pageInfo.posts).toMatchObject({
        has_more: false,
        end_reached: true,
      });
      expect(s.hasMore).toBe(true);
    });

    it('preserves friendship context from typed global user buckets', async () => {
      mockedSearch.global.mockResolvedValue(
        okResult(globalResponse({
          query: 'brenda',
          users: [relatedUser],
          results: [],
        }))
      );

      useSearchStore.getState().setQuery('brenda');
      await useSearchStore.getState().search();

      expect(useSearchStore.getState().users[0]).toMatchObject({
        id: 'u-related',
        friendship_status: 'pending_received',
        is_friend: false,
        is_blocked: false,
        friend_request_sent: false,
        friend_request_received: true,
      });
    });

    it('should set hasSearched to true after search completes', async () => {
      setupEmptyMocks();
      useSearchStore.getState().setQuery('anything');
      await useSearchStore.getState().search();
      expect(useSearchStore.getState().hasSearched).toBe(true);
    });

    it('should clear results and set hasSearched false when query is blank', async () => {
      useSearchStore.setState({ users: [mockUser], hasSearched: true });
      useSearchStore.getState().setQuery('   ');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.hasSearched).toBe(false);
      expect(s.pageInfo).toEqual({});
      expect(s.hasMore).toBe(false);
    });

    it('should use empty arrays when the global result is not ok', async () => {
      mockedSearch.global.mockResolvedValue(errResult());

      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      expect(useSearchStore.getState().users).toEqual([]);
      expect(useSearchStore.getState().groups).toEqual([]);
      expect(useSearchStore.getState().pageInfo).toEqual({});
      expect(useSearchStore.getState().hasMore).toBe(false);
    });

    it('should skip global search while the search cooldown is active', async () => {
      rememberRateLimit([SEARCH_READ_RATE_LIMIT_SCOPE], {
        response: {
          status: 429,
          data: {
            error: {
              message: 'Too many requests. Please wait 18 seconds before retrying.',
              details: { retry_after_seconds: 18 },
            },
          },
        },
      });

      useSearchStore.getState().setQuery('alice');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(mockedSearch.global).not.toHaveBeenCalled();
      expect(s.error).toContain('Too many requests');
      expect(s.isLoading).toBe(false);
      expect(s.hasSearched).toBe(true);
    });

    it('should remember global search rate limits and skip the next search', async () => {
      mockedSearch.global.mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            error: {
              message: 'Too many requests. Please wait 18 seconds before retrying.',
              details: { retry_after_seconds: 18 },
            },
          },
        },
      });

      useSearchStore.getState().setQuery('alice');
      await useSearchStore.getState().search();

      expect(useSearchStore.getState().error).toContain('Too many requests');

      mockedSearch.global.mockClear();
      await useSearchStore.getState().search('alice again');

      expect(mockedSearch.global).not.toHaveBeenCalled();
      expect(useSearchStore.getState().error).toContain('Too many requests');
    });

    it('should ignore stale global responses after a newer search completes', async () => {
      const stale = deferred<ReturnType<typeof okResult<GlobalSearchResponse>>>();
      const fresh = deferred<ReturnType<typeof okResult<GlobalSearchResponse>>>();
      const staleResult = {
        id: 'u-stale',
        type: 'user',
        username: 'alice',
        name: 'Alice',
        metadata: { status: 'offline' },
      };
      const freshResult = {
        id: 'u-fresh',
        type: 'user',
        username: 'bob',
        name: 'Bob',
        metadata: { status: 'online' },
      };

      mockedSearch.global.mockReturnValueOnce(stale.promise).mockReturnValueOnce(fresh.promise);

      useSearchStore.getState().setQuery('alice');
      const staleSearch = useSearchStore.getState().search();

      useSearchStore.getState().setQuery('bob');
      const freshSearch = useSearchStore.getState().search();

      fresh.resolve(okResult(globalResponse({ results: [freshResult] })));
      await freshSearch;

      expect(useSearchStore.getState().users[0]?.id).toBe('u-fresh');
      expect(useSearchStore.getState().activeRequestId).toBeNull();

      stale.resolve(okResult(globalResponse({ results: [staleResult] })));
      await staleSearch;

      expect(useSearchStore.getState().users[0]?.id).toBe('u-fresh');
      expect(useSearchStore.getState().users).toHaveLength(1);
    });

    it('should ignore a global response after results are cleared', async () => {
      const pending = deferred<ReturnType<typeof okResult<GlobalSearchResponse>>>();
      mockedSearch.global.mockReturnValueOnce(pending.promise);

      useSearchStore.getState().setQuery('alice');
      const search = useSearchStore.getState().search();

      expect(useSearchStore.getState().isLoading).toBe(true);
      expect(useSearchStore.getState().activeRequestId).not.toBeNull();

      useSearchStore.getState().clearResults();

      pending.resolve(
        okResult(globalResponse({
          results: [
            {
              id: 'u-cleared',
              type: 'user',
              username: 'cleared',
              name: 'Cleared',
              metadata: { status: 'online' },
            },
          ],
        }))
      );
      await search;

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.query).toBe('');
      expect(s.isLoading).toBe(false);
      expect(s.hasSearched).toBe(false);
      expect(s.activeRequestId).toBeNull();
      expect(s.pageInfo).toEqual({});
      expect(s.hasMore).toBe(false);
    });

    it('loads more global results from the returned bucket cursor', async () => {
      const nextUser: SearchUser = {
        id: 'u2',
        username: 'brenda',
        display_name: 'Brenda',
      };

      mockedSearch.global.mockResolvedValue(
        okResult(globalResponse({
          query: 'alice',
          users: [nextUser, mockUser],
          page_info: {
            users: {
              count: 2,
              total: 2,
              limit: 1,
              has_more: false,
              end_reached: true,
              start_cursor: 'users-start-2',
              end_cursor: null,
            },
          },
        }))
      );

      useSearchStore.setState({
        category: 'all',
        query: 'alice',
        users: [mockUser],
        pageInfo: {
          users: {
            count: 1,
            total: 2,
            limit: 1,
            has_more: true,
            end_reached: false,
            start_cursor: 'users-start-1',
            end_cursor: 'users-next',
          },
        },
        hasMore: true,
        hasSearched: true,
      });

      const loadMore = useSearchStore.getState().loadMore('users');

      expect(useSearchStore.getState().isLoadingMore).toBe(true);

      await loadMore;

      expect(mockedSearch.global).toHaveBeenCalledWith('alice', {
        limit: 50,
        types: ['users'],
        cursors: { users: 'users-next' },
      });
      expect(useSearchStore.getState().users.map((user) => user.id)).toEqual(['u1', 'u2']);
      expect(useSearchStore.getState().pageInfo.users).toMatchObject({
        count: 2,
        total: 2,
        has_more: false,
        end_reached: true,
      });
      expect(useSearchStore.getState().hasMore).toBe(false);
      expect(useSearchStore.getState().isLoadingMore).toBe(false);
    });

    it('loads more global forum discovery results from the returned bucket cursor', async () => {
      const nextForum: SearchForum = {
        id: 'f2',
        name: 'Announcements',
        slug: 'announcements',
        description: 'Public updates',
        post_count: 12,
        is_public: true,
      };

      mockedSearch.global.mockResolvedValue(
        okResult(globalResponse({
          query: 'general',
          forums: [nextForum],
          page_info: {
            forums: {
              count: 1,
              total: 2,
              limit: 1,
              has_more: false,
              end_reached: true,
              start_cursor: 'forums-start-2',
              end_cursor: null,
            },
          },
        }))
      );

      useSearchStore.setState({
        category: 'all',
        query: 'general',
        forums: [mockForum],
        pageInfo: {
          forums: {
            count: 1,
            total: 2,
            limit: 1,
            has_more: true,
            end_reached: false,
            start_cursor: 'forums-start-1',
            end_cursor: 'forums-next',
          },
        },
        hasMore: true,
        hasSearched: true,
      });

      await useSearchStore.getState().loadMore('forums');

      expect(mockedSearch.global).toHaveBeenCalledWith('general', {
        limit: 50,
        types: ['forums'],
        cursors: { forums: 'forums-next' },
      });
      expect(useSearchStore.getState().forums.map((forum) => forum.id)).toEqual(['f1', 'f2']);
      expect(useSearchStore.getState().pageInfo.forums).toMatchObject({
        count: 2,
        total: 2,
        has_more: false,
        end_reached: true,
      });
      expect(useSearchStore.getState().hasMore).toBe(false);
    });

    it('stops global load more when the local bucket cap is reached', async () => {
      const currentUsers: SearchUser[] = Array.from({ length: 99 }, (_, index) => ({
        id: `u${index}`,
        username: `user-${index}`,
        display_name: `User ${index}`,
      }));
      const nextUsers: SearchUser[] = [
        {
          id: 'u99',
          username: 'user-99',
          display_name: 'User 99',
        },
        {
          id: 'u100',
          username: 'user-100',
          display_name: 'User 100',
        },
      ];

      mockedSearch.global.mockResolvedValue(
        okResult(globalResponse({
          query: 'user',
          users: nextUsers,
          page_info: {
            users: {
              count: 2,
              total: 150,
              limit: 50,
              has_more: true,
              end_reached: false,
              start_cursor: 'users-start-cap',
              end_cursor: 'users-more-after-cap',
            },
          },
        }))
      );

      useSearchStore.setState({
        category: 'all',
        query: 'user',
        users: currentUsers,
        pageInfo: {
          users: {
            count: currentUsers.length,
            total: 150,
            limit: 50,
            has_more: true,
            end_reached: false,
            start_cursor: 'users-start',
            end_cursor: 'users-next-cap',
          },
        },
        hasMore: true,
        hasSearched: true,
      });

      await useSearchStore.getState().loadMore('users');

      expect(useSearchStore.getState().users).toHaveLength(100);
      expect(useSearchStore.getState().users.at(-1)?.id).toBe('u99');
      expect(useSearchStore.getState().pageInfo.users).toMatchObject({
        count: 100,
        has_more: false,
        end_reached: true,
        end_cursor: null,
      });
      expect(useSearchStore.getState().hasMore).toBe(false);
    });
  });

  // 5. search – single category
  describe('search (single category)', () => {
    it('should only search users when category is "users"', async () => {
      mockedSearch.searchUsers.mockResolvedValue(okResult([mockUser]));
      useSearchStore.setState({ category: 'users' });
      useSearchStore.getState().setQuery('alice');

      await useSearchStore.getState().search();

      expect(mockedSearch.searchUsers).toHaveBeenCalledWith('alice');
      expect(mockedSearch.searchGroups).not.toHaveBeenCalled();
      expect(mockedSearch.searchForums).not.toHaveBeenCalled();
      expect(mockedSearch.searchPosts).not.toHaveBeenCalled();
      expect(mockedSearch.searchMessages).not.toHaveBeenCalled();
    });

    it('preserves friendship context from typed user search results', async () => {
      mockedSearch.searchUsers.mockResolvedValue(okResult([relatedUser]));
      useSearchStore.setState({ category: 'users' });
      useSearchStore.getState().setQuery('brenda');

      await useSearchStore.getState().search();

      expect(useSearchStore.getState().users[0]).toMatchObject({
        id: 'u-related',
        friendship_status: 'pending_received',
        is_friend: false,
        is_blocked: false,
        friend_request_sent: false,
        friend_request_received: true,
      });
    });

    it('stores typed endpoint cursor page info', async () => {
      mockedSearch.searchUsers.mockResolvedValue({
        ok: true,
        data: [mockUser],
        pageInfo: {
          has_next_page: true,
          has_previous_page: false,
          start_cursor: 'users-start',
          end_cursor: 'users-end',
          total_count: 7,
        },
      });
      useSearchStore.setState({ category: 'users' });
      useSearchStore.getState().setQuery('alice');

      await useSearchStore.getState().search();

      expect(useSearchStore.getState().pageInfo.users).toMatchObject({
        count: 1,
        total: 7,
        limit: 20,
        has_more: true,
        end_reached: false,
        start_cursor: 'users-start',
        end_cursor: 'users-end',
      });
      expect(useSearchStore.getState().hasMore).toBe(true);
    });

    it('should only search groups when category is "groups"', async () => {
      mockedSearch.searchGroups.mockResolvedValue(okResult([mockGroup]));
      useSearchStore.setState({ category: 'groups' });
      useSearchStore.getState().setQuery('dev');

      await useSearchStore.getState().search();

      expect(mockedSearch.searchGroups).toHaveBeenCalledWith('dev');
      expect(mockedSearch.searchUsers).not.toHaveBeenCalled();
    });

    it('should only search posts when category is "posts"', async () => {
      mockedSearch.searchPosts.mockResolvedValue(okResult([mockPost]));
      useSearchStore.setState({ category: 'posts' });
      useSearchStore.getState().setQuery('hello');

      await useSearchStore.getState().search();

      expect(mockedSearch.searchPosts).toHaveBeenCalledWith('hello');
      expect(mockedSearch.searchMessages).not.toHaveBeenCalled();
    });
  });

  // 6. search with queryOverride
  describe('search with queryOverride', () => {
    it('should use queryOverride instead of state query', async () => {
      setupEmptyMocks();
      useSearchStore.getState().setQuery('original');
      await useSearchStore.getState().search('override');

      expect(mockedSearch.global).toHaveBeenCalledWith('override', { limit: 50 });
    });
  });

  // 7. search – error resilience
  describe('search error resilience', () => {
    it('should expose an error if the global endpoint rejects', async () => {
      mockedSearch.global.mockRejectedValue(new Error('Search down'));

      useSearchStore.setState({ category: 'all' });
      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      expect(useSearchStore.getState().error).toBe('Search down');
      expect(useSearchStore.getState().hasSearched).toBe(true);
    });
  });

  // 8. searchById
  describe('searchById', () => {
    it('should fetch a user by ID', async () => {
      mockedApiGet.mockResolvedValue({ data: { id: 'u1', username: 'alice' } });

      const result = await useSearchStore.getState().searchById('user', 'u1');
      expect(mockedApiGet).toHaveBeenCalledWith('/api/v1/users/u1');
      expect(result).not.toBeNull();
    });

    it('should fetch a group by ID', async () => {
      mockedApiGet.mockResolvedValue({ data: { id: 'g1', name: 'Devs' } });

      const result = await useSearchStore.getState().searchById('group', 'g1');
      expect(mockedApiGet).toHaveBeenCalledWith('/api/v1/groups/g1');
      expect(result).not.toBeNull();
    });

    it('should fetch a forum by ID', async () => {
      mockedApiGet.mockResolvedValue({ data: { id: 'f1', name: 'General' } });

      const result = await useSearchStore.getState().searchById('forum', 'f1');
      expect(mockedApiGet).toHaveBeenCalledWith('/api/v1/forums/f1');
      expect(result).not.toBeNull();
    });

    it('should return null when the API call fails', async () => {
      mockedApiGet.mockRejectedValue(new Error('404'));

      const result = await useSearchStore.getState().searchById('user', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  // 9. clearResults
  describe('clearResults', () => {
    it('should reset all result arrays, query, and hasSearched', () => {
      useSearchStore.setState({
        users: [mockUser],
        groups: [mockGroup],
        forums: [mockForum],
        posts: [mockPost],
        messages: [mockMessage],
        query: 'something',
        hasSearched: true,
      });

      useSearchStore.getState().clearResults();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.groups).toEqual([]);
      expect(s.forums).toEqual([]);
      expect(s.posts).toEqual([]);
      expect(s.messages).toEqual([]);
      expect(s.query).toBe('');
      expect(s.hasSearched).toBe(false);
    });

    it('should NOT reset category', () => {
      useSearchStore.setState({ category: 'users', query: 'test' });
      useSearchStore.getState().clearResults();
      expect(useSearchStore.getState().category).toBe('users');
    });
  });

  // 10. clearError
  describe('clearError', () => {
    it('should set error to null', () => {
      useSearchStore.setState({ error: 'Something broke' });
      useSearchStore.getState().clearError();
      expect(useSearchStore.getState().error).toBeNull();
    });

    it('should be a no-op when error is already null', () => {
      useSearchStore.getState().clearError();
      expect(useSearchStore.getState().error).toBeNull();
    });
  });

  // 11. Edge cases
  describe('edge cases', () => {
    it('should not make API calls when searching with empty string', async () => {
      useSearchStore.getState().setQuery('');
      await useSearchStore.getState().search();
      expect(mockedSearch.searchUsers).not.toHaveBeenCalled();
    });

    it('should not make API calls when searching with whitespace-only string', async () => {
      useSearchStore.getState().setQuery('   ');
      await useSearchStore.getState().search();
      expect(mockedSearch.searchUsers).not.toHaveBeenCalled();
    });

    it('should handle empty API responses gracefully', async () => {
      setupEmptyMocks();
      useSearchStore.getState().setQuery('xyz');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.hasSearched).toBe(true);
    });
  });

  // 12. State isolation
  describe('state isolation', () => {
    it('should not change results when only query changes', () => {
      useSearchStore.setState({ users: [mockUser], query: 'old' });
      useSearchStore.getState().setQuery('new');

      expect(useSearchStore.getState().users).toHaveLength(1);
      expect(useSearchStore.getState().query).toBe('new');
    });

    it('should not change query when only category changes', () => {
      useSearchStore.setState({ query: 'hello' });
      useSearchStore.getState().setCategory('forums');

      expect(useSearchStore.getState().query).toBe('hello');
    });

    it('should preserve error when results are cleared', () => {
      useSearchStore.setState({ error: 'an error', users: [mockUser] });
      useSearchStore.getState().clearResults();

      // clearResults doesn't touch error
      expect(useSearchStore.getState().error).toBe('an error');
    });
  });
});
