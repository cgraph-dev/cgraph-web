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
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/sessions');
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.currentSessionId).toBe('s1');
      expect(fetched).toEqual(sessionsData.sessions);
    });

    it('should return empty array when getSessions fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(fetched).toEqual([]);
      expect(result.current.sessions).toEqual([]);
    });
  });

  describe('useSessions – revokeSession', () => {
    it('should delete session and remove from state', async () => {
      // Populate sessions first
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(2);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeSession('s2');
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/auth/sessions/s2');
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.id).toBe('s1');
    });
  });

  describe('useSessions – revokeAllOtherSessions', () => {
    it('should remove all non-current sessions', async () => {
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
          { id: 's3', device: 'Safari', ip: '9.8.7.6', lastActive: '2025-11-29', isCurrent: false },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(3);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeAllOtherSessions();
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/auth/sessions');
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.isCurrent).toBe(true);
    });
  });
});
