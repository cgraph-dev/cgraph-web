import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { MessagesSquare, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { Button } from '@/components/ui/button';
import { useForumStore } from '@/modules/forums/store';
import type { ForumSearchFilters } from '@/modules/forums/store/forumStore.types';
import { SearchResultCard } from './search-result-card';
import { SearchFiltersPanel } from './search-filters-panel';

const VALID_TYPES: ReadonlyArray<ForumSearchFilters['type']> = [
  'thread',
  'post',
  'comment',
  'all',
];

const VALID_SORTS: ReadonlyArray<ForumSearchFilters['sort']> = [
  'relevance',
  'newest',
  'oldest',
  'most_votes',
];

function buildSearchParams(query: string, filters: ForumSearchFilters): URLSearchParams {
  const params = new URLSearchParams({ q: query });
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  return params;
}

function ForumSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchResults,
    searchLoading,
    searchHasMore,
    searchQuery,
    searchFilters,
    searchForums,
    searchMore,
    clearSearch,
  } = useForumStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = searchParams.get('q') ?? '';
  const rawType = searchParams.get('type') ?? '';
  const rawSort = searchParams.get('sort') ?? '';
  const urlType: ForumSearchFilters['type'] | null = VALID_TYPES.find((t) => t === rawType) ?? null;
  const urlSort: ForumSearchFilters['sort'] | null = VALID_SORTS.find((s) => s === rawSort) ?? null;
  const urlDateFrom = searchParams.get('date_from') ?? undefined;
  const urlDateTo = searchParams.get('date_to') ?? undefined;

  useEffect(() => {
    if (urlQuery) {
      const filters: ForumSearchFilters = {};
      if (urlType) filters.type = urlType;
      if (urlSort) filters.sort = urlSort;
      if (urlDateFrom) filters.dateFrom = urlDateFrom;
      if (urlDateTo) filters.dateTo = urlDateTo;
      searchForums(urlQuery, filters);
    }
    return () => {
      clearSearch();
    };
  }, [urlQuery, urlType, urlSort, urlDateFrom, urlDateTo, searchForums, clearSearch]);

  function sentinelCallback(node: HTMLDivElement | null): void {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && searchHasMore && !searchLoading) {
        searchMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) return;
    setSearchParams(buildSearchParams(q, searchFilters));
  };

  const handleFiltersChange = (newFilters: ForumSearchFilters): void => {
    const q = searchQuery || inputRef.current?.value.trim() || '';
    if (!q) return;
    setSearchParams(buildSearchParams(q, newFilters));
  };

  return (
    <div className="cgraph-workspace mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--token-text-primary)]">Search Forums</h1>
        {searchQuery && !searchLoading && (
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;
            {searchQuery}&quot;
          </p>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <label htmlFor="forum-search-query" className="sr-only">
          Search forums
        </label>
        <input
          id="forum-search-query"
          ref={inputRef}
          type="text"
          defaultValue={urlQuery}
          placeholder="Search threads, posts, comments…"
          className="min-w-0 flex-1 rounded-lg border border-[var(--token-input-border)] bg-[var(--token-input-bg)] px-4 py-2.5 text-sm text-[var(--token-text-primary)] outline-none placeholder:text-[var(--token-text-muted)] focus:border-[var(--token-interactive-primary)] focus:ring-2 focus:ring-[var(--token-focus-ring)]"
        />
        <Button type="submit" leftIcon={<Search aria-hidden="true" />}>
          Search
        </Button>
      </form>

      <SearchFiltersPanel filters={searchFilters} onFiltersChange={handleFiltersChange} />

      <div className="space-y-3">
        {searchResults.map((result) => (
          <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
        ))}

        {searchLoading && (
          <div className="flex justify-center py-8">
            <InlineLoadingSpinner label="Searching forums" />
          </div>
        )}

        {!searchLoading && searchQuery && searchResults.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Search
              className="mb-3 h-10 w-10 text-[var(--token-text-muted)]"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">
              No results found
            </h3>
            <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}

        {!searchLoading && !searchQuery && searchResults.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <MessagesSquare
              className="mb-3 h-10 w-10 text-[var(--token-text-muted)]"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">
              Search the forums
            </h3>
            <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
              Find threads, posts, and comments across all forums.
            </p>
          </div>
        )}

        {searchHasMore && <div ref={sentinelCallback} className="h-4" aria-hidden="true" />}
      </div>
    </div>
  );
}

export default ForumSearchResults;
