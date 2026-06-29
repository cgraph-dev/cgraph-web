/**
 * Search store implementation.
 */
import { create } from 'zustand';
import { apiClient, http } from '@/lib/api-client';
import { ensureObject, extractErrorMessage } from '@/lib/api-utils';
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

type SearchBuckets = Pick<SearchState, 'users' | 'groups' | 'forums' | 'posts' | 'messages'>;

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

  setQuery: (query) => set({ query }),

  setCategory: (category) => set({ category }),

  search: async (queryOverride) => {
    const { query: stateQuery, category } = get();
    const query = queryOverride ?? stateQuery;

    if (!query.trim()) {
      set({
        users: [],
        groups: [],
        forums: [],
        posts: [],
        messages: [],
        hasSearched: false,
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      if (category === 'all') {
        const result = await apiClient.search.global(query, { limit: MAX_GLOBAL_SEARCH_RESULTS });
        set({
          ...(result.ok ? normalizeGlobalResults(result.data.results) : emptyBuckets()),
          isLoading: false,
          hasSearched: true,
        });
        return;
      }

      const searchPromises: Promise<void>[] = [];

      // Search users
      if (category === 'users') {
        searchPromises.push(
          apiClient.search
            .searchUsers(query)
            .then((result) => {
              set({ users: result.ok ? result.data.slice(0, MAX_SEARCH_USERS) : [] });
            })
            .catch(() => set({ users: [] }))
        );
      }

      // Search messages
      if (category === 'messages') {
        searchPromises.push(
          apiClient.search
            .searchMessages(query)
            .then((result) => {
              set({ messages: result.ok ? result.data.slice(0, MAX_SEARCH_MESSAGES) : [] });
            })
            .catch(() => set({ messages: [] }))
        );
      }

      // Search posts
      if (category === 'posts') {
        searchPromises.push(
          apiClient.search
            .searchPosts(query)
            .then((result) => {
              set({ posts: result.ok ? result.data.slice(0, MAX_SEARCH_POSTS) : [] });
            })
            .catch(() => set({ posts: [] }))
        );
      }

      // Search groups
      if (category === 'groups') {
        searchPromises.push(
          apiClient.search
            .searchGroups(query)
            .then((result) => {
              set({ groups: result.ok ? result.data.slice(0, MAX_SEARCH_GROUPS) : [] });
            })
            .catch(() => set({ groups: [] }))
        );
      }

      // Search forums
      if (category === 'forums') {
        searchPromises.push(
          apiClient.search
            .searchForums(query)
            .then((result) => {
              set({ forums: result.ok ? result.data.slice(0, MAX_SEARCH_FORUMS) : [] });
            })
            .catch(() => set({ forums: [] }))
        );
      }

      await Promise.all(searchPromises);
      set({ isLoading: false, hasSearched: true });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Search failed'),
        isLoading: false,
        hasSearched: true,
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

  clearResults: () =>
    set({
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      query: '',
      hasSearched: false,
    }),

  clearError: () => set({ error: null }),

  reset: () =>
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
    }),
}));
