/**
 * Discover Tab
 *
 * Community discovery (groups + forums). Formerly the full explore-page.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import CommunityCard, { type Community } from '../community-card';
import CategoryBar from '../category-bar';
import { ExploreFilterBar } from '../explore-filter-bar';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { http } from '@/lib/api-client';
import { captureError } from '@/lib/error-tracking';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'alphabetical', label: 'A–Z' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((o) => o.value));

function isSortOption(value: string): value is SortOption {
  return SORT_VALUES.has(value);
}

/** Discover tab — browse all public communities (groups + forums). */
export function DiscoverTab() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const offsetRef = useRef(0);
  const searchRef = useRef('');
  const observerRef = useRef<HTMLDivElement | null>(null);

  const setOffsetValue = useCallback((value: number) => {
    offsetRef.current = value;
  }, []);

  const fetchCommunities = useCallback(
    async (reset = false, searchValue = searchRef.current) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offsetRef.current;

        const res = await http.get('/api/v1/explore', {
          params: {
            category: category ?? undefined,
            sort,
            q: searchValue || undefined,
            limit: 20,
            offset: currentOffset,
          },
        });
        const payload = res.data?.data ?? res.data;
        const items: Community[] = payload?.communities ?? [];
        const cats: string[] = payload?.categories ?? [];

        if (reset) {
          setCommunities(items);
          setOffsetValue(items.length);
        } else {
          setCommunities((prev) => [...prev, ...items]);
          setOffsetValue(currentOffset + items.length);
        }
        setCategories(cats);
        setHasMore(items.length >= 20);
      } catch (err) {
        captureError(err instanceof Error ? err : new Error('Explore fetch error'), {
          component: 'DiscoverTab',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [category, setOffsetValue, sort]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setOffsetValue(0);
    setHasMore(true);
    fetchCommunities(true);
  }, [category, fetchCommunities, setOffsetValue, sort]);

  // Debounced search
  function handleSearch(value: string) {
    searchRef.current = value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffsetValue(0);
      setHasMore(true);
      fetchCommunities(true, value);
    }, 300);
  }

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!observerRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchCommunities(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchCommunities, hasMore, isLoading]);

  return (
    <div className="flex flex-col">
      {/* Search + filters */}
      <div className="cgraph-pane border-b px-4 py-4 sm:px-6">
        <ExploreFilterBar
          search={search}
          searchLabel="Search communities"
          searchPlaceholder="Search communities..."
          sort={sort}
          sortLabel="Sort communities"
          sortOptions={SORT_OPTIONS}
          onSearchChange={handleSearch}
          onSortChange={(value) => {
            if (isSortOption(value)) setSort(value);
          }}
        />

        <div className="mt-3">
          <CategoryBar categories={categories} selected={category} onSelect={setCategory} />
        </div>
      </div>

      {/* Community grid */}
      <div className="cgraph-content flex-1">
        {isLoading && communities.length === 0 ? (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading communities"
          >
            <span className="sr-only">Loading communities</span>
            <Skeleton shape="card" count={6} />
          </div>
        ) : communities.length === 0 ? (
          <EmptyState
            icon={<SparklesIcon className="h-7 w-7" />}
            title="No communities found"
            message={search ? 'Try a different search term' : 'No public communities available yet'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((c) => (
                <CommunityCard key={`${c.type}-${c.id}`} community={c} />
              ))}
            </div>

            {hasMore && (
              <div ref={observerRef} className="flex items-center justify-center py-8">
                {isLoading && <InlineLoadingSpinner />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
