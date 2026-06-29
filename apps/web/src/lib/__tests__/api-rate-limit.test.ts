import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearRateLimitScopes,
  createRateLimitCooldownError,
  formatRateLimitWait,
  getRateLimitRemainingMs,
  isRateLimited,
  RATE_LIMIT_COOLDOWN_ERROR_CODE,
  rememberRateLimit,
} from '../api-rate-limit';

const scope = 'test:api-rate-limit';

afterEach(() => {
  vi.useRealTimers();
  clearRateLimitScopes([scope]);
});

describe('api-rate-limit', () => {
  it('recognizes axios 429 responses', () => {
    expect(
      isRateLimited({
        response: {
          status: 429,
          data: { error: { message: 'Too many requests' } },
        },
      })
    ).toBe(true);
  });

  it('stores retry-after-ms header cooldowns from axios errors', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));

    const message = rememberRateLimit([scope], {
      response: {
        status: 429,
        headers: { 'retry-after-ms': '18000' },
        data: { error: { message: 'Too many requests. Please wait 18 seconds before retrying.' } },
      },
    });

    expect(message).toBe('Too many requests. Please wait 18 seconds before retrying.');
    expect(getRateLimitRemainingMs(scope)).toBe(18_000);
  });

  it('stores retry-after seconds header cooldowns from axios errors', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));

    rememberRateLimit([scope], {
      response: {
        status: 429,
        headers: { 'retry-after': '9' },
      },
    });

    expect(getRateLimitRemainingMs(scope)).toBe(9_000);
  });

  it('creates axios-shaped local cooldown errors', () => {
    const error = createRateLimitCooldownError(2_400);

    expect(error.code).toBe(RATE_LIMIT_COOLDOWN_ERROR_CODE);
    expect(error.isRateLimitCooldown).toBe(true);
    expect(error.response.status).toBe(429);
    expect(error.response.data.error.retry_after_ms).toBe(2_400);
    expect(error.message).toBe(formatRateLimitWait(2_400));
  });
});
