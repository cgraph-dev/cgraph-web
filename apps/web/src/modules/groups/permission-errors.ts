function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function humanizeFieldName(field: string): string {
  return field.replace(/_/g, ' ');
}

function formatDetailValue(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.flatMap(formatDetailValue);
  }

  return [];
}

function extractDetailsMessage(details: unknown): string | null {
  if (!isRecord(details)) return null;

  const messages = Object.entries(details).flatMap(([field, value]) =>
    formatDetailValue(value).map((message) => `${humanizeFieldName(field)} ${message}`)
  );

  return messages.length > 0 ? messages.join('; ') : null;
}

function isValidationMessage(message: string | null): boolean {
  return (message ?? '').trim().toLowerCase() === 'validation failed';
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) return error;
  if (!isRecord(error)) return fallback;

  if (isRecord(error.response) && isRecord(error.response.data)) {
    const data = error.response.data;
    const directMessage =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      (isRecord(data.error) && typeof data.error.message === 'string'
        ? data.error.message
        : null);
    const detailsMessage =
      extractDetailsMessage(data.details) ||
      (isRecord(data.error) ? extractDetailsMessage(data.error.details) : null);

    if (detailsMessage && isValidationMessage(directMessage)) return detailsMessage;
    if (detailsMessage && !directMessage) return detailsMessage;
    if (directMessage) return directMessage;
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
