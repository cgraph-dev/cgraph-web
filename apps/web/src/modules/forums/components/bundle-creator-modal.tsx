/**
 * BundleCreatorModal — modal for creating or editing content bundles.
 *
 * Forum owners select premium threads, set a bundle name/description/price,
 * and see auto-calculated savings. Supports create and edit modes.
 *
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { cn } from '@/lib/utils';
interface PremiumThread {
  readonly id: string;
  readonly title: string;
  readonly price_nodes: number;
}

interface ExistingBundle {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price_nodes: number;
  readonly thread_ids: string[];
}

interface BundleCreatorModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly forumId: string;
  readonly existingBundle?: ExistingBundle;
}
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_THREADS_PER_BUNDLE = 20;
export function BundleCreatorModal({
  isOpen,
  onClose,
  forumId,
  existingBundle,
}: BundleCreatorModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!existingBundle;

  const [name, setName] = useState(existingBundle?.name ?? '');
  const [description, setDescription] = useState(existingBundle?.description ?? '');
  const [priceNodes, setPriceNodes] = useState(existingBundle?.price_nodes ?? 1);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(
    new Set(existingBundle?.thread_ids ?? [])
  );
  const { data: premiumThreads = [] } = useQuery<PremiumThread[]>({
    queryKey: ['forum-premium-threads', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: PremiumThread[] }>(
        `/api/v1/forums/${forumId}/threads?premium=true`
      );
      return res.data.data;
    },
    enabled: isOpen,
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name,
        description: description || undefined,
        price_nodes: priceNodes,
        thread_ids: Array.from(selectedThreadIds),
      };

      if (isEditing && existingBundle) {
        await http.put(`/api/v1/forums/${forumId}/bundles/${existingBundle.id}`, body);
      } else {
        await http.post(`/api/v1/forums/${forumId}/bundles`, body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-bundles', forumId] });
      onClose();
    },
  });
  const individualTotal = premiumThreads
    .filter((t) => selectedThreadIds.has(t.id))
    .reduce((sum, t) => sum + t.price_nodes, 0);

  const savingsPercent =
    individualTotal > 0 ? Math.round(((individualTotal - priceNodes) / individualTotal) * 100) : 0;

  const isValidPrice = priceNodes > 0 && priceNodes < individualTotal;
  const isValidName = name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
  const isValidDescription = description.length <= MAX_DESCRIPTION_LENGTH;
  const hasThreads = selectedThreadIds.size > 0;
  const isAtThreadLimit = selectedThreadIds.size >= MAX_THREADS_PER_BUNDLE;
  const canSave = isValidName && isValidDescription && isValidPrice && hasThreads;
  function toggleThread(threadId: string): void {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else if (!isAtThreadLimit) {
        next.add(threadId);
      }
      return next;
    });
  }

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
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--token-card-border)] p-5">
              <h3 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit Bundle' : 'Create Bundle'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="bundle-name"
                  className="mb-1 block text-xs font-medium text-white/60"
                >
                  Name
                </label>
                <input
                  id="bundle-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="e.g. Complete Starter Kit"
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
                <span className="mt-0.5 block text-right text-[10px] text-white/20">
                  {name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="bundle-desc"
                  className="mb-1 block text-xs font-medium text-white/60"
                >
                  Description (optional)
                </label>
                <textarea
                  id="bundle-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={3}
                  placeholder="What's included in this bundle?"
                  className="w-full resize-none rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
                <span className="mt-0.5 block text-right text-[10px] text-white/20">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>

              {/* Thread selector */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/60">Select Threads</span>
                  <span className="text-[10px] text-white/30">
                    {selectedThreadIds.size}/{MAX_THREADS_PER_BUNDLE}
                  </span>
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-2">
                  {premiumThreads.length === 0 ? (
                    <p className="py-4 text-center text-xs text-white/30">
                      No premium threads found in this forum
                    </p>
                  ) : (
                    premiumThreads.map((thread) => {
                      const isSelected = selectedThreadIds.has(thread.id);
                      const isDisabled = !isSelected && isAtThreadLimit;

                      return (
                        <label
                          key={thread.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                            isSelected ? 'bg-primary-500/10' : 'hover:bg-white/5',
                            isDisabled && 'cursor-not-allowed opacity-40'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleThread(thread.id)}
                            className="accent-primary"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                            {thread.title}
                          </span>
                          <span className="flex-shrink-0 text-xs text-amber-400">
                            {thread.price_nodes} Nodes
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="bundle-price"
                  className="mb-1 block text-xs font-medium text-white/60"
                >
                  Bundle Price (Nodes)
                </label>
                <input
                  id="bundle-price"
                  type="number"
                  min={1}
                  value={priceNodes}
                  onChange={(e) => setPriceNodes(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Price summary */}
              {hasThreads && (
                <div className="rounded-lg bg-[var(--token-bg-secondary)] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Individual total</span>
                    <span className="text-white/70">{individualTotal} Nodes</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-white/50">Bundle price</span>
                    <span className="font-semibold text-white">{priceNodes} Nodes</span>
                  </div>
                  {savingsPercent > 0 && (
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-white/50">Savings</span>
                      <span className="font-medium text-green-400">{savingsPercent}%</span>
                    </div>
                  )}
                  {priceNodes >= individualTotal && priceNodes > 0 && (
                    <p className="mt-2 text-[10px] text-red-400">
                      Bundle price must be less than the individual total
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--token-card-border)] p-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-medium text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canSave || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-40"
                >
                  {saveMutation.isPending
                    ? 'Saving...'
                    : isEditing
                      ? 'Update Bundle'
                      : 'Create Bundle'}
                </button>
              </div>

              {saveMutation.isError && (
                <p className="mt-2 text-center text-xs text-red-400">
                  Failed to save bundle. Please try again.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BundleCreatorModal;
