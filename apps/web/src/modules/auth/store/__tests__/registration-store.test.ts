import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPhoneVerifyCode } = vi.hoisted(() => ({
  mockPhoneVerifyCode: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    auth: {
      phoneVerifyCode: mockPhoneVerifyCode,
    },
  },
  http: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../authStore.impl', () => ({
  useAuthStore: {
    setState: vi.fn(),
  },
}));

vi.mock('../authStore.utils', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
  mapUserFromApi: (user: unknown) => user,
}));

import { usePhoneRegistrationStore } from '../registration-store';

const phoneUser = {
  id: 'user-1',
  email: null,
  username: 'phone_user',
};

describe('usePhoneRegistrationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePhoneRegistrationStore.getState().reset();
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
