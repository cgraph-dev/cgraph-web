/**
 * Forum *list* slice — board directory, search, leaderboard, top forums.
 *
 * Thin selector hook over the canonical `useForumStore` so consumers
 * that only need list-level state stop subscribing to thread bodies,
 * comment trees, mod queues, etc. (which trigger re-renders they don't
 * care about). Migration target for plan #19 — once every list page
 * imports `useForumListStore`, the underlying impl can be split into
 * its own Zustand store without touching callers again.
 */
import { useForumStore } from './forumStore';
import type {
  Forum,
  ForumSearchFilters,
  ForumSearchResult,
  LeaderboardMeta,
  LeaderboardSort,
  SortOption,
  TimeRange,
} from './forumStore.types';

export interface ForumListSliceState {
  readonly forums: readonly Forum[];
  readonly subscribedForums: readonly Forum[];
  readonly leaderboard: readonly Forum[];
  readonly leaderboardMeta: LeaderboardMeta | null;
  readonly topForums: readonly Forum[];
  readonly isLoadingForums: boolean;
  readonly isLoadingLeaderboard: boolean;
  readonly sortBy: SortOption;
  readonly timeRange: TimeRange;
  readonly searchResults: readonly ForumSearchResult[];
  readonly searchQuery: string;
  readonly searchFilters: ForumSearchFilters;
  readonly searchLoading: boolean;
  readonly searchHasMore: boolean;
  readonly searchCursor: string | undefined;

  fetchForums: () => Promise<void>;
  fetchLeaderboard: (sort?: LeaderboardSort, cursor?: string | null) => Promise<void>;
  fetchTopForums: (limit?: number, sort?: LeaderboardSort) => Promise<void>;
  subscribe: (forumId: string) => Promise<void>;
  unsubscribe: (forumId: string) => Promise<void>;
  setSortBy: (sort: SortOption) => void;
  setTimeRange: (range: TimeRange) => void;
  searchForums: (query: string, filters?: ForumSearchFilters) => Promise<void>;
  searchMore: () => Promise<void>;
  clearSearch: () => void;
}

const selectListSlice = (s: ReturnType<typeof useForumStore.getState>): ForumListSliceState => ({
  forums: s.forums,
  subscribedForums: s.subscribedForums,
  leaderboard: s.leaderboard,
  leaderboardMeta: s.leaderboardMeta,
  topForums: s.topForums,
  isLoadingForums: s.isLoadingForums,
  isLoadingLeaderboard: s.isLoadingLeaderboard,
  sortBy: s.sortBy,
  timeRange: s.timeRange,
  searchResults: s.searchResults,
  searchQuery: s.searchQuery,
  searchFilters: s.searchFilters,
  searchLoading: s.searchLoading,
  searchHasMore: s.searchHasMore,
  searchCursor: s.searchCursor,
  fetchForums: s.fetchForums,
  fetchLeaderboard: s.fetchLeaderboard,
  fetchTopForums: s.fetchTopForums,
  subscribe: s.subscribe,
  unsubscribe: s.unsubscribe,
  setSortBy: s.setSortBy,
  setTimeRange: s.setTimeRange,
  searchForums: s.searchForums,
  searchMore: s.searchMore,
  clearSearch: s.clearSearch,
});

/**
 * Selector hook returning the list-only slice of the forum store.
 */
export function useForumListStore(): ForumListSliceState {
  return useForumStore(selectListSlice);
}
