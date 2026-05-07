/**
 * Auth Actions Unit Tests
 *
 * Tests for the extracted auth action creators.
 * These test the action functions in isolation with mock set/get.
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: mockApi,
}));

vi.mock('@/lib/api-client', () => {
  return {
    api: mockApi,
    http: mockApi,
    apiClient: {
      auth: {
        login: async (identifier: string, password: string) => {
          const response = await mockApi.post('/api/v1/auth/login', { identifier, password });
          return { ok: true, data: response.data };
        },
        verifyLoginTwoFactor: async (twoFactorToken: string, code: string) => {
          const response = await mockApi.post('/api/v1/auth/login/2fa', {
            two_factor_token: twoFactorToken,
            code,
          });
          return { ok: true, data: response.data };
        },
        register: async (user: Record<string, unknown>) => {
          const response = await mockApi.post('/api/v1/auth/register', { user });
          return { ok: true, data: response.data };
        },
        logout: async () => {
          await mockApi.post('/api/v1/auth/logout');
          return { ok: true, data: undefined };
        },
        refresh: async (refreshToken: string) => {
          const response = await mockApi.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          return { ok: true, data: response.data.tokens ?? response.data };
        },
      },
      profile: {
        getMe: async () => {
          const response = await mockApi.get('/api/v1/me');
          return { ok: true, data: response.data.data ?? response.data };
        },
      },
    },
  };
});

vi.mock('@/lib/logger', () => ({
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../user-session-cleanup', () => ({
  resetUserScopedStores: vi.fn(),
}));

import { api } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { resetUserScopedStores } from '../user-session-cleanup';
import {
  createLoginAction,
  createVerifyLoginTwoFactorAction,
  createGetWalletChallengeAction,
  createLoginWithWalletAction,
  createRegisterAction,
  createLogoutAction,
  createRefreshSessionAction,
  createUpdateUserAction,
  createCheckAuthAction,
} from '../auth-actions';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
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
});

describe('createLogoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('calls server logout and clears state', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'my-token';
    state.isAuthenticated = true;
    const logout = createLogoutAction(set as never, get as never);

    mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

    await logout();

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    expect(resetUserScopedStores).toHaveBeenCalled();
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
    expect(resetUserScopedStores).toHaveBeenCalled();
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

    expect(resetUserScopedStores).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, isAuthenticated: false })
    );
  });

  it('removes auth and user-scoped persisted stores without clearing unrelated origin data', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = 'tok';
    const logout = createLogoutAction(set as never, get as never);

    sessionStorage.setItem(STORAGE_KEYS.auth, 'auth');
    sessionStorage.setItem(STORAGE_KEYS.socketSessionId, 'socket');
    localStorage.setItem(STORAGE_KEYS.settingsStore, 'settings');
    localStorage.setItem(STORAGE_KEYS.customizationStore, 'customization');
    localStorage.setItem(STORAGE_KEYS.premiumStore, 'premium');
    localStorage.setItem(STORAGE_KEYS.nodesStore, 'nodes');
    localStorage.setItem(STORAGE_KEYS.creatorStore, 'creator');
    localStorage.setItem(STORAGE_KEYS.themeStore, 'theme');
    localStorage.setItem('third-party-widget', 'keep');
    sessionStorage.setItem('third-party-session', 'keep');

    mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

    await logout();

    expect(sessionStorage.getItem(STORAGE_KEYS.auth)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.socketSessionId)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.settingsStore)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.customizationStore)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.premiumStore)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.nodesStore)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.creatorStore)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.themeStore)).toBeNull();
    expect(localStorage.getItem('third-party-widget')).toBe('keep');
    expect(sessionStorage.getItem('third-party-session')).toBe('keep');
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

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      refresh_token: 'old-refresh',
    });
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

  it('clears auth state on refresh failure', async () => {
    const { set, get, state } = createMockSetGet();
    state.refreshToken = 'expired';
    state.isAuthenticated = true;
    const refresh = createRefreshSessionAction(set as never, get as never);

    mockedApi.post.mockRejectedValueOnce(new Error('Token expired'));

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

    mockedApi.get.mockRejectedValueOnce(new Error('401'));

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

  it('sets not authenticated when no token exists', async () => {
    const { set, get, state } = createMockSetGet();
    state.token = null;
    const checkAuth = createCheckAuthAction(set as never, get as never);

    await checkAuth();

    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ isLoading: false, isAuthenticated: false });
  });
});
