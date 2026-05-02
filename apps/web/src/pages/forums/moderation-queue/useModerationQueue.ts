/**
 * ModerationQueue hook
 */

import { useState, useEffect } from 'react';
import { useModerationStore } from '@/modules/moderation/store';
import type { FilterState, UseModerationQueueReturn } from './types';
import { DEFAULT_FILTER_STATE } from './constants';

/**
 */
/**
 * Hook for managing moderation queue.
 * @returns The result.
 */
export function useModerationQueue(): UseModerationQueueReturn {
  const {
    queue,
    queueCounts,
    isLoadingQueue,
    fetchModerationQueue,
    approveQueueItem,
    rejectQueueItem,
  } = useModerationStore();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch queue on mount and filter change
  useEffect(() => {
    fetchModerationQueue({
      status: filters.status,
      itemType: filters.itemType !== 'all' ? filters.itemType : undefined,
      priority: filters.priority !== 'all' ? filters.priority : undefined,
    });
  }, [filters.status, filters.itemType, filters.priority, fetchModerationQueue]);

  // Filtered items
  const filteredQueue = queue.filter((item) => {
    if (filters.reason !== 'all' && item.reason !== filters.reason) return false;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        item.content.toLowerCase().includes(query) ||
        item.authorUsername.toLowerCase().includes(query) ||
        (item.title?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  // Selection handlers
  function toggleSelect(id: string): void {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll(): void {
    setSelectedItems(new Set(filteredQueue.map((item) => item.id)));
  }

  function clearSelection(): void {
    setSelectedItems(new Set());
  }

  // Action handlers
  async function handleApprove(id: string): Promise<void> {
    await approveQueueItem(id);
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleReject(id: string): void {
    setRejectingItemId(id);
    setRejectModalOpen(true);
  }

  async function confirmReject(): Promise<void> {
    if (!rejectingItemId) return;
    await rejectQueueItem(rejectingItemId, rejectReason);
    setRejectModalOpen(false);
    setRejectingItemId(null);
    setRejectReason('');
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(rejectingItemId);
      return next;
    });
  }

  function closeRejectModal(): void {
    setRejectModalOpen(false);
    setRejectingItemId(null);
    setRejectReason('');
  }

  // Bulk actions
  async function handleBulkApprove(): Promise<void> {
    for (const id of selectedItems) {
      await approveQueueItem(id);
    }
    clearSelection();
  }

  function handleBulkReject(): void {
    if (selectedItems.size > 0) {
      setRejectingItemId(Array.from(selectedItems).join(','));
      setRejectModalOpen(true);
    }
  }

  function refresh(): void {
    fetchModerationQueue();
  }

  return {
    filters,
    setFilters,
    selectedItems,
    filteredQueue,
    isLoadingQueue,
    queueCounts,
    rejectModalOpen,
    rejectReason,
    setRejectReason,
    toggleSelect,
    selectAll,
    clearSelection,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    confirmReject,
    closeRejectModal,
    refresh,
  };
}
