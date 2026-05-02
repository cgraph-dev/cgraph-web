/**
 * API Response Extractors
 *
 * Provides type-safe helper functions for parsing API responses
 * and ensuring consistent data extraction across the application.
 */
function isNumber(v: unknown): v is number {
  return typeof v === 'number';
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

/**
 * Checks whether record.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Checks whether v is a non-array plain object (safe to treat as Record). */
function isNonArrayObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Generic coercion helper for type boundaries.
 * The implementation overload returns `unknown`; the public overload declares `T`.
 * This avoids `as T` syntax at generic boundary return sites.
 */
function coerce<T>(v: unknown): T;
function coerce(v: unknown): unknown {
  return v;
}

/** Safely extract a string from an unknown value */
export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/** Safely extract a number from an unknown value */
export function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

/** Safely extract a boolean from an unknown value */
export function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Safely extract an optional string (returns undefined if not a string) */
export function asOptionalString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/** Safely extract an optional number (returns undefined if not a number) */
export function asOptionalNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/** Safely extract a string or null (returns null if not a string or empty) */
export function asStringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/**
 * Extract a string field from a record by key.
 * Returns the fallback if the value is not a string.
 */
export function str(obj: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const v = obj?.[key];
  return typeof v === 'string' ? v : fallback;
}

/**
 * Extract a record field from a record by key.
 * Returns undefined if the value is not an object.
 */
export function asRecordOrUndef(v: unknown): Record<string, unknown> | undefined {
  return isNonArrayObject(v) ? v : undefined;
}

/**
 * Extract a record from an unknown value, defaulting to empty object.
 */
export function asRecordOrEmpty(v: unknown): Record<string, unknown> {
  return isNonArrayObject(v) ? v : {};
}

/**
 * Validate a string value against a set of allowed values.
 * Returns the value if valid, otherwise the fallback.
 */
export function asEnum<T extends string>(
  v: unknown,
  allowed: ReadonlySet<T> | readonly T[],
  fallback: T
): T {
  if (typeof v !== 'string') return fallback;
  const values: readonly T[] = Array.isArray(allowed) ? allowed : [...allowed];
  for (const item of values) {
    if (item === v) return item;
  }
  return fallback;
}

/**
 * Safely extract a typed array from an unknown value.
 * Each element is validated with the provided guard function.
 */
export function asArray<T>(v: unknown, guard: (x: unknown) => x is T): T[] {
  if (!Array.isArray(v)) return [];
  return v.filter(guard);
}

/**
 * Type-safe Object.keys that returns (keyof T)[] instead of string[].
 * Use only when T is a known, closed interface.
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj).filter((k): k is string & keyof T => k in obj);
}

/**
 * Extract a typed value from multiple possible keys.
 * Returns the first valid value found, or the fallback.
 */
function extractValue<T>(
  meta: Record<string, unknown>,
  keys: string[],
  typeCheck: (v: unknown) => v is T,
  fallback: T
): T {
  for (const key of keys) {
    if (typeCheck(meta[key])) {
      return meta[key];
    }
  }
  return fallback;
}

/**
 * Safely extracts an array from API response data.
 * Handles various response formats:
 * - Direct array: []
 * - Wrapped in key: { friends: [], requests: [], data: [] }
 * - Nested data: { data: { items: [] } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'friends', 'requests')
 * @returns A type-safe array, or empty array if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/friends');
 * const friends = ensureArray<Friend>(response.data, 'friends');
 * ```
 */
export function ensureArray<T>(data: unknown, key?: string): T[] {
  // Handle null/undefined
  if (data == null) {
    return [];
  }

  // Handle direct array
  if (Array.isArray(data)) {
    return data;
  }

  // Handle object with keys
  if (isRecord(data)) {
    const obj = data;

    // Try the specified key first
    if (key && Array.isArray(obj[key])) {
      return obj[key];
    }

    // Try common wrapper keys
    const commonKeys = ['data', 'items', 'results', 'list', 'records'];
    for (const k of commonKeys) {
      if (Array.isArray(obj[k])) {
        return obj[k];
      }
    }
  }

  return [];
}

/**
 * Safely extracts a single object from API response data.
 * Handles various response formats:
 * - Direct object: { id: '1', name: 'test' }
 * - Wrapped: { data: { id: '1', name: 'test' } }
 * - Wrapped with key: { user: { id: '1', name: 'test' } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'user', 'group')
 * @returns The extracted object or null if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/users/123');
 * const user = ensureObject<User>(response.data, 'user');
 * ```
 */
export function ensureObject<T extends object>(data: unknown, key?: string): T | null {
  // Handle null/undefined
  if (data == null) {
    return null;
  }

  // Handle direct object (not array)
  if (isRecord(data) && !Array.isArray(data)) {
    const obj = data;

    // Try the specified key first
    if (key && isRecord(obj[key]) && !Array.isArray(obj[key])) {
      return coerce<T>(obj[key]);
    }

    // Try 'data' wrapper
    if (isRecord(obj.data) && !Array.isArray(obj.data)) {
      return coerce<T>(obj.data);
    }

    // Return as-is if it looks like the target object (has properties beyond just 'data')
    const keys = Object.keys(obj);
    if (keys.length > 0 && !keys.every((k) => ['data', 'meta', 'status', 'message'].includes(k))) {
      return coerce<T>(obj);
    }
  }

  return null;
}

/**
 * Extracts cursor-based pagination metadata from API response.
 *
 * Reads from the `page_info` envelope returned by the backend:
 * `{ data: [...], page_info: { has_next_page, has_previous_page, start_cursor, end_cursor, total_count } }`
 *
 * @param data - The raw API response data
 * @returns Cursor pagination metadata or defaults
 */
export function extractPagination(data: unknown): {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
} {
  const defaults = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
    totalCount: 0,
  };

  if (!isRecord(data)) {
    return defaults;
  }

  const rawPageInfo = data.page_info;
  if (!isRecord(rawPageInfo)) {
    return defaults;
  }

  return {
    hasNextPage: extractValue(rawPageInfo, ['has_next_page'], isBoolean, defaults.hasNextPage),
    hasPreviousPage: extractValue(
      rawPageInfo,
      ['has_previous_page'],
      isBoolean,
      defaults.hasPreviousPage
    ),
    startCursor:
      typeof rawPageInfo.start_cursor === 'string'
        ? rawPageInfo.start_cursor
        : defaults.startCursor,
    endCursor:
      typeof rawPageInfo.end_cursor === 'string' ? rawPageInfo.end_cursor : defaults.endCursor,
    totalCount: extractValue(rawPageInfo, ['total_count'], isNumber, defaults.totalCount),
  };
}

/**
 * Safely extracts an error message from an API error response
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  if (error == null) {
    return defaultMessage;
  }

  // Handle axios-style errors
  if (isRecord(error)) {
    const err = error;

    // Try response.data.error
    if (isRecord(err.response)) {
      const response = err.response;
      if (isRecord(response.data)) {
        const data = response.data;
        if (typeof data.error === 'string') return data.error;
        // Handle error object with message property: {"error": {"message": "...", "code": "..."}}
        if (isRecord(data.error)) {
          const errorObj = data.error;
          if (typeof errorObj.message === 'string') return errorObj.message;
        }
        if (typeof data.message === 'string') return data.message;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors
            .map((e: unknown) =>
              typeof e === 'string'
                ? e
                : isRecord(e) && typeof e.message === 'string'
                  ? e.message
                  : ''
            )
            .filter(Boolean)
            .join(', ');
        }
      }
    }

    // Try direct message property
    if (typeof err.message === 'string') {
      return err.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}
