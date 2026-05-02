/**
 * Groups Tab
 *
 * Groups-only community discovery within the Explore page.
 */

import { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
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

/** Groups tab — browse public groups only. */
export function GroupsTab() {
  const [groups, setGroups] = useState<Community[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observerRef = useRef<HTMLDivElement | null>(null);

  async function fetchGroups(reset = false) {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;

      const res = await http.get('/api/v1/explore', {
        params: {
          type: 'group',
          category: category ?? undefined,
          sort,
          q: search || undefined,
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
        setOffset(items.length);
      } else {
        setGroups((prev) => [...prev, ...items]);
        setOffset((prev) => prev + items.length);
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
  }

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchGroups(true);
  }, [category, sort]);

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      fetchGroups(true);
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
      <div className="border-b border-[var(--token-border-muted)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search groups..."
              className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
          </div>

          <div className="relative">
            <AdjustmentsHorizontalIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <select
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

      {/* Groups grid */}
      <div className="flex-1 p-6">
        {isLoading && groups.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserGroupIcon className="mb-4 h-12 w-12 text-white/20" />
            <h3 className="text-lg font-semibold text-white/60">No groups found</h3>
            <p className="mt-1 text-sm text-white/40">
              {search ? 'Try a different search term' : 'No public groups available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <CommunityCard key={g.id} community={g} />
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
