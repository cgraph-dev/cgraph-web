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
      const searchPromises: Promise<void>[] = [];

      // Search users
      if (category === 'all' || category === 'users') {
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
      if (category === 'all' || category === 'messages') {
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
      if (category === 'all' || category === 'posts') {
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
      if (category === 'all' || category === 'groups') {
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
      if (category === 'all' || category === 'forums') {
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
