import { describe, expect, it } from 'vitest';
import {
  CountriesResponseSchema,
  PhoneRequestResponseSchema,
  PhoneVerifyResponseSchema,
  apiCall,
  registrationLockSuccessSchema,
} from '@cgraph/api-client';
import { z } from 'zod';

const countries = [
  {
    code: 'US',
    name: 'United States',
    calling_code: '1',
  },
  {
    code: 'RO',
    name: 'Romania',
    calling_code: '40',
  },
];

const normalizedCountries = [
  {
    code: 'US',
    name: 'United States',
    calling_code: '+1',
  },
  {
    code: 'RO',
    name: 'Romania',
    calling_code: '+40',
  },
];

describe('CountriesResponseSchema', () => {
  it('normalizes the phone countries response shapes used by backend and clients', () => {
    expect(CountriesResponseSchema.parse(countries)).toEqual({ countries: normalizedCountries });
    expect(CountriesResponseSchema.parse({ countries })).toEqual({
      countries: normalizedCountries,
    });
    expect(CountriesResponseSchema.parse({ data: countries })).toEqual({
      countries: normalizedCountries,
    });
    expect(CountriesResponseSchema.parse({ data: { countries } })).toEqual({
      countries: normalizedCountries,
    });
  });
});

describe('PhoneRequestResponseSchema', () => {
  it('preserves the console-provider debug verification code for local registration', () => {
    expect(
      PhoneRequestResponseSchema.parse({
        session_id: 'session-1',
        phone_number: '+14155550001',
        transport: 'sms',
        expires_in: 600,
        retry_after: 30,
        call_fallback_available_after: 60,
        debug_verification_code: '123456',
      })
    ).toMatchObject({
      debug_verification_code: '123456',
    });
  });

  it('accepts SMS-only sessions with voice fallback disabled', () => {
    expect(
      PhoneRequestResponseSchema.parse({
        session_id: 'session-1',
        phone_number: '+14155550001',
        transport: 'sms',
        expires_in: 600,
        retry_after: 30,
        voice_available: false,
        call_fallback_available_after: null,
        next_call_after: null,
      })
    ).toMatchObject({
      voice_available: false,
      call_fallback_available_after: null,
      next_call_after: null,
    });
  });
});

const phoneAuthUser = {
  id: 'user-1',
  email: null,
  username: 'phone_user',
};

const tokens = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
};

describe('phone registration completion schemas', () => {
  it('accepts phone auth users without email and normalizes the backend complete step', () => {
    expect(
      PhoneVerifyResponseSchema.parse({
        user: phoneAuthUser,
        tokens,
        is_new_user: false,
        session_id: 'session-1',
        next_step: 'complete',
      })
    ).toMatchObject({
      user: { email: null },
      next_step: 'completed',
    });
  });

  it('keeps registration-lock continuation responses valid for phone-only accounts', () => {
    expect(
      registrationLockSuccessSchema.parse({
        user: phoneAuthUser,
        tokens: null,
        is_new_user: false,
        session_id: 'session-1',
        next_step: 'device_attestation',
      })
    ).toMatchObject({
      user: { email: null },
      tokens: null,
      next_step: 'device_attestation',
    });
  });
});

describe('apiCall response validation', () => {
  it('returns a product-safe error instead of exposing raw Zod internals', async () => {
    const result = await apiCall(
      async () => ({
        status: 200,
        data: {
          data: {
            user: {
              id: 'user-1',
              email: null,
            },
          },
        },
      }),
      z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
        }),
      })
    );

    expect(result).toMatchObject({
      ok: false,
      status: 0,
      error: {
        code: 'invalid_response',
        message: 'The server returned an unexpected response. Please refresh and try again.',
      },
    });
  });

  it('preserves structured backend error fields for registration lock UI state', async () => {
    const result = await apiCall(async () => {
      throw {
        response: {
          status: 403,
          data: {
            error: {
              code: 'WRONG_PIN',
              message: 'Incorrect PIN',
              attempts_remaining: 9,
              time_remaining: 0,
            },
          },
        },
      };
    }, z.object({}));

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      error: {
        code: 'WRONG_PIN',
        message: 'Incorrect PIN',
        details: {
          attempts_remaining: 9,
          time_remaining: 0,
        },
      },
    });
  });
});
