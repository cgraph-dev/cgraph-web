function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  if (!isRecord(error)) return fallback;

  if (typeof error.message === 'string' && error.message) return error.message;
  if (typeof error.error === 'string' && error.error) return error.error;

  if (isRecord(error.response) && isRecord(error.response.data)) {
    const data = error.response.data;
    if (typeof data.message === 'string' && data.message) return data.message;
    if (typeof data.error === 'string' && data.error) return data.error;
    if (isRecord(data.error) && typeof data.error.message === 'string') {
      return data.error.message;
    }
  }

  return fallback;
}

/**
 * Returns true when an API or structured-client error represents a permission denial.
 */
export function isForbiddenError(error: unknown): boolean {
  if (isRecord(error) && isRecord(error.response)) {
    const status = error.response.status;
    if (status === 403) return true;
  }

  const message = extractErrorMessage(error, '').toLowerCase();
  return message.includes('forbidden') || message.includes('permission');
}

/**
 * Maps group permission denials to route-specific copy and preserves normal API errors otherwise.
 */
export function getGroupPermissionError(
  error: unknown,
  forbiddenCopy: string,
  fallbackCopy: string
): string {
  return isForbiddenError(error) ? forbiddenCopy : extractErrorMessage(error, fallbackCopy);
}
