import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthSetState, mockPhoneVerifyCode } = vi.hoisted(() => ({
  mockAuthSetState: vi.fn(),
  mockPhoneVerifyCode: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    auth: {
      phoneVerifyCode: mockPhoneVerifyCode,
    },
  },
}));

vi.mock('../authStore.impl', () => ({
  useAuthStore: {
    setState: mockAuthSetState,
  },
}));

vi.mock('../authStore.utils', () => ({
  mapUserFromApi: (user: unknown) => user,
}));

import { PHONE_REGISTRATION_STORAGE_KEY, usePhoneRegistrationStore } from '../registration-store';

const phoneUser = {
  id: 'user-1',
  email: null,
  username: 'phone_user',
};

const unitedStates = {
  code: 'US',
  name: 'United States',
  calling_code: '+1',
  flag: 'US',
};

function validOtpCheckpoint() {
  const now = Date.now();

  return {
    intent: 'register' as const,
    step: 'otp' as const,
    selectedCountry: unitedStates,
    phoneNumber: '(415) 555-0001',
    submittedPhoneNumber: '+14155550001',
    requestedTransport: 'sms' as const,
    retryAvailableAt: now + 30_000,
    callFallbackAvailableAt: now + 60_000,
    nextVerificationAttemptAt: now + 5_000,
    allowedToRequestCode: true,
    codeExpiresAt: now + 600_000,
    incorrectCodeAttempts: 2,
    sessionId: 'session-1',
    pendingChallenges: ['captcha'],
    verificationChallenges: ['captcha'],
  };
}

