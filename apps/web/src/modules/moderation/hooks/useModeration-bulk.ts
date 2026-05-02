/**
 * Inline / Bulk Moderation Hook
 *
 * Hook for bulk selection and bulk moderation actions.
 *
 */

import { useModerationStore } from '../store';

/**
 * Hook for inline moderation (bulk selection)
 */
export function useInlineModeration() {
  const {
    bulkSelection,
    toggleBulkSelection,
    clearBulkSelection,
    bulkMoveThreads,
    bulkDeleteThreads,
    bulkLockThreads,
    bulkApproveThreads,
  } = useModerationStore();

  function isSelected(type: 'threads' | 'posts' | 'comments', itemId: string) {
    return bulkSelection[type].includes(itemId);
  }

  function toggle(type: 'threads' | 'posts' | 'comments', itemId: string) {
    toggleBulkSelection(type, itemId);
  }

  function clear() {
    clearBulkSelection();
  }

  async function moveSelectedThreads(targetForumId: string) {
    await bulkMoveThreads(targetForumId);
  }

  async function deleteSelectedThreads(reason?: string) {
    await bulkDeleteThreads(reason);
  }

  async function lockSelectedThreads() {
    await bulkLockThreads();
  }

  async function approveSelectedThreads() {
    await bulkApproveThreads();
  }

  return {
    selection: bulkSelection,
    selectedThreadCount: bulkSelection.threads.length,
    selectedPostCount: bulkSelection.posts.length,
    selectedCommentCount: bulkSelection.comments.length,
    hasSelection:
      bulkSelection.threads.length > 0 ||
      bulkSelection.posts.length > 0 ||
      bulkSelection.comments.length > 0,
    isSelected,
    toggle,
    clear,
    moveSelectedThreads,
    deleteSelectedThreads,
    lockSelectedThreads,
    approveSelectedThreads,
  };
}
