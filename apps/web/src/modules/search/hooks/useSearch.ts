/**
 * Main Search Hook
 *
 * Core search hook that orchestrates the search store.
 *
 */

import { useSearchStore } from '../store';
import type { SearchCategory } from '../store';

/**
 * Main search hook
 */
export function useSearch() {
  const {
    query,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    isLoading,
    error,
    hasSearched,
    pageInfo,
    hasMore,
    isLoadingMore,
    setQuery,
    setCategory,
    search,
    loadMore,
    clearResults,
    clearError,
  } = useSearchStore();

  const totalResults = users.length + groups.length + forums.length + posts.length + messages.length;

  const resultsByCategory = {
    users: users.length,
    groups: groups.length,
    forums: forums.length,
    posts: posts.length,
    messages: messages.length,
  };

  async function handleSearch(searchQuery?: string) {
    await search(searchQuery);
  }

  function handleSetQuery(newQuery: string) {
    setQuery(newQuery);
  }

  function handleSetCategory(newCategory: SearchCategory) {
    setCategory(newCategory);
  }

  function clear() {
    clearResults();
  }

  return {
    query,
    category,
    results: {
      users,
      groups,
      forums,
      posts,
      messages,
    },
    totalResults,
    resultsByCategory,
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    pageInfo,
    hasMore,
    setQuery: handleSetQuery,
    setCategory: handleSetCategory,
    search: handleSearch,
    loadMore,
    clear,
    clearError,
  };
}
