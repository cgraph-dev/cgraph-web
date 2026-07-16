/**
 * Auth Actions Unit Tests
 *
 * Tests for the extracted auth action creators.
 * These test the action functions in isolation with mock set/get.
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';

const mockHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
const mockVerifyEmail = vi.hoisted(() => vi.fn());
const mockForgotPassword = vi.hoisted(() => vi.fn());
const mockResetPassword = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-client', () => ({
  http: mockHttp,
  apiClient: {
    auth: {
      login: async (identifier: string, password: string) => {
        const response = await mockHttp.post('/api/v1/auth/login', { identifier, password });
        return { ok: true, data: response.data };
      },
      verifyLoginTwoFactor: async (twoFactorToken: string, code: string) => {
        const response = await mockHttp.post('/api/v1/auth/login/2fa', {
          two_factor_token: twoFactorToken,
          code,
        });
        return { ok: true, data: response.data };
      },
      verifyEmail: mockVerifyEmail,
      forgotPassword: mockForgotPassword,
      resetPassword: mockResetPassword,
      register: async (payload: Record<string, unknown>) => {
        const response = await mockHttp.post('/api/v1/auth/register', { user: payload });
        return { ok: true, data: response.data };
      },
      logout: async () => {
        await mockHttp.post('/api/v1/auth/logout');
        return { ok: true, data: undefined };
      },
      refresh: async (refreshToken: string) => {
        const response = await mockHttp.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });
        return { ok: true, data: response.data.tokens ?? response.data };
      },
    },
    profile: {
      getMe: async () => {
        const response = await mockHttp.get('/api/v1/me');
        return { ok: true, data: response.data.data ?? response.data.user ?? response.data };
      },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  })),
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: {
    getState: vi.fn(() => ({ resetToDefaults: vi.fn() })),
  },
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: {
    getState: vi.fn(() => ({ resetToDefaults: vi.fn() })),
  },
}));

import { http } from '@/lib/api-client';
import {
  createLoginAction,
  createVerifyLoginTwoFactorAction,
  createVerifyEmailAction,
  createRequestPasswordResetAction,
  createResetPasswordAction,
  createGetWalletChallengeAction,
  createLoginWithWalletAction,
  createRegisterAction,
  createLogoutAction,
  createRefreshSessionAction,
  createUpdateUserAction,
  createCheckAuthAction,
} from '../auth-actions';

const mockedApi = {
  get: http.get as MockedFunction<typeof http.get>,
  post: http.post as MockedFunction<typeof http.post>,
};
const mockApiUser = {
  id: 'user-1',
  uid: '1234567890',
  user_id: 42,
  user_id_display: '#1234567890',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  wallet_address: null,
  email_verified_at: null,
  totp_enabled: false,
  status: 'online',
  custom_status: null,
  karma: 0,
  is_verified: false,
  is_premium: false,
  is_admin: false,
  can_change_username: true,
  username_next_change_at: null,
  inserted_at: '2024-01-01T00:00:00Z',
};

const mockTokens = {
  access_token: 'access-123',
  refresh_token: 'refresh-456',
};

interface MockState {
  user: unknown;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

function createMockSetGet() {
  const state: MockState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  const set = vi.fn((partial: Partial<MockState> | ((s: MockState) => Partial<MockState>)) => {
    const updates = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, updates);
  });

  const get = vi.fn(() => state) as unknown as () => MockState;

  return { state, set, get };
}
describe('createLoginAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets isLoading before request and clears on success', async () => {
    const { set, get } = createMockSetGet();
    const login = createLoginAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: mockApiUser, tokens: mockTokens },
    } as AxiosResponse);

    await login('test@example.com', 'password');

    // First call sets loading
    expect(set).toHaveBeenCalledWith({ isLoading: true, error: null }, false, 'login/start');
    // Last call with success sets authenticated
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: true,
        isLoading: false,
        token: 'access-123',
        refreshToken: 'refresh-456',
      }),
      false,
      'login/success'
    );
  });

  it('returns 2FA required object when server responds with 2fa_required', async () => {
    const { set, get } = createMockSetGet();
    const login = createLoginAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { status: '2fa_required', two_factor_token: 'tfa-token-abc' },
    } as AxiosResponse);

    const result = await login('test@example.com', 'password');

    expect(result).toEqual({
      twoFactorRequired: true,
      twoFactorToken: 'tfa-token-abc',
    });
    // Should stop loading
    expect(set).toHaveBeenCalledWith({ isLoading: false }, false, 'login/2fa_required');
  });

  it('throws when response is missing user or tokens', async () => {
    const { set, get } = createMockSetGet();
    const login = createLoginAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: null, tokens: null },
    } as AxiosResponse);

    await expect(login('a@b.com', 'pw')).rejects.toThrow('Invalid login response');
  });

  it('sets error on failure', async () => {
    const { set, get } = createMockSetGet();
    const login = createLoginAction(set as never, get as never);

    const err = new AxiosError('fail');
    err.response = { data: { error: 'Bad password' }, status: 401 } as AxiosResponse;
    mockedApi.post.mockRejectedValueOnce(err);

    await expect(login('a@b.com', 'pw')).rejects.toThrow();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Bad password', isLoading: false }),
      false,
      'login/error'
    );
  });
});

describe('createVerifyLoginTwoFactorAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('completes 2FA verification and sets authenticated state', async () => {
    const { set, get } = createMockSetGet();
    const verify2fa = createVerifyLoginTwoFactorAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: mockApiUser, tokens: mockTokens },
    } as AxiosResponse);

    await verify2fa('tfa-token', '123456');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/login/2fa', {
      two_factor_token: 'tfa-token',
      code: '123456',
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ isAuthenticated: true, isLoading: false }),
      false,
      'verify2fa/success'
    );
  });

  it('sets error on invalid 2FA code', async () => {
    const { set, get } = createMockSetGet();
    const verify2fa = createVerifyLoginTwoFactorAction(set as never, get as never);

    const err = new AxiosError('fail');
    err.response = { data: { error: 'Invalid code' }, status: 401 } as AxiosResponse;
    mockedApi.post.mockRejectedValueOnce(err);

    await expect(verify2fa('token', 'bad')).rejects.toThrow();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid code', isLoading: false }),
      false,
      'verify2fa/error'
    );
  });
});

describe('createVerifyEmailAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('installs the verified user and resumable session', async () => {
    const { set, get } = createMockSetGet();
    const verifyEmail = createVerifyEmailAction(set as never, get as never);

    mockVerifyEmail.mockResolvedValueOnce({
      ok: true,
      data: {
        email_verified: true,
        user: { ...mockApiUser, email_verified_at: '2026-07-15T16:00:00Z' },
        tokens: mockTokens,
      },
    });

    expect(await verifyEmail('verification-token')).toEqual({ ok: true });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: true,
        isLoading: false,
        token: 'access-123',
        refreshToken: 'refresh-456',
      }),
      false,
      'verifyEmail/success'
    );
  });

  it('returns a typed recovery failure without creating client auth state', async () => {
    const { set, get } = createMockSetGet();
    const verifyEmail = createVerifyEmailAction(set as never, get as never);

    mockVerifyEmail.mockResolvedValueOnce({
      ok: false,
      status: 400,
      error: { code: 'invalid_token', message: 'Invalid verification token' },
    });

    expect(await verifyEmail('replaced-token')).toEqual({
      ok: false,
      status: 400,
      message: 'Invalid verification token',
    });
    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({ isAuthenticated: true }),
      expect.anything(),
      expect.anything()
    );
  });
});

describe('password recovery actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shares one reset-email request across concurrent callers', async () => {
    const { set, get } = createMockSetGet();
    const requestPasswordReset = createRequestPasswordResetAction(set as never, get as never);
    let resolveRequest: ((result: { ok: true; data: { message: string } }) => void) | null = null;

    mockForgotPassword.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    const first = requestPasswordReset('user@example.com', 'captcha-token');
    const second = requestPasswordReset('ignored@example.com', 'other-token');

    expect(first).toBe(second);
    expect(mockForgotPassword).toHaveBeenCalledTimes(1);
    expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com', 'captcha-token');

    resolveRequest?.({ ok: true, data: { message: 'Check your email' } });
    await first;

    expect(set).toHaveBeenCalledWith(
      { isLoading: false },
      false,
      'requestPasswordReset/success'
    );
  });

  it('keeps a reset-email failure visible until the next explicit attempt', async () => {
    const { state, set, get } = createMockSetGet();
    const requestPasswordReset = createRequestPasswordResetAction(set as never, get as never);

    mockForgotPassword.mockResolvedValueOnce({
      ok: false,
      status: 503,
      error: { code: 'service_unavailable', message: 'Email service is unavailable' },
    });

    await expect(requestPasswordReset('user@example.com')).rejects.toThrow(
      'Email service is unavailable'
    );
    expect(state.error).toBe('Email service is unavailable');
    expect(state.isLoading).toBe(false);

    mockForgotPassword.mockResolvedValueOnce({
      ok: true,
      data: { message: 'Check your email' },
    });
    await requestPasswordReset('user@example.com');

    expect(mockForgotPassword).toHaveBeenCalledTimes(2);
    expect(state.error).toBeNull();
  });

  it('returns a typed invalid-token result without creating auth state', async () => {
    const { state, set, get } = createMockSetGet();
    const resetPassword = createResetPasswordAction(set as never, get as never);

    mockResetPassword.mockResolvedValueOnce({
      ok: false,
      status: 400,
      error: { code: 'invalid_reset_token', message: 'Invalid or expired reset token' },
    });

    await expect(
      resetPassword('used-token', 'NewPassword123!', 'NewPassword123!')
    ).resolves.toEqual({
      ok: false,
      status: 400,
      code: 'invalid_reset_token',
      message: 'Invalid or expired reset token',
    });
    expect(state.error).toBe('Invalid or expired reset token');
    expect(state.isAuthenticated).toBe(false);
  });

  it('shares one reset submission and permits a later retry', async () => {
    const { state, set, get } = createMockSetGet();
    const resetPassword = createResetPasswordAction(set as never, get as never);
    let resolveRequest: ((result: { ok: true; data: { message: string } }) => void) | null = null;

    mockResetPassword.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    const first = resetPassword('token', 'NewPassword123!', 'NewPassword123!', 'captcha');
    const second = resetPassword('token', 'NewPassword123!', 'NewPassword123!', 'captcha');

    expect(first).toBe(second);
    expect(mockResetPassword).toHaveBeenCalledTimes(1);
    resolveRequest?.({ ok: true, data: { message: 'Password reset' } });
    await expect(first).resolves.toEqual({ ok: true });
    expect(state.error).toBeNull();

    mockResetPassword.mockResolvedValueOnce({
      ok: true,
      data: { message: 'Password reset again' },
    });
    await resetPassword('new-token', 'OtherPassword123!', 'OtherPassword123!');
    expect(mockResetPassword).toHaveBeenCalledTimes(2);
  });
});

describe('createGetWalletChallengeAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns wallet challenge from API', async () => {
    const { set, get } = createMockSetGet();
    const getChallenge = createGetWalletChallengeAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { message: 'Sign this message', nonce: 'nonce-xyz' },
    } as AxiosResponse);

    const result = await getChallenge('0xWALLET');

    expect(result).toEqual({ message: 'Sign this message', nonce: 'nonce-xyz' });
    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/wallet/challenge', {
      wallet_address: '0xWALLET',
    });
  });

  it('sets error and throws on failure', async () => {
    const { set, get } = createMockSetGet();
    const getChallenge = createGetWalletChallengeAction(set as never, get as never);

    const err = new AxiosError('fail');
    err.response = { data: { error: 'Wallet not found' }, status: 404 } as AxiosResponse;
    mockedApi.post.mockRejectedValueOnce(err);

    await expect(getChallenge('0xBAD')).rejects.toThrow('Wallet not found');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ error: 'Wallet not found' }));
  });
});

describe('createLoginWithWalletAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('authenticates with wallet and sets state', async () => {
    const { set, get } = createMockSetGet();
    const loginWallet = createLoginWithWalletAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: mockApiUser, tokens: mockTokens },
    } as AxiosResponse);

    await loginWallet('0xWALLET', 'sig123');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/wallet/verify', {
      wallet_address: '0xWALLET',
      signature: 'sig123',
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ isAuthenticated: true, isLoading: false })
    );
  });

  it('includes optional message parameter', async () => {
    const { set, get } = createMockSetGet();
    const loginWallet = createLoginWithWalletAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: mockApiUser, tokens: mockTokens },
    } as AxiosResponse);

    await loginWallet('0xWALLET', 'sig', 'Sign this');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/wallet/verify', {
      wallet_address: '0xWALLET',
      signature: 'sig',
      message: 'Sign this',
    });
  });
});

describe('createRegisterAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends correct registration payload with password_confirmation', async () => {
    const { set, get } = createMockSetGet();
    const register = createRegisterAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { user: mockApiUser, tokens: mockTokens },
    } as AxiosResponse);

    await register('new@test.com', 'newuser', 'Pass123!');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/register', {
      user: {
        email: 'new@test.com',
        username: 'newuser',
        password: 'Pass123!',
        password_confirmation: 'Pass123!',
      },
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ isAuthenticated: true, isLoading: false })
    );
  });

  it('retains structured validation details from a rejected registration', async () => {
    const { set, get } = createMockSetGet();
    const register = createRegisterAction(set as never, get as never);
    const error = new AxiosError('Request failed with status code 422');

    error.response = {
      data: {
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: { username: ['has already been taken'] },
        },
      },
      status: 422,
    } as AxiosResponse;

    mockedApi.post.mockRejectedValueOnce(error);

    await expect(register('new@test.com', 'newuser', 'Pass123!')).rejects.toThrow(
      'Request failed with status code 422'
    );

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'username: has already been taken',
        isLoading: false,
      })
    );
  });
});

describe('createLogoutAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls server logout and clears state', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'my-token';
    state.isAuthenticated = true;
    const logout = createLogoutAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

    await logout();

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
  });

  it('skips server call when no token and still clears state', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = null;
    const logout = createLogoutAction(set as never, get as never);

    await logout();

    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, isAuthenticated: false })
    );
  });

  it('clears state even when server logout fails', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'tok';
    const logout = createLogoutAction(set as never, get as never);

    mockedApi.post.mockRejectedValueOnce(new Error('offline'));

    await logout();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, isAuthenticated: false })
    );
  });
});

describe('createRefreshSessionAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates tokens on successful refresh', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'old-refresh';
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { tokens: { access_token: 'new-access', refresh_token: 'new-refresh' } },
    } as AxiosResponse);

    await refresh();

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'new-access', refreshToken: 'new-refresh' })
    );
  });

  it('handles unwrapped token response format', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'old';
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    } as AxiosResponse);

    await refresh();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'new-access', refreshToken: 'new-refresh' })
    );
  });

  it('keeps existing refresh token if new one not provided', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'keep-this';
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({
      data: { access_token: 'new-access' },
    } as AxiosResponse);

    await refresh();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'new-access', refreshToken: 'keep-this' })
    );
  });

  it('does nothing when no refresh token exists', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = null;
    const refresh = createRefreshSessionAction(set as never, get as never);

    await refresh();

    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('clears auth state on refresh rejection', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'expired';
    state.isAuthenticated = true;
    const refresh = createRefreshSessionAction(set as never, get as never);

    const error = new AxiosError('Token expired');
    error.response = { data: { error: 'expired' }, status: 401 } as AxiosResponse;
    mockedApi.post.mockRejectedValueOnce(error);

    await refresh();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
  });

  it('preserves auth state on transient refresh failure', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'current-refresh';
    state.token = 'current-access';
    state.isAuthenticated = true;
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockRejectedValueOnce(new Error('Network Error'));

    await refresh();

    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
  });

  it('shares one refresh request across concurrent callers', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'old-refresh';
    const refresh = createRefreshSessionAction(set as never, get as never);
    let resolveRequest: ((response: AxiosResponse) => void) | null = null;

    mockedApi.post.mockImplementationOnce(
      () =>
        new Promise<AxiosResponse>((resolve) => {
          resolveRequest = resolve;
        })
    );

    const first = refresh();
    const second = refresh();

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    resolveRequest?.({
      data: { tokens: { access_token: 'new-access', refresh_token: 'new-refresh' } },
    } as AxiosResponse);

    await Promise.all([first, second]);
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
  });

  it('does not clear a newer session when an old refresh fails', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'old-refresh';
    state.token = 'old-access';
    state.isAuthenticated = true;
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockImplementationOnce(async () => {
      state.refreshToken = 'new-refresh';
      state.token = 'new-access';
      throw new Error('Old refresh failed');
    });

    await refresh();

    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
  });
});

describe('createUpdateUserAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges partial user data into existing user', () => {
    const { set, get, state } = createMockSetGet();
    state.user = { id: 'u1', username: 'old', email: 'a@b.com' };
    const updateUser = createUpdateUserAction(set as never, get as never);

    updateUser({ username: 'new-name' } as never);

    expect(set).toHaveBeenCalledWith({
      user: expect.objectContaining({ id: 'u1', username: 'new-name', email: 'a@b.com' }),
    });
  });

  it('does nothing when no user exists', () => {
    const { set, get, state } = createMockSetGet();
    state.user = null;
    const updateUser = createUpdateUserAction(set as never, get as never);

    updateUser({ username: 'x' } as never);

    expect(set).not.toHaveBeenCalled();
  });
});

describe('createCheckAuthAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches user profile and sets authenticated state', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'valid-token';
    const checkAuth = createCheckAuthAction(set as never, get as never);

    mockedApi.get.mockResolvedValueOnce({
      data: { data: mockApiUser },
    } as AxiosResponse);

    await checkAuth();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/me');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ isAuthenticated: true, isLoading: false })
    );
  });

  it('handles response.data.user format', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'valid';
    const checkAuth = createCheckAuthAction(set as never, get as never);

    mockedApi.get.mockResolvedValueOnce({
      data: { user: mockApiUser },
    } as AxiosResponse);

    await checkAuth();

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ isAuthenticated: true }));
  });

  it('clears auth state when token is invalid', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'bad-token';
    state.isAuthenticated = true;
    const checkAuth = createCheckAuthAction(set as never, get as never);

    const err = new AxiosError('unauthorized');
    err.response = { data: { error: 'Unauthorized' }, status: 401 } as AxiosResponse;
    mockedApi.get.mockRejectedValueOnce(err);

    await checkAuth();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    );
  });

  it('does not clear a newer login when an old profile check fails', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'old-token';
    state.refreshToken = 'old-refresh';
    state.isAuthenticated = true;
    const checkAuth = createCheckAuthAction(set as never, get as never);

    const err = new AxiosError('unauthorized');
    err.response = { data: { error: 'Unauthorized' }, status: 401 } as AxiosResponse;
    mockedApi.get.mockImplementationOnce(async () => {
      state.token = 'new-token';
      state.refreshToken = 'new-refresh';
      state.isAuthenticated = true;
      throw err;
    });

    await checkAuth();

    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
    expect(set).toHaveBeenCalledWith({ isLoading: false });
  });

  it('preserves the session when profile check fails without an auth rejection', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'valid-token';
    state.isAuthenticated = true;
    state.user = { id: 'u1', username: 'stable' };
    const checkAuth = createCheckAuthAction(set as never, get as never);

    mockedApi.get.mockRejectedValueOnce(new Error('Network Error'));

    await checkAuth();

    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    );
    expect(set).toHaveBeenCalledWith({ isLoading: false, isAuthenticated: true });
  });

  it('sets not authenticated when no token exists', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = null;
    const checkAuth = createCheckAuthAction(set as never, get as never);

    await checkAuth();

    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ isLoading: false, isAuthenticated: false });
  });
});
