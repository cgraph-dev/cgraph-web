/**
 * Forum *list* slice — board directory, search, leaderboard, top forums.
 *
 * Dedicated list-level store synchronized from the canonical forum store.
 * This keeps the public hook stable while letting list consumers subscribe
 * to list state without reading the full forum object.
 */
import {
  forumListSliceBinding,
  useForumListSliceStore,
} from './forumStore';
import type { ForumListSliceState } from './forumStore.slices';

export type { ForumListSliceState } from './forumStore.slices';

/**
 * Hook returning the list-only forum slice store.
 */
export function useForumListStore(): ForumListSliceState {
  forumListSliceBinding.ensureStarted();
  return useForumListSliceStore();
}

export function resyncForumListSliceStoreForTest(): void {
  forumListSliceBinding.resyncForTest();
}

export function disposeForumListSliceStoreForTest(): void {
  forumListSliceBinding.disposeForTest();
}
