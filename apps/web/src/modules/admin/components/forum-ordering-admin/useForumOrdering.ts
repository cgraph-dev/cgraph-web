/**
 * useForumOrdering hook
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { createLogger } from '@/lib/logger';
import type { ForumItem, HistoryState } from './types';
import { MAX_HISTORY_LENGTH } from './constants';
import { updateDisplayOrders, moveItem } from './utils';

const logger = createLogger('ForumOrdering');

interface UseForumOrderingOptions {
  initialItems: ForumItem[];
  onOrderChange: (items: ForumItem[]) => Promise<void>;
}

/**
 * Hook for managing forum ordering.
 */
export function useForumOrdering({ initialItems, onOrderChange }: UseForumOrderingOptions) {
  const { showToast } = useToast();
  const [items, setItems] = useState<ForumItem[]>(initialItems);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemsRef = useRef(initialItems);

  // Sync with initial items when they change
  useEffect(() => {
    setItems(initialItems);
    originalItemsRef.current = initialItems;
    setHistory([]);
    setHistoryIndex(-1);
  }, [initialItems]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(items) !== JSON.stringify(originalItemsRef.current);
  }, [items]);

  // History management
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  function pushToHistory(newItems: ForumItem[]) {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ items: newItems, timestamp: Date.now() });
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }

  function handleUndo() {
    if (!canUndo) return;
    setHistoryIndex((prev) => prev - 1);
    const prevItems =
      historyIndex === 0 ? originalItemsRef.current : history[historyIndex - 1]?.items;
    if (prevItems) setItems(prevItems);
  }

  function handleRedo() {
    if (!canRedo) return;
    const nextState = history[historyIndex + 1];
    if (!nextState) return;
    setHistoryIndex((prev) => prev + 1);
    setItems(nextState.items);
  }

  // Reorder handler
  function handleReorder(newItems: ForumItem[]) {
    const updatedItems = updateDisplayOrders(newItems);
    pushToHistory(items);
    setItems(updatedItems);
  }

  // Move item up/down
  function handleMoveUp(itemId: string) {
    pushToHistory(items);
    setItems((prev) => moveItem(prev, itemId, 'up'));
  }

  function handleMoveDown(itemId: string) {
    pushToHistory(items);
    setItems((prev) => moveItem(prev, itemId, 'down'));
  }

  // Toggle expand/collapse
  function toggleExpand(itemId: string) {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  // Save handler
  async function handleSave() {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      await onOrderChange(items);
      originalItemsRef.current = items;
      setHistory([]);
      setHistoryIndex(-1);
      showToast?.({ type: 'success', message: 'Order saved successfully!' });
    } catch (error) {
      logger.error('Failed to save forum order', error);
      showToast?.({ type: 'error', message: 'Failed to save order. Please try again.' });
      // Rollback
      setItems(originalItemsRef.current);
    } finally {
      setIsSaving(false);
    }
  }

  // Reset handler
  function handleReset() {
    setItems(originalItemsRef.current);
    setHistory([]);
    setHistoryIndex(-1);
  }

  return {
    items,
    expandedIds,
    isSaving,
    hasChanges,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleReorder,
    handleMoveUp,
    handleMoveDown,
    toggleExpand,
    handleSave,
    handleReset,
  };
}
