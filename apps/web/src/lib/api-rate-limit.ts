const DEFAULT_RETRY_MS = 30_000;

export const USER_API_RATE_LIMIT_SCOPE = 'api:user-session';

const cooldowns = new Map<string, number>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getNestedRecord(value: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function extractRetryAfterMs(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const retryAfterMs = toNumber(value.retry_after_ms ?? value.retryAfterMs);
  if (retryAfterMs !== null) return Math.max(retryAfterMs, 0);

  const retryAfterSeconds = toNumber(
    value.retry_after_seconds ?? value.retry_after ?? value.retryAfterSeconds ?? value.retryAfter
  );
  if (retryAfterSeconds !== null) return Math.max(retryAfterSeconds * 1000, 0);

  const details = getNestedRecord(value, 'details');
  if (details) return extractRetryAfterMs(details);

  const error = getNestedRecord(value, 'error');
  if (error) return extractRetryAfterMs(error);

  return null;
}

function extractMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (!isRecord(value)) return null;

  const direct = extractMessage(value.message ?? value.detail);
  if (direct) return direct;

  const error = extractMessage(value.error);
  if (error) return error;

  return null;
}

function extractStatus(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const ownStatus = toNumber(value.status);
  if (ownStatus !== null) return ownStatus;

  const response = getNestedRecord(value, 'response');
  const responseStatus = response ? toNumber(response.status) : null;
  return responseStatus;
}

function isRateLimited(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (extractStatus(value) === 429) return true;

  const code = value.code ?? getNestedRecord(value, 'error')?.code;
  if (typeof code === 'string' && code.toLowerCase().includes('rate_limit')) return true;

  const message = extractMessage(value);
  return message ? /too many requests|rate limit/i.test(message) : false;
}

export function getRateLimitRemainingMs(scope: string): number {
  const until = cooldowns.get(scope) ?? 0;
  const remaining = until - Date.now();
  if (remaining <= 0) {
    cooldowns.delete(scope);
    return 0;
  }
  return remaining;
}

export function getMaxRateLimitRemainingMs(scopes: readonly string[]): number {
  return scopes.reduce((max, scope) => Math.max(max, getRateLimitRemainingMs(scope)), 0);
}

export function formatRateLimitWait(remainingMs: number): string {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  return `Too many requests. Please wait ${seconds} seconds before retrying.`;
}

export function rememberRateLimit(
  scopes: readonly string[],
  value: unknown,
  fallbackMs = DEFAULT_RETRY_MS
): string | null {
  if (!isRateLimited(value)) return null;

  const retryAfterMs = extractRetryAfterMs(value) ?? fallbackMs;
  const until = Date.now() + Math.max(retryAfterMs, 1000);
  for (const scope of scopes) {
    cooldowns.set(scope, until);
  }

  return extractMessage(value) ?? formatRateLimitWait(retryAfterMs);
}

export function clearRateLimitScopes(scopes: readonly string[]): void {
  for (const scope of scopes) {
    cooldowns.delete(scope);
  }
}
