/**
 * Auth Hooks
 *
 * Custom React hooks for authentication.
 * Connected to authStore for actual backend integration.
 */

import { useState } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { asBool, asString } from '@/lib/api-utils';
import { authLogger } from '@/lib/logger';
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
/**
 * Provides TOTP two-factor authentication state and enable/verify/disable actions.
 */
export function useTwoFactor() {
  const { user, updateUser } = useAuthStore();
  const isEnabled = user?.twoFactorEnabled ?? false;

  const enable = async () => {
    try {
      const { api: http } = await import('@/lib/api');
      const response = await http.post<{ secret: string; qr_code: string }>(
        '/api/v1/auth/totp/setup'
      );
      return response.data;
    } catch (error) {
      authLogger.error('TOTP setup failed', error);
      return null;
    }
  };

  const verify = async (code: string) => {
    try {
      const { api: http } = await import('@/lib/api');
      await http.post('/api/v1/auth/totp/enable', { code });
      updateUser({ twoFactorEnabled: true });
      return true;
    } catch (error) {
      authLogger.error('TOTP verification failed', error);
      return false;
    }
  };

  const disable = async (code: string) => {
    try {
      const { api: http } = await import('@/lib/api');
      await http.post('/api/v1/auth/totp/disable', { code });
      updateUser({ twoFactorEnabled: false });
      return true;
    } catch (error) {
      authLogger.error('TOTP disable failed', error);
      return false;
    }
  };

  return {
    isEnabled,
    enable,
    verify,
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

type SessionPayload = Record<string, unknown>;

interface SessionsResponse {
  data?: SessionPayload[];
  sessions?: SessionPayload[];
  current_session_id?: string | null;
}

function normalizeSession(payload: SessionPayload): Session {
  return {
    id: asString(payload.id),
    device: asString(payload.device) || asString(payload.user_agent) || 'Unknown Device',
    ip: asString(payload.ip) || asString(payload.ip_address),
    lastActive:
      asString(payload.lastActive) ||
      asString(payload.last_active_at) ||
      asString(payload.last_seen_at) ||
      asString(payload.created_at) ||
      asString(payload.inserted_at),
    isCurrent: asBool(payload.isCurrent) || asBool(payload.current),
  };
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
      const response = await http.get<SessionsResponse>('/api/v1/me/sessions');
      const rawSessions = response.data.data ?? response.data.sessions ?? [];
      const normalizedSessions = rawSessions.map(normalizeSession);
      const currentSessionId =
        response.data.current_session_id ??
        normalizedSessions.find((session) => session.isCurrent)?.id ??
        null;

      setSessions(normalizedSessions);
      setCurrentSessionId(currentSessionId);
      return normalizedSessions;
    } catch (error) {
      authLogger.error('Failed to fetch sessions', error);
      return [];
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { api: http } = await import('@/lib/api');
      await http.delete(`/api/v1/me/sessions/${sessionId}`);
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
      await http.delete('/api/v1/me/sessions');
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
