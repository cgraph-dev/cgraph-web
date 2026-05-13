/**
 * CreatorShelf — horizontal shelf of featured threads on forum homepage.
 *
 * Forum owners curate up to 12 "Creator's Picks" that display prominently.
 * Each card shows position, title, author, and optional price badge.
 *
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { FADE_IN } from '@/lib/animations/transitions';
import { ShelfManagerModal } from './shelf-manager-modal';
interface ShelfThreadAuthor {
  readonly displayName: string;
  readonly avatarUrl?: string;
}

interface ShelfThread {
  readonly id: string;
  readonly title: string;
  readonly author: ShelfThreadAuthor;
  readonly price_nodes?: number;
}

interface ShelfItem {
  readonly id: string;
  readonly thread_id: string;
  readonly position: number;
  readonly featured_at: string;
  readonly thread: ShelfThread;
}

interface CreatorShelfProps {
  readonly forumId: string;
  readonly isOwner?: boolean;
}
/**
 *
 * Description.
 */
export function CreatorShelf({ forumId, isOwner = false }: CreatorShelfProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const { data: shelfItems = [], isLoading } = useQuery<ShelfItem[]>({
    queryKey: ['forum-shelf', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: ShelfItem[] }>(`/api/v1/forums/${forumId}/shelf`);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  function scrollBy(direction: 'left' | 'right'): void {
    if (!scrollContainer) return;
    const amount = direction === 'left' ? -280 : 280;
    scrollContainer.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden px-1 py-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-28 w-64 flex-shrink-0 animate-pulse rounded-xl bg-[var(--token-bg-secondary)]"
          />
        ))}
      </div>
    );
  }

  if (shelfItems.length === 0 && !isOwner) {
    return null;
  }

  return (
    <motion.section {...FADE_IN} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Creator&apos;s Picks</h2>
        </div>
        <div className="flex items-center gap-1">
          {shelfItems.length > 3 && (
            <>
              <button
                type="button"
                onClick={() => scrollBy('left')}
                className="rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy('right')}
                className="rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
            >
              <Cog6ToothIcon className="h-3.5 w-3.5" />
              Manage Shelf
            </button>
          )}
        </div>
      </div>

      {/* Shelf Items */}
      {shelfItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--token-card-border)] py-8">
          <p className="text-sm text-white/40">No featured threads yet</p>
        </div>
      ) : (
        <div ref={setScrollContainer} className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
          {shelfItems.map((item) => (
            <ShelfCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Manager Modal */}
      {isOwner && (
        <ShelfManagerModal
          isOpen={isManagerOpen}
          onClose={() => setIsManagerOpen(false)}
          forumId={forumId}
        />
      )}
    </motion.section>
  );
}
function ShelfCard({ item }: { readonly item: ShelfItem }) {
  return (
    <Link to={`/forums/threads/${item.thread.id}`} className="block flex-shrink-0">
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}
        className="relative w-64 overflow-hidden rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4 transition-colors hover:border-amber-500/30"
      >
        {/* Position badge */}
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
          {item.position}
        </div>

        {/* Thread title */}
        <h3 className="line-clamp-2 pr-8 text-sm font-semibold text-white">{item.thread.title}</h3>

        {/* Author */}
        <div className="mt-2 flex items-center gap-2">
          {item.thread.author.avatarUrl ? (
            <img
              src={item.thread.author.avatarUrl}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--token-bg-primary)] text-[10px] font-bold text-white/60">
              {item.thread.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-xs text-white/50">{item.thread.author.displayName}</span>
        </div>

        {/* Price badge */}
        {item.thread.price_nodes != null && item.thread.price_nodes > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <LockClosedIcon className="h-3 w-3" />
            <span>{item.thread.price_nodes} Nodes</span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default CreatorShelf;
