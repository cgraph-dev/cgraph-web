import { useCallback, useEffect, useRef, useState } from 'react';
import { MessagesSquare, RefreshCw, Sparkles, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { ensureArray, ensureObject } from '@/lib/api-utils';
import { http } from '@/lib/api-client';
import { captureError } from '@/lib/error-tracking';
import CategoryBar from './category-bar';
import CommunityCard, { type Community } from './community-card';
import { ExploreFilterBar } from './explore-filter-bar';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'alphabetical', label: 'A-Z' },
] as const;

type CommunityType = Community['type'];
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

interface CommunityDiscoveryTabProps {
  readonly type?: CommunityType;
}

interface ExplorePayload {
  readonly communities?: unknown;
  readonly categories?: unknown;
  readonly page_info?: unknown;
}

interface PageInfo {
  readonly end_cursor?: unknown;
  readonly has_next_page?: unknown;
}

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function parseCommunity(value: unknown): Community | null {
  const community = ensureObject<Record<string, unknown>>(value);

  if (
    !community ||
    typeof community.id !== 'string' ||
    (community.type !== 'group' && community.type !== 'forum') ||
    typeof community.name !== 'string'
  ) {
    return null;
  }

  return {
    id: community.id,
    type: community.type,
    name: community.name,
    description: typeof community.description === 'string' ? community.description : null,
    member_count:
      typeof community.member_count === 'number' && Number.isFinite(community.member_count)
        ? community.member_count
        : 0,
    avatar_url: typeof community.avatar_url === 'string' ? community.avatar_url : null,
    category: typeof community.category === 'string' ? community.category : null,
    default_channel_id:
      typeof community.default_channel_id === 'string' ? community.default_channel_id : null,
    created_at: typeof community.created_at === 'string' ? community.created_at : null,
    is_verified: community.is_verified === true,
  };
}

function appendUnique(current: Community[], incoming: Community[]): Community[] {
  const byId = new Map(current.map((community) => [`${community.type}:${community.id}`, community]));

  for (const community of incoming) {
    byId.set(`${community.type}:${community.id}`, community);
  }

  return [...byId.values()];
}

export function CommunityDiscoveryTab({ type }: CommunityDiscoveryTabProps) {
  const plural = type === 'group' ? 'groups' : 'communities';
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const activeRequestRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const searchRef = useRef('');

  const fetchPage = useCallback(
    async (reset: boolean, query = searchRef.current) => {
      if (!reset && loadingRef.current) return;

      if (reset) {
        activeRequestRef.current?.abort();
        cursorRef.current = null;
      }

      const request = new AbortController();
      const requestId = ++requestIdRef.current;
      activeRequestRef.current = request;
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await http.get('/api/v1/explore', {
          params: {
            type,
            category: category ?? undefined,
            sort,
            q: query || undefined,
            limit: PAGE_SIZE,
            cursor: reset ? undefined : cursorRef.current ?? undefined,
          },
          signal: request.signal,
        });

        if (request.signal.aborted || requestId !== requestIdRef.current) return;

        const payload = ensureObject<ExplorePayload>(response.data);
        const rawCommunities = ensureArray<unknown>(payload?.communities);
        const pageInfo = ensureObject<PageInfo>(payload?.page_info);
        const next = rawCommunities
          .map(parseCommunity)
          .filter((community): community is Community => community !== null)
          .filter((community) => !type || community.type === type);
        const nextCursor =
          typeof pageInfo?.end_cursor === 'string' ? pageInfo.end_cursor : null;

        setCommunities((current) => (reset ? next : appendUnique(current, next)));
        setCategories(
          ensureArray<unknown>(payload?.categories).filter(
            (value): value is string => typeof value === 'string'
          )
        );
        cursorRef.current = nextCursor;
        setHasMore(pageInfo?.has_next_page === true && nextCursor !== null);
      } catch (requestError) {
        if (request.signal.aborted || requestId !== requestIdRef.current) return;

        captureError(
          requestError instanceof Error
            ? requestError
            : new Error(`Unable to load ${plural}`),
          { component: 'CommunityDiscoveryTab', type: type ?? 'all' }
        );
        setError(`Unable to load ${plural}.`);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [category, plural, sort, type]
  );

  useEffect(() => {
    void fetchPage(true);

    return () => {
      activeRequestRef.current?.abort();
    };
  }, [fetchPage]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchPage(false);
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, isLoading]);

  function handleSearch(value: string) {
    searchRef.current = value;
    setSearch(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPage(true, value);
    }, SEARCH_DELAY_MS);
  }

  const EmptyIcon = type === 'group' ? Users : Sparkles;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="cgraph-pane border-b px-4 py-4 sm:px-6">
        <ExploreFilterBar
          search={search}
          searchLabel={`Search ${plural}`}
          searchPlaceholder={`Search ${plural}...`}
          sort={sort}
          sortLabel={`Sort ${plural}`}
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

      <div className="cgraph-content flex-1">
        {error ? (
          <Alert variant="error" className="mb-4 flex items-center justify-between gap-4">
            <div>
              <AlertTitle>Discovery is unavailable</AlertTitle>
              <AlertDescription>{error} Check your connection and try again.</AlertDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              animated={false}
              leftIcon={<RefreshCw />}
              onClick={() => void fetchPage(cursorRef.current === null)}
            >
              Retry
            </Button>
          </Alert>
        ) : null}

        {isLoading && communities.length === 0 ? (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label={`Loading ${plural}`}
          >
            <span className="sr-only">Loading {plural}</span>
            <Skeleton shape="card" count={6} />
          </div>
        ) : communities.length === 0 && !error && !hasMore ? (
          <EmptyState
            icon={<EmptyIcon className="h-7 w-7" />}
            title={`No ${plural} found`}
            message={
              search
                ? 'Try a different search term.'
                : `No public ${plural} are available yet.`
            }
            meta={
              type ? (
                <span className="inline-flex items-center gap-1.5">
                  <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                  Public group conversations appear here
                </span>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <CommunityCard
                  key={`${community.type}:${community.id}`}
                  community={community}
                />
              ))}
            </div>

            {hasMore ? (
              <div
                ref={observerRef}
                className="flex min-h-20 items-center justify-center py-6"
                aria-label={`Load more ${plural}`}
              >
                {isLoading ? <InlineLoadingSpinner /> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
