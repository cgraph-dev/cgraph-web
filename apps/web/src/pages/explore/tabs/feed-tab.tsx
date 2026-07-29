import { useCallback, useEffect, useRef } from 'react';
import { Compass, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { FeedModeTabs, useFeed, useDiscoveryStore } from '@/modules/discovery';
import { FeedPostCard } from '@/pages/feed/feed-post-card';

export function FeedTab() {
  const { activeMode, selectedCommunityId, setMode } = useDiscoveryStore();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useFeed(activeMode, selectedCommunityId);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersection]);

  const allThreads = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">Your Feed</h2>
        <Link
          to="/me/settings/discovery"
          className="text-xs font-medium text-[var(--token-interactive-primary)] hover:underline"
        >
          Customize
        </Link>
      </div>

      <FeedModeTabs activeMode={activeMode} onModeChange={setMode} />

      {isError ? (
        <Alert variant="error" className="flex items-center justify-between gap-4">
          <div>
            <AlertTitle>Feed is unavailable</AlertTitle>
            <AlertDescription>Posts could not be loaded. Check your connection.</AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            animated={false}
            leftIcon={<RefreshCw />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading feed">
          <span className="sr-only">Loading feed</span>
          <Skeleton shape="card" count={5} />
        </div>
      ) : allThreads.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-7 w-7" />}
          title="No posts found"
          message="Follow topics or choose another feed mode."
        />
      ) : (
        <div className="space-y-3">
          {allThreads.map((thread) => (
            <FeedPostCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {hasNextPage ? <div ref={sentinelRef} className="h-1" /> : null}

      {isFetchingNextPage ? (
        <div className="flex justify-center py-4">
          <InlineLoadingSpinner />
        </div>
      ) : null}
    </div>
  );
}
