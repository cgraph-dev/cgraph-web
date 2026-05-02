/**
 * Hook for managing multi-select batch operations in a conversation.
 *
 * Tracks which messages are selected, enforces per-operation limits
 * (30 for forward/copy, 100 for delete), and exposes mode entry/exit.
 * Follows Signal's multi-select pattern: long-press to enter, checkboxes
 * appear, action bar at bottom.
 */
import { useState, useCallback, useMemo } from 'react';

import { MAX_BATCH_COPY, MAX_BATCH_DELETE, MAX_BATCH_FORWARD } from '@cgraph/shared-types';
import type { BatchOperation } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseBatchSelectResult {
  /** Currently selected message IDs. */
  readonly selectedMessageIds: ReadonlySet<string>;
  /** Whether multi-select mode is active. */
  readonly isSelecting: boolean;
  /** Number of selected messages. */
  readonly selectedCount: number;
  /** Toggle selection of a single message. */
  readonly toggleSelect: (messageId: string) => void;
  /** Select all provided message IDs (up to delete limit). */
  readonly selectAll: (messageIds: readonly string[]) => void;
  /** Clear all selections. */
  readonly clearSelection: () => void;
  /** Enter multi-select mode. */
  readonly enterSelectMode: () => void;
  /** Exit multi-select mode and clear selections. */
  readonly exitSelectMode: () => void;
  /** Check whether a specific operation is allowed given current selection. */
  readonly isOperationAllowed: (operation: BatchOperation) => boolean;
  /** Maximum allowed for a given operation. */
  readonly maxForOperation: (operation: BatchOperation) => number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the maximum number of messages allowed for a batch operation. */
function operationMax(operation: BatchOperation): number {
  switch (operation) {
    case 'copy':
      return MAX_BATCH_COPY;
    case 'forward':
      return MAX_BATCH_FORWARD;
    case 'delete':
      return MAX_BATCH_DELETE;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage multi-select state for batch message operations.
 *
 * Enforces operation-specific limits: 30 for forward/copy, 100 for delete.
 * The `isOperationAllowed` check can be used to disable action buttons
 * when the selection exceeds an operation's limit.
 */
export function useBatchSelect(): UseBatchSelectResult {
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const selectedCount = selectedMessageIds.size;

  const toggleSelect = useCallback((messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        // Cap at the highest limit (delete = 100)
        if (next.size < MAX_BATCH_DELETE) {
          next.add(messageId);
        }
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((messageIds: readonly string[]) => {
    const capped = messageIds.slice(0, MAX_BATCH_DELETE);
    setSelectedMessageIds(new Set(capped));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds(new Set());
  }, []);

  const enterSelectMode = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelecting(false);
    setSelectedMessageIds(new Set());
  }, []);

  const isOperationAllowed = useCallback(
    (operation: BatchOperation): boolean => {
      if (selectedCount === 0) return false;
      return selectedCount <= operationMax(operation);
    },
    [selectedCount]
  );

  const maxForOperation = useCallback((operation: BatchOperation): number => {
    return operationMax(operation);
  }, []);

  return useMemo(
    () => ({
      selectedMessageIds,
      isSelecting,
      selectedCount,
      toggleSelect,
      selectAll,
      clearSelection,
      enterSelectMode,
      exitSelectMode,
      isOperationAllowed,
      maxForOperation,
    }),
    [
      selectedMessageIds,
      isSelecting,
      selectedCount,
      toggleSelect,
      selectAll,
      clearSelection,
      enterSelectMode,
      exitSelectMode,
      isOperationAllowed,
      maxForOperation,
    ]
  );
}
