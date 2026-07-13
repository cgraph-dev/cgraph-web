/**
 * Auth Hooks
 *
 * Custom React hooks for authentication.
 * Connected to authStore for actual backend integration.
 */

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { authLogger } from '@/lib/logger';
import { api, getErrorMessage } from '@/lib/api';
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

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}
/**
 * Provides session management: listing active sessions and revoking specific ones.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const getSessions = async () => {
    try {
      const { api: http } = await import('@/lib/api');
      const response = await http.get<{ sessions: Session[]; current_session_id: string }>(
        '/api/v1/auth/sessions'
      );
      setSessions(response.data.sessions);
      setCurrentSessionId(response.data.current_session_id);
      return response.data.sessions;
    } catch (error) {
      authLogger.error('Failed to fetch sessions', error);
      return [];
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { api: http } = await import('@/lib/api');
      await http.delete(`/api/v1/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch (error) {
      authLogger.error('Failed to revoke session', error);
      return false;
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const { api: http } = await import('@/lib/api');
      await http.delete('/api/v1/auth/sessions');
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      return true;
    } catch (error) {
      authLogger.error('Failed to revoke all other sessions', error);
      return false;
    }
  };

  return {
    sessions,
    currentSessionId,
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}
