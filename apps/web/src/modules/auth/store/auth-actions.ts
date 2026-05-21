import { apiClient, http } from '@/lib/api-client';
import { authLogger } from '@/lib/logger';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { AxiosError } from 'axios';

import type { User, WalletChallenge, AuthState, TwoFactorRequired } from './authStore.types';
import { getApiErrorMessage, mapUserFromApi } from './authStore.utils';

const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

function getResponseStatus(error: unknown): number | null {
  if (error instanceof AxiosError && typeof error.response?.status === 'number') {
    return error.response.status;
  }

  if (error instanceof Error) {
    const statusMatch = error.message.match(/\b(401|403)\b/);
    return statusMatch ? Number(statusMatch[1]) : null;
  }

  return null;
}

function isAuthFailure(error: unknown): boolean {
  const status = getResponseStatus(error);
  return status === 401 || status === 403;
}

function getStringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  return typeof field === 'string' ? field : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractRefreshTokens(data: unknown): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const body = isRecord(data) ? data : {};
  const tokens = isRecord(body.tokens) ? body.tokens : body;

  return {
    accessToken: getStringField(tokens, 'access_token'),
    refreshToken: getStringField(tokens, 'refresh_token'),
  };
}

type Set = (
  partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>),
  replace?: false,
  action?: string
) => void;
type Get = () => AuthState;

/**
 *
 * Description.
 */
export function createLoginAction(set: Set, _get: Get) {
  return async (
    email: string,
    password: string,
    turnstileToken?: string | null
  ): Promise<TwoFactorRequired | void> => {
    set({ isLoading: true, error: null }, false, 'login/start');

    if (isE2EAuthBypass) {
      const message = 'Invalid credentials';
      set({ error: message, isLoading: false }, false, 'login/e2e_error');
      throw new Error(message);
    }

    try {
      authLogger.info('[Auth] Attempting login...', { identifier: email });
      const result = await apiClient.auth.login(email, password, turnstileToken);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const data = result.data;

      // Handle 2FA-required response
      if ('status' in data && data.status === '2fa_required' && 'two_factor_token' in data) {
        authLogger.info('[Auth] 2FA required for user', { identifier: email });
        set({ isLoading: false }, false, 'login/2fa_required');
        return {
          twoFactorRequired: true,
          twoFactorToken: data.two_factor_token,
        };
      }

      // Full login response
      if (!('user' in data) || !data.user || !('tokens' in data) || !data.tokens) {
        authLogger.error('[Auth] Invalid response structure', { data });
        throw new Error('Invalid login response: missing user or tokens');
      }

      const { user, tokens } = data;

      // Debug logging for auth troubleshooting
      authLogger.info('[Auth] Login response received', {
        hasUser: !!user,
        hasTokens: !!tokens,
        cookiesPresent: document.cookie.includes('cgraph_'),
      });

      set(
        {
          user: mapUserFromApi(user),
          token: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        },
        false,
        'login/success'
      );

      authLogger.info('[Auth] Login successful', {
        userId: user.id,
        username: user.username,
      });
    } catch (error: unknown) {
      // Enhanced error logging for debugging
      if (error instanceof AxiosError) {
        authLogger.error('[Auth] Login failed (AxiosError)', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          // Check for CORS issues
          isCorsError: error.code === 'ERR_NETWORK' && !error.response,
        });
      } else {
        authLogger.error('[Auth] Login failed (Unknown error)', { error });
      }

      set(
        {
          error: getApiErrorMessage(error, 'Login failed'),
          isLoading: false,
        },
        false,
        'login/error'
      );
      throw error;
    }
  };
}

