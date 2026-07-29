/**
 * Groups Tab
 *
 * Groups-only community discovery within the Explore page.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
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

/** Groups tab — browse public groups only. */
export function GroupsTab() {
  const [groups, setGroups] = useState<Community[]>([]);
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

  const fetchGroups = useCallback(
    async (reset = false, searchValue = searchRef.current) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offsetRef.current;

        const res = await http.get('/api/v1/explore', {
          params: {
            type: 'group',
            category: category ?? undefined,
            sort,
            q: searchValue || undefined,
            limit: 20,
            offset: currentOffset,
          },
        });
        const payload = res.data?.data ?? res.data;
        const items: Community[] = (payload?.communities ?? []).filter(
          (c: Community) => c.type === 'group'
        );
        const cats: string[] = payload?.categories ?? [];

        if (reset) {
          setGroups(items);
          setOffsetValue(items.length);
        } else {
          setGroups((prev) => [...prev, ...items]);
          setOffsetValue(currentOffset + items.length);
        }
        setCategories(cats);
        setHasMore(items.length >= 20);
      } catch (err) {
        captureError(err instanceof Error ? err : new Error('Groups fetch error'), {
          component: 'GroupsTab',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [category, setOffsetValue, sort]
  );

  useEffect(() => {
    setOffsetValue(0);
    setHasMore(true);
    fetchGroups(true);
  }, [category, fetchGroups, setOffsetValue, sort]);

  function handleSearch(value: string) {
    searchRef.current = value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffsetValue(0);
      setHasMore(true);
      fetchGroups(true, value);
    }, 300);
  }

  useEffect(() => {
    if (!observerRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchGroups(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchGroups, hasMore, isLoading]);

  return (
    <div className="flex flex-col">
      {/* Search + filters */}
      <div className="cgraph-pane border-b px-4 py-4 sm:px-6">
        <ExploreFilterBar
          search={search}
          searchLabel="Search groups"
          searchPlaceholder="Search groups..."
          sort={sort}
          sortLabel="Sort groups"
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

      {/* Groups grid */}
      <div className="cgraph-content flex-1">
        {isLoading && groups.length === 0 ? (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading groups"
          >
            <span className="sr-only">Loading groups</span>
            <Skeleton shape="card" count={6} />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<UserGroupIcon className="h-7 w-7" />}
            title="No groups found"
            message={search ? 'Try a different search term' : 'No public groups available yet'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <CommunityCard key={g.id} community={g} />
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