describe('usePhoneRegistrationStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    usePhoneRegistrationStore.getState().reset();
    await usePhoneRegistrationStore.persist.clearStorage();
    sessionStorage.clear();
  });

  it('persists only the resumable OTP checkpoint and excludes codes', () => {
    usePhoneRegistrationStore.setState({
      ...validOtpCheckpoint(),
      code: '123456',
      debugVerificationCode: '654321',
    });

    const rawCheckpoint = sessionStorage.getItem(PHONE_REGISTRATION_STORAGE_KEY);
    expect(rawCheckpoint).not.toBeNull();

    const persisted = JSON.parse(rawCheckpoint ?? '{}') as {
      readonly state?: Record<string, unknown>;
      readonly version?: number;
    };

    expect(persisted.version).toBe(1);
    expect(persisted.state).toMatchObject({
      intent: 'register',
      step: 'otp',
      sessionId: 'session-1',
      submittedPhoneNumber: '+14155550001',
    });
    expect(persisted.state).not.toHaveProperty('code');
    expect(persisted.state).not.toHaveProperty('debugVerificationCode');
    expect(rawCheckpoint).not.toContain('123456');
    expect(rawCheckpoint).not.toContain('654321');
  });

  it('rehydrates one valid OTP session without resetting absolute server timers', async () => {
    const checkpoint = validOtpCheckpoint();

    sessionStorage.setItem(
      PHONE_REGISTRATION_STORAGE_KEY,
      JSON.stringify({ state: checkpoint, version: 1 })
    );

    await usePhoneRegistrationStore.persist.rehydrate();

    expect(usePhoneRegistrationStore.getState()).toMatchObject({
      ...checkpoint,
      code: '',
      debugVerificationCode: null,
      isSubmitting: false,
      error: null,
    });
  });

  it('discards expired and incomplete persisted checkpoints', async () => {
    sessionStorage.setItem(
      PHONE_REGISTRATION_STORAGE_KEY,
      JSON.stringify({
        state: {
          ...validOtpCheckpoint(),
          sessionId: '',
          codeExpiresAt: Date.now() - 1,
        },
        version: 1,
      })
    );

    await usePhoneRegistrationStore.persist.rehydrate();

    expect(usePhoneRegistrationStore.getState()).toMatchObject({
      intent: null,
      step: 'phone',
      sessionId: null,
      submittedPhoneNumber: '',
      codeExpiresAt: null,
    });
  });

  it('preserves a same-intent flow and resets it when the route intent changes', () => {
    usePhoneRegistrationStore.setState(validOtpCheckpoint());

    usePhoneRegistrationStore.getState().prepareFlow('register');
    expect(usePhoneRegistrationStore.getState().step).toBe('otp');
    expect(usePhoneRegistrationStore.getState().sessionId).toBe('session-1');

    usePhoneRegistrationStore.getState().prepareFlow('login');
    expect(usePhoneRegistrationStore.getState()).toMatchObject({
      intent: 'login',
      step: 'phone',
      selectedCountry: unitedStates,
      sessionId: null,
      submittedPhoneNumber: '',
      codeExpiresAt: null,
    });
  });

  it('leaves no resumable checkpoint after reset', () => {
    usePhoneRegistrationStore.setState(validOtpCheckpoint());
    usePhoneRegistrationStore.getState().reset();

    const persisted = JSON.parse(
      sessionStorage.getItem(PHONE_REGISTRATION_STORAGE_KEY) ?? '{}'
    ) as { readonly state?: Record<string, unknown> };

    expect(persisted.state).toEqual({});
  });

  it('does not route web users into native device attestation after OTP verification', async () => {
    mockPhoneVerifyCode.mockResolvedValueOnce({
      ok: true,
      data: {
        user: phoneUser,
        tokens: null,
        is_new_user: true,
        session_id: 'session-1',
        next_step: 'device_attestation',
      },
    });

    usePhoneRegistrationStore.setState({
      step: 'otp',
      submittedPhoneNumber: '+14155550001',
      code: '123456',
      sessionId: 'session-1',
    });

    const result = await usePhoneRegistrationStore.getState().verifyCode();
    const state = usePhoneRegistrationStore.getState();

    expect(result).toBe(false);
    expect(state.step).toBe('otp');
    expect(state.isSubmitting).toBe(false);
    expect(state.error).toContain('native device verification');
  });

  it('commits token-bearing verification immediately and leaves no phone auth checkpoint', async () => {
    mockPhoneVerifyCode.mockResolvedValueOnce({
      ok: true,
      data: {
        user: { ...phoneUser, onboarding_completed: false },
        tokens: {
          access_token: 'access-secret',
          refresh_token: 'refresh-secret',
        },
        is_new_user: true,
        session_id: 'session-1',
        next_step: 'profile',
      },
    });
    usePhoneRegistrationStore.setState({
      ...validOtpCheckpoint(),
      code: '123456',
    });

    await expect(usePhoneRegistrationStore.getState().verifyCode()).resolves.toBe(true);

    expect(mockAuthSetState).toHaveBeenCalledWith({
      user: { ...phoneUser, onboarding_completed: false },
      token: 'access-secret',
      refreshToken: 'refresh-secret',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    expect(usePhoneRegistrationStore.getState()).toMatchObject({
      step: 'phone',
      sessionId: null,
      code: '',
    });
    const rawCheckpoint = sessionStorage.getItem(PHONE_REGISTRATION_STORAGE_KEY) ?? '';
    expect(rawCheckpoint).not.toContain('access-secret');
    expect(rawCheckpoint).not.toContain('refresh-secret');
  });

  it('keeps registration-lock users on web when native attestation is required next', async () => {
    usePhoneRegistrationStore.setState({
      step: 'registration_lock',
      sessionId: 'session-1',
    });

    const result = await usePhoneRegistrationStore.getState().completeRegistrationLock({
      user: phoneUser,
      tokens: null,
      is_new_user: false,
      session_id: 'session-1',
      next_step: 'device_attestation',
    });
    const state = usePhoneRegistrationStore.getState();

    expect(result).toBe(false);
    expect(state.step).toBe('registration_lock');
    expect(state.error).toContain('native device verification');
  });
});
