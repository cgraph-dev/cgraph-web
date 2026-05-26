function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) return error;
  if (!isRecord(error)) return fallback;

  if (isRecord(error.response) && isRecord(error.response.data)) {
    const data = error.response.data;
    if (typeof data.message === 'string' && data.message) return data.message;
    if (typeof data.error === 'string' && data.error) return data.error;
    if (isRecord(data.error) && typeof data.error.message === 'string') {
      return data.error.message;
    }
  }

  if (typeof error.message === 'string' && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error.error === 'string' && error.error) return error.error;

  return fallback;
}

function hasSpecificForbiddenMessage(message: string, forbiddenCopy: string): boolean {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.length > 0 &&
    normalized !== 'forbidden' &&
    normalized !== 'permission denied' &&
    normalized !== 'unauthorized' &&
    normalized !== forbiddenCopy.trim().toLowerCase()
  );
}

/**
 * Returns true when an API or structured-client error represents a permission denial.
 */
export function isForbiddenError(error: unknown): boolean {
  if (isRecord(error) && error.status === 403) {
    return true;
  }

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
  fallbackCopy: string,
  options: { preferSpecificServerCopy?: boolean } = {}
): string {
  const serverMessage = extractErrorMessage(error, fallbackCopy);

  if (!isForbiddenError(error)) {
    return serverMessage;
  }

  if (
    options.preferSpecificServerCopy === true &&
    hasSpecificForbiddenMessage(serverMessage, forbiddenCopy)
  ) {
    return serverMessage;
  }

  return forbiddenCopy;
}
