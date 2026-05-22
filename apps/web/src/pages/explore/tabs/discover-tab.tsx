/**
 * Discover Tab
 *
 * Community discovery (groups + forums). Formerly the full explore-page.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import CommunityCard, { type Community } from '../community-card';
import CategoryBar from '../category-bar';
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
      <div className="border-b border-[var(--token-border-muted)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search communities..."
              className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
          </div>

          <div className="relative">
            <AdjustmentsHorizontalIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <select
              aria-label="Sort communities"
              value={sort}
              onChange={(e) => {
                if (isSortOption(e.target.value)) setSort(e.target.value);
              }}
              className="focus:ring-primary-500/50 appearance-none rounded-xl bg-[var(--token-bg-secondary)] py-2.5 pl-9 pr-8 text-sm text-white outline-none ring-1 ring-white/10"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <CategoryBar categories={categories} selected={category} onSelect={setCategory} />
        </div>
      </div>

      {/* Community grid */}
      <div className="flex-1 p-6">
        {isLoading && communities.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SparklesIcon className="mb-4 h-12 w-12 text-white/20" />
            <h3 className="text-lg font-semibold text-white/60">No communities found</h3>
            <p className="mt-1 text-sm text-white/40">
              {search ? 'Try a different search term' : 'No public communities available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((c) => (
                <CommunityCard key={`${c.type}-${c.id}`} community={c} />
              ))}
            </div>

            {hasMore && (
              <div ref={observerRef} className="flex items-center justify-center py-8">
                {isLoading && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
