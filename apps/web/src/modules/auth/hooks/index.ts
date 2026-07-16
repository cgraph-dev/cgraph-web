/**
 * Auth Hooks
 *
 * Custom React hooks for authentication.
 * Connected to authStore for actual backend integration.
 */

import { useCallback, useRef, useState } from 'react';
import type { ActiveSession } from '@cgraph-dev/api-client';
import { useAuthStore } from '@/modules/auth/store';
import { authLogger } from '@/lib/logger';
import { api, getErrorMessage } from '@/lib/api';
import { apiClient } from '@/lib/api-client';
/**
 * Provides authentication state and login/logout/register actions from the auth store.
 */
export function useAuth() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    clearError,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      await storeLogin(email, password);
      return true;
    } catch (error) {
      authLogger.error('Login failed', error);
      return false;
    }
  };

  const logout = async () => {
    await storeLogout();
  };

  const register = async (data: { email: string; username: string; password: string }) => {
    try {
      await storeRegister(data.email, data.username, data.password);
      return true;
    } catch (error) {
      authLogger.error('Registration failed', error);
      return false;
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
  };
}

export interface PasswordChangeInput {
  readonly currentPassword: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

/**
 * Owns the web-side transition for the backend-authenticated password change.
 * The backend verifies, hashes, and revokes sessions; successful changes clear
 * this browser's authentication state through the established logout owner.
 */
export function usePasswordChange() {
  const { logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const changePassword = useCallback(
    async ({ currentPassword, password, passwordConfirmation }: PasswordChangeInput) => {
      setIsChanging(true);
      setError(null);

      try {
        await api.put('/api/v1/auth/password', {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        });

        await logout();
        return true;
      } catch (error) {
        authLogger.error('Password change failed', error);
        setError(getErrorMessage(error));
        return false;
      } finally {
        setIsChanging(false);
      }
    },
    [logout]
  );

  return {
    error,
    isChanging,
    clearError: () => setError(null),
    changePassword,
  };
}

export interface TwoFactorStatus {
  readonly enabled: boolean;
  readonly enabledAt: string | null;
  readonly backupCodesRemaining: number;
}

export interface TwoFactorSetup {
  readonly secret: string;
  readonly qrCodeUri: string;
  readonly backupCodes: readonly string[];
}

interface TwoFactorStatusResponse {
  readonly enabled: boolean;
  readonly enabled_at: string | null;
  readonly backup_codes_remaining: number;
}

interface TwoFactorSetupResponse {
  readonly secret: string;
  readonly qr_code_uri: string;
  readonly backup_codes: string[];
}

function mapTwoFactorStatus(response: TwoFactorStatusResponse): TwoFactorStatus {
  return {
    enabled: response.enabled,
    enabledAt: response.enabled_at,
    backupCodesRemaining: response.backup_codes_remaining,
  };
}

function mapTwoFactorSetup(response: TwoFactorSetupResponse): TwoFactorSetup {
  return {
    secret: response.secret,
    qrCodeUri: response.qr_code_uri,
    backupCodes: response.backup_codes,
  };
}

/**
 * Provides the web state owner for the existing backend-owned TOTP lifecycle.
 * TOTP generation, verification, and rate limiting remain on the backend.
 */
export function useTwoFactor() {
  const { updateUser } = useAuthStore();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const refreshStatus = useCallback(async (): Promise<TwoFactorStatus | null> => {
    setIsLoadingStatus(true);
    setError(null);

    try {
      const response = await api.get<TwoFactorStatusResponse>('/api/v1/auth/2fa/status');
      const nextStatus = mapTwoFactorStatus(response.data);

      setStatus(nextStatus);
      updateUser({ twoFactorEnabled: nextStatus.enabled });
      return nextStatus;
    } catch (error) {
      authLogger.error('Failed to load two-factor status', error);
      setError(getErrorMessage(error));
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  }, [updateUser]);

  const startSetup = useCallback(async (): Promise<TwoFactorSetup | null> => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await api.post<TwoFactorSetupResponse>('/api/v1/auth/2fa/setup');
      return mapTwoFactorSetup(response.data);
    } catch (error) {
      authLogger.error('Two-factor setup failed', error);
      setError(getErrorMessage(error));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const enable = useCallback(
    async (setup: TwoFactorSetup, code: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      try {
        await api.post('/api/v1/auth/2fa/enable', {
          code,
          secret: setup.secret,
          backup_codes: setup.backupCodes,
        });

        const nextStatus = await refreshStatus();
        return nextStatus?.enabled === true;
      } catch (error) {
        authLogger.error('Two-factor enable failed', error);
        setError(getErrorMessage(error));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [refreshStatus]
  );

  const disable = useCallback(
    async (code: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      try {
        await api.post('/api/v1/auth/2fa/disable', { code });

        const nextStatus = await refreshStatus();
        return nextStatus?.enabled === false;
      } catch (error) {
        authLogger.error('Two-factor disable failed', error);
        setError(getErrorMessage(error));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [refreshStatus]
  );

  return {
    status,
    error,
    clearError: () => setError(null),
    isLoadingStatus,
    isMutating,
    refreshStatus,
    startSetup,
    enable,
    disable,
  };
}

/**
 * Provides the Active Sessions lifecycle through the shared API-client contract.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutationInFlight = useRef(false);

  const getSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.profile.getSessions();

      if (!result.ok) {
        setError(result.error.message);
        return [];
      }

      setSessions(result.data);
      return result.data;
    } catch (error) {
      authLogger.error('Failed to fetch sessions', error);
      setError('Failed to load active sessions. Please refresh and try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (mutationInFlight.current) return false;

    mutationInFlight.current = true;
    setIsMutating(true);
    setError(null);

    try {
      const result = await apiClient.profile.revokeSession(sessionId);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      setSessions((current) => current.filter((session) => session.id !== sessionId));
      return true;
    } catch (error) {
      authLogger.error('Failed to revoke session', error);
      setError('Failed to revoke the session. Please try again.');
      return false;
    } finally {
      mutationInFlight.current = false;
      setIsMutating(false);
    }
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    if (mutationInFlight.current) return false;

    mutationInFlight.current = true;
    setIsMutating(true);
    setError(null);

    try {
      const result = await apiClient.profile.revokeOtherSessions();

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      setSessions((current) => current.filter((session) => session.current));
      return true;
    } catch (error) {
      authLogger.error('Failed to revoke all other sessions', error);
      setError('Failed to revoke other sessions. Please try again.');
      return false;
    } finally {
      mutationInFlight.current = false;
      setIsMutating(false);
    }
  }, []);

  return {
    sessions,
    currentSessionId: sessions.find((session) => session.current)?.id ?? null,
    isLoading,
    isMutating,
    error,
    clearError: () => setError(null),
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}
