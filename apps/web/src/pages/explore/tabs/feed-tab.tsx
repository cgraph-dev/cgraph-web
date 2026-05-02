/**
 * Feed Tab
 *
 * Wraps the existing FeedPage content inline within the Explore tab shell.
 */

import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedModeTabs, useFeed, useDiscoveryStore } from '@/modules/discovery';
import { FeedPostCard } from '@/pages/feed/feed-post-card';

/** Feed tab — ranked discovery feed with 5 modes. */
export function FeedTab() {
  const { activeMode, selectedCommunityId, setMode } = useDiscoveryStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed(
    activeMode,
    selectedCommunityId
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  function handleIntersection(entries: IntersectionObserverEntry[]) {
    if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Your Feed</h2>
        <Link
          to="/me/settings/discovery"
          className="text-xs text-white/40 transition-colors hover:text-white/60"
        >
          Customize
        </Link>
      </div>

      {/* Mode tabs */}
      <FeedModeTabs activeMode={activeMode} onModeChange={setMode} />

      {/* Feed content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : allThreads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-sm text-white/40">No posts found for this mode</p>
          <Link
            to="/me/settings/discovery"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Follow topics to see your feed
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allThreads.map((thread) => (
            <FeedPostCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      )}
    </div>
  );
}
