import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { apiCall } from '../api-result';

function axiosFailure(data: unknown, status = 400): never {
  throw { response: { data, status } };
}

describe('apiCall error normalization', () => {
  const Schema = z.object({ ok: z.literal(true) });

  it('extracts a top-level error string', async () => {
    const result = await apiCall(
      async () => axiosFailure({ error: 'Invalid credentials' }, 401),
      Schema
    );

    expect(result).toMatchObject({
      ok: false,
      status: 401,
      error: { code: 'unknown', message: 'Invalid credentials' },
    });
  });

  it('extracts a nested error message', async () => {
    const result = await apiCall(
      async () =>
        axiosFailure({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, 401),
      Schema
    );

    expect(result).toMatchObject({
      ok: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
    });
  });

  it('extracts validation errors without object coercion', async () => {
    const result = await apiCall(
      async () => axiosFailure({ errors: { password: ['is required'] } }, 422),
      Schema
    );

    expect(result).toMatchObject({
      ok: false,
      status: 422,
      error: { message: 'is required' },
    });
  });

  it('formats backend validation details with field names', async () => {
    const result = await apiCall(
      async () =>
        axiosFailure(
          {
            error: {
              code: 'validation_error',
              message: 'Validation failed',
              details: {
                email: ['has invalid format'],
                password: ['must contain at least one uppercase letter'],
              },
            },
          },
          422
        ),
      Schema
    );

    expect(result).toMatchObject({
      ok: false,
      status: 422,
      error: {
        code: 'validation_error',
        message:
          'Email has invalid format. Password must contain at least one uppercase letter',
        details: {
          email: ['has invalid format'],
          password: ['must contain at least one uppercase letter'],
        },
      },
    });
  });
});
