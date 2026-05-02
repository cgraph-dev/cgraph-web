/**
 * Toggle Factory
 *
 * Creates toggle functions for boolean fields in Zustand stores.
 *
 */

import type { BaseStoreState, ZustandSet } from './types';

type BooleanFieldKey<T extends BaseStoreState> = {
  [K in keyof T]-?: T[K] extends boolean | undefined ? K : never;
}[keyof T] & string;

function coercePartial<T extends BaseStoreState>(value: unknown): Partial<T>;
function coercePartial(value: unknown): unknown {
  return value;
}

function createTogglePatch<T extends BaseStoreState, K extends BooleanFieldKey<T>>(
  state: T,
  field: K,
  markDirty: boolean
): Partial<T> {
  return coercePartial<T>(
    Object.assign({}, markDirty ? { isDirty: true } : {}, {
      [field]: !(state[field] ?? false),
    })
  );
}

// TOGGLE FACTORY

/**
 * Creates a toggle function for boolean fields in a store.
 * Works with Zustand's set function directly.
 *
 * @example
 * const store = create<MyState>((set) => ({
 *   isEnabled: false,
 *   toggleEnabled: createToggle(set, 'isEnabled'),
 * }));
 */
export function createToggle<T extends BaseStoreState>(
  set: ZustandSet<T>,
  field: BooleanFieldKey<T>,
  markDirty = true
): () => void {
  return () => set((state: T) => createTogglePatch(state, field, markDirty));
}

/**
 * Creates multiple toggle functions from a list of field names.
 */
export function createToggles<T extends BaseStoreState>(
  set: ZustandSet<T>,
  fields: Array<BooleanFieldKey<T>>,
  markDirty = true
): Record<string, () => void> {
  const toggles: Record<string, () => void> = {};
  for (const field of fields) {
    toggles[`toggle${field.charAt(0).toUpperCase()}${field.slice(1)}`] = createToggle(
      set,
      field,
      markDirty
    );
  }
  return toggles;
}
