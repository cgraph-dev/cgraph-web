/**
 * Schema Mapper (camelCase <-> snake_case)
 *
 * Provides conversion utilities between camelCase store keys and
 * snake_case API parameters, plus debounced save functionality.
 *
 */

import type { BaseStoreState, FieldSchema, ZustandSet } from './types';

// SCHEMA MAPPER (camelCase <-> snake_case)

/**
 * Converts camelCase object keys to snake_case for API calls.
 */
export function toApiParams<T extends object>(
  data: T,
  schema: FieldSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [camelKey, value] of Object.entries(data)) {
    const snakeKey = schema[camelKey] || camelToSnake(camelKey);
    result[snakeKey] = value;
  }

  return result;
}

/**
 * Converts snake_case API response to camelCase for store state.
 */
export function fromApiParams<T extends object>(
  apiData: Record<string, unknown>,
  schema: FieldSchema,
  defaults: T
): T {
  const result: T = { ...defaults };
  const reverseSchema = Object.fromEntries(
    Object.entries(schema).map(([camel, snake]) => [snake, camel])
  );

  for (const [snakeKey, value] of Object.entries(apiData)) {
    const camelKey = reverseSchema[snakeKey] || snakeToCamel(snakeKey);
    if (camelKey in defaults) {
      Object.assign(result, { [camelKey]: value });
    }
  }

  // Structurally safe: result starts as { ...defaults } and only overwrites
  // keys that already exist in defaults, preserving the T shape invariant.
  return result;
}

/**
 * Creates a schema mapper with both toApi and fromApi methods.
 */
export function createSchemaMapper<T extends object = Record<string, unknown>>(
  schema: FieldSchema
) {
  return {
    toApi: (updates: T) => toApiParams(updates, schema),
    fromApi: (apiData: Record<string, unknown>, defaults: T) =>
      fromApiParams(apiData, schema, defaults),
    schema,
  };
}

// Helper functions for case conversion
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

// DEBOUNCED SAVE

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Creates a debounced save function that batches updates to reduce API calls.
 *
 * @param saveFn - The async function to call with (state, set) when the timer fires
 * @param options - Configuration options (delay in ms)
 * @returns A debounced function that accepts (state, set) arguments
 *
 * @example
 * const debouncedSave = createDebouncedSave(
 *   async (state, set) => {
 *     const payload = mapper.toApi(state);
 *     await api.put('/api/v1/me/customizations', payload);
 *   },
 *   { delay: 1000 }
 * );
 */
export function createDebouncedSave<T extends BaseStoreState>(
  saveFn: (state: T, set: ZustandSet<T>) => Promise<void>,
  options: { delay?: number } = {}
) {
  const { delay = 500 } = options;
  const key = `save_${Date.now()}_${Math.random()}`;

  return (state: T, set: ZustandSet<T>): void => {
    const existingTimer = saveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Helper to set BaseStoreState fields via the generic set function
    function setBaseFields(fields: Partial<BaseStoreState>): void {
      set((prev) => ({ ...prev, ...fields }));
    }

    setBaseFields({ isSaving: true, error: null });

    const timer = setTimeout(async () => {
      saveTimers.delete(key);
      try {
        await saveFn(state, set);
        setBaseFields({ isSaving: false });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Save failed';
        setBaseFields({ isSaving: false, error: errorMessage });
      }
    }, delay);

    saveTimers.set(key, timer);
  };
}
