/**
 * Discriminated union for API responses.
 * Eliminates the response.data?.x ?? response.data?.y guessing pattern.
 *
 * CGraph endpoints return { data: T } on success and
 * { error: { code, message } } on failure.
 */
import { ZodError, type ZodType } from 'zod';

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly pageInfo?: PageInfo;
}

export interface ApiError {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly status: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

interface PageInfo {
  readonly has_next_page: boolean;
  readonly has_previous_page: boolean;
  readonly start_cursor: string | null;
  readonly end_cursor: string | null;
  readonly total_count?: number;
}

/** Narrowed shape of a backend success body that wraps its payload in `data`. */
interface WrappedBody {
  readonly data: unknown;
}

/** Shape of the `error` field inside a backend error body. */
interface ErrorPayload {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly details?: unknown;
  readonly [key: string]: unknown;
}

/** Narrowed shape of a backend error body that contains `error.code` / `error.message`. */
interface ErrorBody {
  readonly error: ErrorPayload;
}

/** Shape produced by axios when a request receives an HTTP error response. */
interface AxiosErrorLike {
  readonly response: {
    readonly data: unknown;
    readonly status: number;
  };
}

function isWrappedBody(value: unknown): value is WrappedBody {
  return typeof value === 'object' && value !== null && 'data' in value;
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  // TypeScript narrows value to `object & Record<"error", unknown>` after the `in` check
  const errorField = value.error;
  return typeof errorField === 'object' && errorField !== null;
}

function isAxiosError(error: unknown): error is AxiosErrorLike {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }
  // TypeScript narrows error to `object & Record<"response", unknown>` after the `in` check
  const response = error.response;
  return typeof response === 'object' && response !== null;
}

function coerceString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function invalidResponseError(error: ZodError): ApiError {
  return {
    ok: false,
    error: {
      code: 'invalid_response',
      message: 'The server returned an unexpected response. Please refresh and try again.',
      details: error.issues,
    },
    status: 0,
  };
}

function extractErrorDetails(error: ErrorPayload): unknown {
  if (error.details !== undefined) {
    return error.details;
  }

  const details = Object.fromEntries(
    Object.entries(error).filter(
      ([key, value]) => key !== 'code' && key !== 'message' && value !== undefined
    )
  );

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Extract data from axios response, normalizing the backend's
 * `{ data: T }` / `{ data: { data: T } }` shape into a flat `unknown`.
 * Pass the result to a Zod schema's `.parse()` to get a typed value.
 */
export function extractData(response: { data: unknown }): unknown {
  const body = response.data;
  if (isWrappedBody(body)) {
    return body.data;
  }
  return body;
}

/** Type guard: value is a non-null object with string-keyed properties. */
function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extract page_info from the response body (if present).
 * The backend returns `{ data: T, page_info: {...} }` for paginated endpoints.
 */
function extractPageInfo(response: { data: unknown }): PageInfo | undefined {
  const body = response.data;
  if (!isRecordLike(body) || !('page_info' in body)) {
    return undefined;
  }
  const pi = body.page_info;
  if (!isRecordLike(pi)) {
    return undefined;
  }
  return {
    has_next_page: typeof pi.has_next_page === 'boolean' ? pi.has_next_page : false,
    has_previous_page: typeof pi.has_previous_page === 'boolean' ? pi.has_previous_page : false,
    start_cursor: typeof pi.start_cursor === 'string' ? pi.start_cursor : null,
    end_cursor: typeof pi.end_cursor === 'string' ? pi.end_cursor : null,
    total_count: typeof pi.total_count === 'number' ? pi.total_count : undefined,
  };
}

/**
 * Wrap an axios call in ApiResult, validating the payload with a Zod schema.
 * The schema drives the return type — no type assertions needed at call sites.
 *
 * @example
 * ```ts
 * const result = await apiCall(() => http.get('/api/v1/users/me'), UserSchema);
 * if (result.ok) console.log(result.data.username);
 * ```
 */
export async function apiCall<S extends ZodType>(
  fn: () => Promise<{ data: unknown; status: number }>,
  schema: S
): Promise<ApiResult<S['_output']>> {
  try {
    const response = await fn();
    const data: S['_output'] = schema.parse(extractData(response));
    const pageInfo = extractPageInfo(response);
    const result: ApiSuccess<S['_output']> = pageInfo
      ? { ok: true, data, pageInfo }
      : { ok: true, data };
    return result;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return invalidResponseError(error);
    }

    if (isAxiosError(error)) {
      const body = error.response.data;
      if (isErrorBody(body)) {
        return {
          ok: false,
          error: {
            code: coerceString(body.error.code, 'unknown'),
            message: coerceString(body.error.message, 'Request failed'),
            details: extractErrorDetails(body.error),
          },
          status: error.response.status,
        };
      }
      return {
        ok: false,
        error: {
          code: 'unknown',
          message: String(body),
        },
        status: error.response.status,
      };
    }
    return {
      ok: false,
      error: {
        code: 'network_error',
        message: error instanceof Error ? error.message : 'Network error',
      },
      status: 0,
    };
  }
}
