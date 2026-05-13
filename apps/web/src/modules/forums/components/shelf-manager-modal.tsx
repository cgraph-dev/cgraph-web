/**
 * ShelfManagerModal — modal for forum owners to manage the creator shelf.
 *
 * Supports adding, removing, and reordering featured threads (max 12).
 * Uses up/down arrows for simplified reordering.
 *
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { cn } from '@/lib/utils';
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

interface PremiumThread {
  readonly id: string;
  readonly title: string;
  readonly price_nodes: number;
}

interface ShelfManagerModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly forumId: string;
}
const MAX_SHELF_ITEMS = 12;
/**
 *
 * Description.
 */
export function ShelfManagerModal({ isOpen, onClose, forumId }: ShelfManagerModalProps) {
  const queryClient = useQueryClient();
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: shelfItems = [] } = useQuery<ShelfItem[]>({
    queryKey: ['forum-shelf', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: ShelfItem[] }>(`/api/v1/forums/${forumId}/shelf`);
      return res.data.data;
    },
    enabled: isOpen,
  });
  const { data: premiumThreads = [] } = useQuery<PremiumThread[]>({
    queryKey: ['forum-premium-threads', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: PremiumThread[] }>(
        `/api/v1/forums/${forumId}/threads?premium=true`
      );
      return res.data.data;
    },
    enabled: isOpen && isAddMode,
  });
  const addMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await http.post(`/api/v1/forums/${forumId}/shelf`, { thread_id: threadId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-shelf', forumId] });
      setIsAddMode(false);
      setSearchQuery('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await http.delete(`/api/v1/forums/${forumId}/shelf/${threadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-shelf', forumId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (threadIds: string[]) => {
      await http.put(`/api/v1/forums/${forumId}/shelf/reorder`, {
        thread_ids: threadIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-shelf', forumId] });
    },
  });
  function moveItem(index: number, direction: 'up' | 'down'): void {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= shelfItems.length) return;

    const reordered = [...shelfItems];
    const temp = reordered[index];
    const swap = reordered[swapIndex];
    if (!temp || !swap) return;
    reordered[index] = swap;
    reordered[swapIndex] = temp;

    reorderMutation.mutate(reordered.map((item) => item.thread_id));
  }
  const existingThreadIds = new Set(shelfItems.map((item) => item.thread_id));
  const lowerQuery = searchQuery.toLowerCase();
  const filteredThreads = premiumThreads.filter(
    (t) => !existingThreadIds.has(t.id) && t.title.toLowerCase().includes(lowerQuery)
  );
  const isAtCapacity = shelfItems.length >= MAX_SHELF_ITEMS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--token-card-border)] p-5">
              <h3 className="text-lg font-semibold text-white">Manage Shelf</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {/* Current items */}
              {shelfItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/40">
                  No featured threads yet. Add some to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {shelfItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-3"
                    >
                      {/* Position */}
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                        {index + 1}
                      </span>

                      {/* Title */}
                      <span className="min-w-0 flex-1 truncate text-sm text-white">
                        {item.thread.title}
                      </span>

                      {/* Reorder buttons */}
                      <div className="flex flex-shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === shelfItems.length - 1 || reorderMutation.isPending}
                          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(item.thread_id)}
                        disabled={removeMutation.isPending}
                        className="flex-shrink-0 rounded p-1 text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove from shelf"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add thread section */}
              {isAddMode ? (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search premium threads..."
                      className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {filteredThreads.length === 0 ? (
                      <p className="py-4 text-center text-xs text-white/30">
                        No matching premium threads found
                      </p>
                    ) : (
                      filteredThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => addMutation.mutate(thread.id)}
                          disabled={addMutation.isPending}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-[var(--token-bg-secondary)]"
                        >
                          <span className="min-w-0 flex-1 truncate">{thread.title}</span>
                          <span className="ml-2 flex-shrink-0 text-xs text-amber-400">
                            {thread.price_nodes} Nodes
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMode(false);
                      setSearchQuery('');
                    }}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddMode(true)}
                  disabled={isAtCapacity}
                  className={cn(
                    'mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors',
                    isAtCapacity
                      ? 'cursor-not-allowed border-[var(--token-card-border)] text-white/20'
                      : 'hover:border-primary/50 border-[var(--token-card-border)] text-white/50 hover:text-white'
                  )}
                >
                  <PlusIcon className="h-4 w-4" />
                  {isAtCapacity ? `Shelf full (${MAX_SHELF_ITEMS} max)` : 'Add Thread'}
                </button>
              )}

              {/* Error states */}
              {addMutation.isError && (
                <p className="mt-2 text-center text-xs text-red-400">
                  Failed to add thread. Please try again.
                </p>
              )}
              {removeMutation.isError && (
                <p className="mt-2 text-center text-xs text-red-400">
                  Failed to remove thread. Please try again.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ShelfManagerModal;
