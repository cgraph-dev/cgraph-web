import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const mockAuthStore = {
  isAuthenticated: false,
  user: null as Record<string, unknown> | null,
  isLoading: false,
  error: null as string | null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  clearError: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/lib/api', () => ({
  api: mockApi,
  getErrorMessage: (error: Error) => error.message,
}));

const mockApiClient = vi.hoisted(() => ({
  profile: {
    getSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
  },
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}));

import { useAuth, usePasswordChange, useTwoFactor, useSessions } from '../index';

// NOTE: The existing test at modules/auth/__tests__/hooks.test.ts covers:
//  - useAuth: state, login success/fail, logout, register success/fail
//  - useTwoFactor: isEnabled true/false
//  - useSessions: initial empty state
// This file focuses on behaviors NOT covered there.

describe('Auth Hooks — Extended Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
    mockAuthStore.error = null;
    mockAuthStore.logout.mockResolvedValue(undefined);
  });
  describe('useAuth – clearError', () => {
    it('should expose clearError from the store', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockAuthStore.clearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAuth – loading state', () => {
    it('should reflect isLoading from the store', () => {
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useAuth – error state', () => {
    it('should reflect error from the store', () => {
      mockAuthStore.error = 'Something went wrong';

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe('Something went wrong');
    });
  });
  describe('useTwoFactor', () => {
    const setup = {
      secret: 'ABCDEF',
      qrCodeUri: 'otpauth://totp/CGraph:test@example.com?secret=ABCDEF',
      backupCodes: ['ABCD-1234'],
    };

    it('loads authoritative status and updates cached user state after the response', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          enabled: true,
          enabled_at: '2026-07-13T12:00:00Z',
          backup_codes_remaining: 6,
        },
      });

      const { result } = renderHook(() => useTwoFactor());

      let status: unknown;
      await act(async () => {
        status = await result.current.refreshStatus();
      });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/2fa/status');
      expect(status).toEqual({
        enabled: true,
        enabledAt: '2026-07-13T12:00:00Z',
        backupCodesRemaining: 6,
      });
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ twoFactorEnabled: true });
    });

    it('starts setup with the backend contract and maps its response', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          secret: setup.secret,
          qr_code_uri: setup.qrCodeUri,
          backup_codes: setup.backupCodes,
        },
      });

      const { result } = renderHook(() => useTwoFactor());

      let setupResult: unknown;
      await act(async () => {
        setupResult = await result.current.startSetup();
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/2fa/setup');
      expect(setupResult).toEqual(setup);
    });

    it('enables only through the backend then reloads authoritative status', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { enabled: true } });
      mockApi.get.mockResolvedValueOnce({
        data: { enabled: true, enabled_at: '2026-07-13T12:00:00Z', backup_codes_remaining: 6 },
      });

      const { result } = renderHook(() => useTwoFactor());

      let enabled: boolean | undefined;
      await act(async () => {
        enabled = await result.current.enable(setup, '123456');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/2fa/enable', {
        code: '123456',
        secret: setup.secret,
        backup_codes: setup.backupCodes,
      });
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/2fa/status');
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ twoFactorEnabled: true });
      expect(enabled).toBe(true);
    });

    it('keeps state unchanged when enable is rejected', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Invalid verification code'));

      const { result } = renderHook(() => useTwoFactor());

      let enabled: boolean | undefined;
      await act(async () => {
        enabled = await result.current.enable(setup, '000000');
      });

      expect(mockApi.get).not.toHaveBeenCalled();
      expect(mockAuthStore.updateUser).not.toHaveBeenCalled();
      expect(enabled).toBe(false);
      expect(result.current.error).toBe('Invalid verification code');
    });

    it('disables through the backend then reloads authoritative status', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { enabled: false } });
      mockApi.get.mockResolvedValueOnce({
        data: { enabled: false, enabled_at: null, backup_codes_remaining: 0 },
      });

      const { result } = renderHook(() => useTwoFactor());

      let disabled: boolean | undefined;
      await act(async () => {
        disabled = await result.current.disable('ABCD-1234');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/2fa/disable', {
        code: 'ABCD-1234',
      });
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/2fa/status');
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ twoFactorEnabled: false });
      expect(disabled).toBe(true);
    });
  });

  describe('usePasswordChange', () => {
    it('submits the committed backend contract then clears the authenticated state', async () => {
      mockApi.put.mockResolvedValueOnce({ data: { message: 'Password changed successfully' } });

      const { result } = renderHook(() => usePasswordChange());

      let changed: boolean | undefined;
      await act(async () => {
        changed = await result.current.changePassword({
          currentPassword: 'CurrentPassword123!',
          password: 'NewPassword123!',
          passwordConfirmation: 'NewPassword123!',
        });
      });

      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/auth/password', {
        current_password: 'CurrentPassword123!',
        password: 'NewPassword123!',
        password_confirmation: 'NewPassword123!',
      });
      expect(mockAuthStore.logout).toHaveBeenCalledTimes(1);
      expect(changed).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('keeps the authenticated state when the backend rejects the change', async () => {
      mockApi.put.mockRejectedValueOnce(new Error('Current password is incorrect'));

      const { result } = renderHook(() => usePasswordChange());

      let changed: boolean | undefined;
      await act(async () => {
        changed = await result.current.changePassword({
          currentPassword: 'WrongPassword123!',
          password: 'NewPassword123!',
          passwordConfirmation: 'NewPassword123!',
        });
      });

      expect(mockAuthStore.logout).not.toHaveBeenCalled();
      expect(changed).toBe(false);
      expect(result.current.error).toBe('Current password is incorrect');
    });
  });

  describe('useSessions – getSessions', () => {
    it('should fetch sessions and populate state', async () => {
      const sessionsData = [
        {
          id: 's1',
          ip: '1.2.3.4',
          user_agent: 'Chrome',
          location: 'Bucharest',
          current: true,
          last_active_at: '2025-12-01T00:00:00Z',
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 's2',
          ip: '5.6.7.8',
          user_agent: 'Firefox',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-30T00:00:00Z',
          created_at: '2025-11-30T00:00:00Z',
        },
      ];
      mockApiClient.profile.getSessions.mockResolvedValueOnce({ ok: true, data: sessionsData });

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(mockApiClient.profile.getSessions).toHaveBeenCalledTimes(1);
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.currentSessionId).toBe('s1');
      expect(fetched).toEqual(sessionsData);
    });

    it('should return empty array when getSessions fails', async () => {
      mockApiClient.profile.getSessions.mockResolvedValueOnce({
        ok: false,
        error: { code: 'unauthorized', message: 'Unauthorized' },
        status: 401,
      });

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(fetched).toEqual([]);
      expect(result.current.sessions).toEqual([]);
      expect(result.current.error).toBe('Unauthorized');
    });
  });

  describe('useSessions – revokeSession', () => {
    it('should delete session and remove from state', async () => {
      // Populate sessions first
      const sessionsData = [
        {
          id: 's1',
          ip: '1.2.3.4',
          user_agent: 'Chrome',
          location: 'Bucharest',
          current: true,
          last_active_at: '2025-12-01T00:00:00Z',
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 's2',
          ip: '5.6.7.8',
          user_agent: 'Firefox',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-30T00:00:00Z',
          created_at: '2025-11-30T00:00:00Z',
        },
      ];
      mockApiClient.profile.getSessions.mockResolvedValueOnce({ ok: true, data: sessionsData });
      mockApiClient.profile.revokeSession.mockResolvedValueOnce({
        ok: true,
        data: { message: 'Session revoked successfully' },
      });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(2);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeSession('s2');
      });

      expect(mockApiClient.profile.revokeSession).toHaveBeenCalledWith('s2');
      expect(mockApiClient.profile.getSessions).toHaveBeenCalledTimes(1);
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.id).toBe('s1');
    });

    it('retains the selected session when the server rejects revocation', async () => {
      const sessionsData = [
        {
          id: 's1',
          ip: '1.2.3.4',
          user_agent: 'Chrome',
          location: 'Bucharest',
          current: true,
          last_active_at: '2025-12-01T00:00:00Z',
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 's2',
          ip: '5.6.7.8',
          user_agent: 'Firefox',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-30T00:00:00Z',
          created_at: '2025-11-30T00:00:00Z',
        },
      ];
      mockApiClient.profile.getSessions.mockResolvedValueOnce({ ok: true, data: sessionsData });
      mockApiClient.profile.revokeSession.mockResolvedValueOnce({
        ok: false,
        error: { code: 'current_session', message: 'Use logout to end the current session' },
        status: 409,
      });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeSession('s2');
      });

      expect(revokeResult).toBe(false);
      expect(result.current.sessions).toEqual(sessionsData);
      expect(result.current.error).toBe('Use logout to end the current session');
    });

    it('rejects a duplicate mutation while the first command is in flight', async () => {
      const sessionsData = [
        {
          id: 's1',
          ip: '1.2.3.4',
          user_agent: 'Chrome',
          location: 'Bucharest',
          current: true,
          last_active_at: '2025-12-01T00:00:00Z',
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 's2',
          ip: '5.6.7.8',
          user_agent: 'Firefox',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-30T00:00:00Z',
          created_at: '2025-11-30T00:00:00Z',
        },
      ];
      let resolveRevocation:
        | ((value: { ok: true; data: { message: string } }) => void)
        | undefined;

      mockApiClient.profile.getSessions.mockResolvedValueOnce({ ok: true, data: sessionsData });
      mockApiClient.profile.revokeSession.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRevocation = resolve;
          })
      );

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });

      await act(async () => {
        const first = result.current.revokeSession('s2');
        const duplicate = result.current.revokeSession('s2');

        expect(await duplicate).toBe(false);
        expect(mockApiClient.profile.revokeSession).toHaveBeenCalledTimes(1);

        resolveRevocation?.({ ok: true, data: { message: 'Session revoked successfully' } });
        expect(await first).toBe(true);
      });

      expect(result.current.sessions.map((session) => session.id)).toEqual(['s1']);
    });
  });

  describe('useSessions – revokeAllOtherSessions', () => {
    it('should remove all non-current sessions', async () => {
      const sessionsData = [
        {
          id: 's1',
          ip: '1.2.3.4',
          user_agent: 'Chrome',
          location: 'Bucharest',
          current: true,
          last_active_at: '2025-12-01T00:00:00Z',
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 's2',
          ip: '5.6.7.8',
          user_agent: 'Firefox',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-30T00:00:00Z',
          created_at: '2025-11-30T00:00:00Z',
        },
        {
          id: 's3',
          ip: '9.8.7.6',
          user_agent: 'Safari',
          location: 'Bucharest',
          current: false,
          last_active_at: '2025-11-29T00:00:00Z',
          created_at: '2025-11-29T00:00:00Z',
        },
      ];
      mockApiClient.profile.getSessions.mockResolvedValueOnce({ ok: true, data: sessionsData });
      mockApiClient.profile.revokeOtherSessions.mockResolvedValueOnce({
        ok: true,
        data: { message: 'Other sessions revoked successfully' },
      });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(3);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeAllOtherSessions();
      });

      expect(mockApiClient.profile.revokeOtherSessions).toHaveBeenCalledTimes(1);
      expect(mockApiClient.profile.getSessions).toHaveBeenCalledTimes(1);
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.current).toBe(true);
    });
  });
});
