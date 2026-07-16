import { apiClient, http } from '@/lib/api-client';
import { authLogger } from '@/lib/logger';
import { clearOfflineData } from '@/lib/offline/indexeddb-cache';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { AxiosError } from 'axios';

import type {
  User,
  WalletChallenge,
  AuthState,
  TwoFactorRequired,
  EmailVerificationResult,
  PasswordResetResult,
} from './authStore.types';
import { getApiErrorMessage, getApiResultErrorMessage, mapUserFromApi } from './authStore.utils';

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

/** Consumes an email token and installs the backend-issued verified session. */
export function createVerifyEmailAction(set: Set, _get: Get) {
  return async (token: string): Promise<EmailVerificationResult> => {
    set({ isLoading: true, error: null }, false, 'verifyEmail/start');

    const result = await apiClient.auth.verifyEmail(token);

    if (!result.ok) {
      set({ isLoading: false }, false, 'verifyEmail/error');
      return {
        ok: false,
        status: result.status,
        message: result.error.message,
      };
    }

    const { user, tokens } = result.data;
    set(
      {
        user: mapUserFromApi(user),
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      },
      false,
      'verifyEmail/success'
    );

    return { ok: true };
  };
}

/** Requests a reset email through the auth state owner. */
export function createRequestPasswordResetAction(set: Set, _get: Get) {
  let activeRequest: Promise<void> | null = null;

  const request = async (email: string, turnstileToken?: string | null): Promise<void> => {
    set({ isLoading: true, error: null }, false, 'requestPasswordReset/start');

    try {
      const result = await apiClient.auth.forgotPassword(email, turnstileToken);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      set({ isLoading: false }, false, 'requestPasswordReset/success');
    } catch (error: unknown) {
      set(
        {
          error: getApiErrorMessage(error, 'Unable to request a password reset'),
          isLoading: false,
        },
        false,
        'requestPasswordReset/error'
      );
      throw error;
    }
  };

  return (email: string, turnstileToken?: string | null): Promise<void> => {
    if (activeRequest) {
      return activeRequest;
    }

    activeRequest = request(email, turnstileToken).finally(() => {
      activeRequest = null;
    });

    return activeRequest;
  };
}

/** Consumes a reset token through the auth state owner. */
export function createResetPasswordAction(set: Set, _get: Get) {
  let activeRequest: Promise<PasswordResetResult> | null = null;

  const reset = async (
    token: string,
    password: string,
    passwordConfirmation: string,
    turnstileToken?: string | null
  ): Promise<PasswordResetResult> => {
    set({ isLoading: true, error: null }, false, 'resetPassword/start');

    try {
      const result = await apiClient.auth.resetPassword(
        token,
        password,
        passwordConfirmation,
        turnstileToken
      );

      if (!result.ok) {
        const failure: PasswordResetResult = {
          ok: false,
          status: result.status,
          code: result.error.code ?? null,
          message: result.error.message,
        };

        set(
          { error: failure.message, isLoading: false },
          false,
          'resetPassword/rejected'
        );
        return failure;
      }

      set({ isLoading: false }, false, 'resetPassword/success');
      return { ok: true };
    } catch (error: unknown) {
      const failure: PasswordResetResult = {
        ok: false,
        status: getResponseStatus(error),
        code: null,
        message: getApiErrorMessage(error, 'Unable to reset your password'),
      };

      set({ error: failure.message, isLoading: false }, false, 'resetPassword/error');
      return failure;
    }
  };

  return (
    token: string,
    password: string,
    passwordConfirmation: string,
    turnstileToken?: string | null
  ): Promise<PasswordResetResult> => {
    if (activeRequest) {
      return activeRequest;
    }

    activeRequest = reset(token, password, passwordConfirmation, turnstileToken).finally(() => {
      activeRequest = null;
    });

    return activeRequest;
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
        throw new Error(getApiResultErrorMessage(result.error, 'Registration failed'));
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
  let activeLogout: Promise<void> | null = null;

  return () => {
    if (activeLogout) return activeLogout;

    activeLogout = (async () => {
      const { isAuthenticated, refreshToken, token } = get();

      if (isAuthenticated || token || refreshToken) {
        try {
          const result = await apiClient.auth.logout();

          if (!result.ok) {
            authLogger.warn('Server-side logout was rejected (continuing with client cleanup)', {
              code: result.error.code,
            });
          }
        } catch (error) {
          authLogger.warn('Server-side logout failed (continuing with client cleanup)', error);
        }
      }

      try {
        await clearOfflineData();
      } catch (error) {
        authLogger.warn('Offline data cleanup failed (continuing with logout)', error);
      }

      try {
        useCustomizationStore.getState().resetToDefaults();
      } catch (error) {
        authLogger.warn('Customization cleanup failed (continuing with logout)', error);
      }

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    })().finally(() => {
      activeLogout = null;
    });

    return activeLogout;
  };
}

/**
 *
 * Description.
 */
export function createRefreshSessionAction(set: Set, get: Get) {
  let activeRefresh: Promise<void> | null = null;

  const refresh = async (): Promise<void> => {
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
      if (isAuthFailure(error) && get().refreshToken === refreshToken) {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      }
    }
  };

  return () => {
    if (activeRefresh) {
      return activeRefresh;
    }

    activeRefresh = refresh().finally(() => {
      activeRefresh = null;
    });

    return activeRefresh;
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
