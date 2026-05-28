/**
 * Forum *moderation* slice — mod queue, reports, bans, warnings,
 * thread lock/move/merge, automod config.
 *
 * Dedicated moderation-level store synchronized from the canonical forum
 * store. Moderation panels can subscribe to queue/report state without
 * binding themselves to list or thread detail state.
 */
import {
  forumModerationSliceBinding,
  useForumModerationSliceStore,
} from './forumStore';
import type { ForumModerationSliceState } from './forumStore.slices';

export type { ForumModerationSliceState } from './forumStore.slices';

/**
 * Hook returning the moderation-only forum slice store.
 */
export function useForumModerationStore(): ForumModerationSliceState {
  forumModerationSliceBinding.ensureStarted();
  return useForumModerationSliceStore();
}

export function resyncForumModerationSliceStoreForTest(): void {
  forumModerationSliceBinding.resyncForTest();
}

export function disposeForumModerationSliceStoreForTest(): void {
  forumModerationSliceBinding.disposeForTest();
}
