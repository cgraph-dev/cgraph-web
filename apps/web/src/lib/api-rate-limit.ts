const DEFAULT_RETRY_MS = 30_000;

export const USER_API_RATE_LIMIT_SCOPE = 'api:user-session';
export const RATE_LIMIT_COOLDOWN_ERROR_CODE = 'ERR_CGRAPH_RATE_LIMIT_COOLDOWN';

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

function getResponseRecord(value: Record<string, unknown>): Record<string, unknown> | null {
  return getNestedRecord(value, 'response');
}

function getHeaderValue(headers: Record<string, unknown>, headerName: string): unknown {
  const get = headers.get;
  if (typeof get === 'function') {
    const value = get.call(headers, headerName);
    if (value !== undefined && value !== null) return value;
  }

  const normalizedName = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedName) return value;
  }

  return undefined;
}

function parseRetryAfterHeader(value: unknown): number | null {
  const seconds = toNumber(value);
  if (seconds !== null) return Math.max(seconds * 1000, 0);

  if (typeof value === 'string' && value.trim() !== '') {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return Math.max(timestamp - Date.now(), 0);
  }

  return null;
}

function extractRetryAfterHeaderMs(headers: unknown): number | null {
  if (!isRecord(headers)) return null;

  const retryAfterMs = toNumber(getHeaderValue(headers, 'retry-after-ms'));
  if (retryAfterMs !== null) return Math.max(retryAfterMs, 0);

  const retryAfter = parseRetryAfterHeader(getHeaderValue(headers, 'retry-after'));
  if (retryAfter !== null) return retryAfter;

  const resetAt = parseRetryAfterHeader(getHeaderValue(headers, 'x-ratelimit-reset'));
  if (resetAt !== null) return resetAt;

  return null;
}

function extractRetryAfterMs(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const response = getResponseRecord(value);
  if (response) {
    const fromHeaders = extractRetryAfterHeaderMs(response.headers);
    if (fromHeaders !== null) return fromHeaders;

    const fromData = extractRetryAfterMs(response.data);
    if (fromData !== null) return fromData;
  }

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

  const response = getResponseRecord(value);
  if (response) {
    const fromData = extractMessage(response.data);
    if (fromData) return fromData;
  }

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

  const response = getResponseRecord(value);
  const responseStatus = response ? toNumber(response.status) : null;
  return responseStatus;
}

export function isRateLimited(value: unknown): boolean {
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

export interface RateLimitCooldownError extends Error {
  code: typeof RATE_LIMIT_COOLDOWN_ERROR_CODE;
  isRateLimitCooldown: true;
  response: {
    status: 429;
    data: {
      error: {
        code: 'rate_limit_cooldown';
        message: string;
        retry_after_ms: number;
      };
    };
  };
}

export function createRateLimitCooldownError(remainingMs: number): RateLimitCooldownError {
  const retryAfterMs = Math.max(remainingMs, 1000);
  const message = formatRateLimitWait(retryAfterMs);
  const details = {
    code: RATE_LIMIT_COOLDOWN_ERROR_CODE,
    isRateLimitCooldown: true,
    response: {
      status: 429,
      data: {
        error: {
          code: 'rate_limit_cooldown',
          message,
          retry_after_ms: retryAfterMs,
        },
      },
    },
  } satisfies Pick<RateLimitCooldownError, 'code' | 'isRateLimitCooldown' | 'response'>;
  const error = Object.assign(new Error(message), details);
  error.name = 'RateLimitCooldownError';
  return error;
}

export function isRateLimitCooldownError(value: unknown): value is RateLimitCooldownError {
  return (
    isRecord(value) &&
    value.code === RATE_LIMIT_COOLDOWN_ERROR_CODE &&
    value.isRateLimitCooldown === true
  );
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
