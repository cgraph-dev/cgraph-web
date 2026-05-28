import type { StoreApi, UseBoundStore } from 'zustand';

import type { ForumState } from './forumStore.types';

type ForumSliceStore<SliceState extends object> = UseBoundStore<StoreApi<SliceState>>;
type ForumSourceStore = UseBoundStore<StoreApi<ForumState>>;

function areShallowEqual<SliceState extends object>(
  current: SliceState,
  next: SliceState
): boolean {
  const currentEntries = Object.entries(current);
  if (currentEntries.length !== Object.keys(next).length) return false;

  return currentEntries.every(
    ([key, value]) =>
      Object.prototype.hasOwnProperty.call(next, key) && Object.is(value, Reflect.get(next, key))
  );
}

export interface ForumSliceBinding {
  ensureStarted: () => void;
  resyncForTest: () => void;
  disposeForTest: () => void;
}

export function bindForumSliceStore<SliceState extends object>(
  sourceStore: ForumSourceStore,
  sliceStore: ForumSliceStore<SliceState>,
  selectSlice: (state: ForumState) => SliceState
): ForumSliceBinding {
  let unsubscribe: (() => void) | null = null;

  const sync = (state: ForumState = sourceStore.getState()) => {
    const next = selectSlice(state);
    if (!areShallowEqual(sliceStore.getState(), next)) {
      sliceStore.setState(next);
    }
  };

  return {
    ensureStarted: () => {
      if (unsubscribe) return;
      sync();
      unsubscribe = sourceStore.subscribe(sync);
    },
    resyncForTest: () => {
      sync();
    },
    disposeForTest: () => {
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}
