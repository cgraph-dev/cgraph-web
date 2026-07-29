/**
 * Thread list component for forum board view.
 */
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThreadRow } from './thread-row';
import { SKELETON_COUNTS } from './constants';
import type { ThreadsListProps } from './types';

/**
 * List of threads in a forum with MyBB-style table layout
 */
export function ThreadsList({
  threads,
  forumSlug,
  isLoading,
  hasNextPage,
  onRefresh,
  onLoadMore,
}: ThreadsListProps) {
  if (isLoading && threads.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(SKELETON_COUNTS.threads)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--token-card-bg)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          animated={false}
          leftIcon={<RefreshCw />}
          onClick={onRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {threads.length === 0 ? (
        <div className="py-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <h3 className="mb-2 text-xl font-bold text-white">No Threads Yet</h3>
          <p className="text-gray-400">
            Start a discussion by creating a thread in one of the boards.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-[var(--token-card-bg)]">
          <div className="grid grid-cols-12 gap-4 border-b border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 text-sm font-medium text-gray-400">
            <div className="col-span-6">Thread</div>
            <div className="col-span-2 text-center">Replies</div>
            <div className="col-span-2 text-center">Views</div>
            <div className="col-span-2">Last Reply</div>
          </div>

          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} forumSlug={forumSlug} />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            animated={false}
            onClick={onLoadMore}
            isLoading={isLoading}
          >
            Load more threads
          </Button>
        </div>
      ) : null}
    </div>
  );
}