/** Submits TOTP or backup code to complete 2FA-gated login. */
export function createVerifyLoginTwoFactorAction(set: Set, _get: Get) {
  return async (twoFactorToken: string, code: string) => {
    set({ isLoading: true, error: null }, false, 'verify2fa/start');
    try {
      authLogger.info('[Auth] Verifying 2FA code...');
      const result = await apiClient.auth.verifyLoginTwoFactor(twoFactorToken, code);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const { user, tokens } = result.data;

      if (!user || !tokens) {
        authLogger.error('[Auth] Invalid 2FA verify response', { data: result.data });
        throw new Error('Invalid 2FA response: missing user or tokens');
      }

      set(
        {
          user: mapUserFromApi(user),
          token: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        },
        false,
        'verify2fa/success'
      );

      authLogger.info('[Auth] 2FA verification successful', {
        userId: user.id,
        username: user.username,
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        authLogger.error('[Auth] 2FA verification failed', {
          status: error.response?.status,
          data: error.response?.data,
        });
      }

      set(
        {
          error: getApiErrorMessage(error, 'Invalid verification code'),
          isLoading: false,
        },
        false,
        'verify2fa/error'
      );
      throw error;
    }
  };
}

/**
 *
 * Description.
 */
export function createGetWalletChallengeAction(set: Set, _get: Get) {
  return async (walletAddress: string): Promise<WalletChallenge> => {
    try {
      // Use http escape hatch: the typed schema returns `challenge` but the
      // WalletChallenge store type expects `message`; keep raw call to preserve
      // the existing field mapping until the type is updated.
      const response = await http.post('/api/v1/auth/wallet/challenge', {
        wallet_address: walletAddress,
      });
      return {
        message: response.data.message,
        nonce: response.data.nonce,
      };
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error, 'Failed to get wallet challenge');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };
}

/**
 *
 * Description.
 */
export function createLoginWithWalletAction(set: Set, _get: Get) {
  return async (walletAddress: string, signature: string, message?: string) => {
    set({ isLoading: true, error: null });
    try {
      // walletVerify requires a challenge field; fall back to http for the
      // message-only variant used in the existing wallet login flow.
      const response = await http.post('/api/v1/auth/wallet/verify', {
        wallet_address: walletAddress,
        signature,
        ...(message ? { message } : {}),
      });
      const { user, tokens } = response.data;
      set({
        user: mapUserFromApi(user),
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: getApiErrorMessage(error, 'Wallet login failed'),
        isLoading: false,
      });
      throw error;
    }
  };
}

/**
 *
 * Description.
 */
export function createRegisterAction(set: Set, _get: Get) {
  return async (
    email: string,
    username: string,
    password: string,
    turnstileToken?: string | null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.auth.register(
        {
          email,
          username,
          password,
          password_confirmation: password, // Backend requires confirmation
        },
        turnstileToken
      );
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const { user, tokens } = result.data;
      set({
        user: mapUserFromApi(user),
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: getApiErrorMessage(error, 'Registration failed'),
        isLoading: false,
      });
      throw error;
    }
  };
}

/**
 *
 * Description.
 */
export function createLogoutAction(set: Set, get: Get) {
  return async () => {
    // Attempt server-side logout to invalidate tokens
    const { token } = get();
    if (token) {
      try {
        await apiClient.auth.logout();
      } catch (error) {
        // Continue with client-side cleanup even if server call fails
        // This handles offline scenarios gracefully
        authLogger.warn('Server-side logout failed (continuing with client cleanup)', error);
      }
    }

    // Clear customizations to prevent persistence bleed to the next user
    useCustomizationStore.getState().resetToDefaults();

    // Clear all client-side auth state
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };
}

/**
 *
 * Description.
 */
export function createRefreshSessionAction(set: Set, get: Get) {
  return async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await http.post('/api/v1/auth/refresh', {});
      const { accessToken, refreshToken: newRefreshToken } = extractRefreshTokens(response.data);

      if (accessToken) {
        set({
          token: accessToken,
          refreshToken: newRefreshToken || refreshToken,
        });
      }
    } catch (error) {
      authLogger.warn('Session refresh failed', error);
      if (get().refreshToken === refreshToken) {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      }
    }
  };
}

/**
 *
 * Description.
 */
export function createUpdateUserAction(_set: Set, get: Get) {
  return (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      // We need to use the store's set directly — handled via closure
      _set({ user: { ...user, ...data } });
    }
  };
}

/**
 *
 * Description.
 */
export function createCheckAuthAction(set: Set, get: Get) {
  return async () => {
    const { token, refreshToken } = get();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const result = await apiClient.profile.getMe();
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      set({
        user: mapUserFromApi(result.data),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      if (isAuthFailure(error)) {
        authLogger.debug('checkAuth failed with invalid auth - clearing session:', error);
        const latest = get();
        if (latest.token === token && latest.refreshToken === refreshToken) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
        return;
      }

      authLogger.warn('checkAuth failed without auth rejection - preserving session:', error);
      set({ isLoading: false, isAuthenticated: true });
    }
  };
}
