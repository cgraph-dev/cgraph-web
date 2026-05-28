/**
 * Forum *detail* slice — single forum view, threads/posts, comments,
 * voting, polls, attachments.
 *
 * Dedicated detail-level store synchronized from the canonical forum store.
 * This keeps thread/post consumers away from list and moderation state while
 * the legacy full store remains available for unmigrated call sites.
 */
import {
  forumDetailSliceBinding,
  useForumDetailSliceStore,
} from './forumStore';
import type { ForumDetailSliceState } from './forumStore.slices';

export type { ForumDetailSliceState } from './forumStore.slices';

/**
 * Hook returning the detail-only forum slice store.
 */
export function useForumDetailStore(): ForumDetailSliceState {
  forumDetailSliceBinding.ensureStarted();
  return useForumDetailSliceStore();
}

export function resyncForumDetailSliceStoreForTest(): void {
  forumDetailSliceBinding.resyncForTest();
}

export function disposeForumDetailSliceStoreForTest(): void {
  forumDetailSliceBinding.disposeForTest();
}
