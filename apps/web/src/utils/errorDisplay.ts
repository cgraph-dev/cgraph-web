/**
 * Error Display Utilities
 *
 * Provides type-safe error message extraction and display components
 * to prevent React error #31 (rendering objects directly in JSX).
 *
 * PROBLEM:
 * React throws error #31 when you try to render an object directly:
 *   {error} // ❌ If error is { code: 'E001', message: 'Failed' }
 *
 * SOLUTION:
 * Always extract the string message before rendering:
 *   {getDisplayError(error)} // ✅ Returns 'Failed'
 */

/**
 * Error-like object structure that may come from API responses
 */
interface ErrorLike {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  detail?: unknown;
  errors?: unknown;
}

/** Type guard: checks if value is an ErrorLike object. */
function isErrorLike(v: unknown): v is ErrorLike {
  return v !== null && typeof v === 'object';
}

function extractNestedMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || null;
  }

  if (!isErrorLike(error)) {
    return null;
  }

  const candidates = [error.message, error.error, error.detail];
  for (const candidate of candidates) {
    const message = extractNestedMessage(candidate);
    if (message) return message;
  }

  if (Array.isArray(error.errors)) {
    const messages = error.errors.map(extractNestedMessage).filter(Boolean);
    if (messages.length > 0) return messages.join(', ');
  }

  if (isErrorLike(error.errors)) {
    const messages = Object.values(error.errors)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map(extractNestedMessage)
      .filter(Boolean);
    if (messages.length > 0) return messages.join(', ');
  }

  return typeof error.code === 'string' ? `Error: ${error.code}` : null;
}

/**
 * Extract a displayable string from any error type.
 *
 * Handles:
 * - String errors (returned as-is)
 * - Error instances (extracts message)
 * - API error objects with message/error/detail fields
 * - Unknown types (returns fallback)
 *
 * @param error - The error value (can be any type)
 * @param fallback - Default message if extraction fails
 * @returns A string safe to render in JSX
 *
 * @example
 * // In a component:
 * {error && <Alert>{getDisplayError(error)}</Alert>}
 */
export function getDisplayError(error: unknown, fallback = 'An unexpected error occurred'): string {
  return extractNestedMessage(error) ?? fallback;
}

/**
 * Type guard to check if a value is a renderable error string or null.
 *
 * Use this to validate error state before rendering to prevent React #31.
 *
 * @param error - Value to check
 * @returns true if error is a string or null (safe to render)
 */
export function isRenderableError(error: unknown): error is string | null {
  return error === null || typeof error === 'string';
}

/**
 * Safely coerce any error value to a string or null.
 *
 * Similar to getDisplayError but returns null for falsy values,
 * making it easier to use with conditional rendering.
 *
 * @param error - The error value
 * @returns String message or null
 *
 * @example
 * const errorMessage = toErrorString(apiError);
 * {errorMessage && <Alert>{errorMessage}</Alert>}
 */
export function toErrorString(error: unknown): string | null {
  if (!error) return null;
  return getDisplayError(error);
}

/**
 * Create an error handler that extracts messages and calls a callback.
 *
 * Useful for form submissions and API calls where you want to
 * set error state without worrying about the error format.
 *
 * @param setError - State setter function
 * @param fallback - Default error message
 * @returns Error handler function
 *
 * @example
 * const [error, setError] = useState<string | null>(null);
 * const handleError = createErrorHandler(setError, 'Login failed');
 *
 * try {
 *   await login(email, password);
 * } catch (e) {
 *   handleError(e);
 * }
 */
export function createErrorHandler(
  setError: (message: string | null) => void,
  fallback = 'An error occurred'
): (error: unknown) => void {
  return (error: unknown) => {
    setError(getDisplayError(error, fallback));
  };
}
