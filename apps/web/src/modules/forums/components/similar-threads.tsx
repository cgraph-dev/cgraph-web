/**
 * Similar Threads Component — C1
 *
 * Displays a list of related threads from the same board,
 * found via backend full-text search on the thread title.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui';
import { ChatBubbleLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { formatTimeAgo } from '@/lib/utils';

interface SimilarThread {
  id: string;
  title: string;
  slug: string;
  reply_count: number;
  view_count: number;
  author: { id: string; username: string; avatar_url: string | null } | null;
  inserted_at: string;
}

interface SimilarThreadsProps {
  threadId: string;
  boardSlug?: string;
  forumSlug?: string;
}

/** Displays a list of threads similar to the current one. */
export function SimilarThreads({ threadId, boardSlug, forumSlug }: SimilarThreadsProps) {
  const [threads, setThreads] = useState<SimilarThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    http
      .get<{ data: SimilarThread[] }>(`/api/v1/threads/${threadId}/similar?limit=5`)
      .then((res) => {
        if (!cancelled) {
          setThreads(res.data?.data ?? []);
        }
      })
      .catch(() => {
        // Similar threads are non-critical
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  if (isLoading || threads.length === 0) return null;

  return (
    <GlassCard variant="frosted" className="p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Similar Threads
      </h3>
      <ul className="space-y-2">
        {threads.map((thread) => (
          <li key={thread.id}>
            <Link
              to={
                forumSlug && boardSlug
                  ? `/forums/${forumSlug}/boards/${boardSlug}/threads/${thread.slug || thread.id}`
                  : `/forums/threads/${thread.id}`
              }
              className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                  {thread.title}
                </span>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  {thread.author && <span>{thread.author.username}</span>}
                  <span className="flex items-center gap-1">
                    <ChatBubbleLeftIcon className="h-3 w-3" />
                    {thread.reply_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <EyeIcon className="h-3 w-3" />
                    {thread.view_count}
                  </span>
                  <span>{formatTimeAgo(thread.inserted_at)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
