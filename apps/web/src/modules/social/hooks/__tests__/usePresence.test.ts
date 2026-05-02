/**
 * usePresence & useUserOnline Hook Unit Tests
 *
 * Tests for presence tracking hooks that connect to Phoenix channels.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnStatusChange = vi.fn();
const mockJoinPresenceLobby = vi.fn();
const mockGetOnlineFriends = vi.fn();
const mockIsFriendOnline = vi.fn();
const mockChannelOn = vi.fn();
const mockChannelOff = vi.fn();

vi.mock('@/lib/socket', () => ({
  socketManager: {
    joinPresenceLobby: (...args: unknown[]) => mockJoinPresenceLobby(...args),
    getOnlineFriends: (...args: unknown[]) => mockGetOnlineFriends(...args),
    isFriendOnline: (...args: unknown[]) => mockIsFriendOnline(...args),
    onStatusChange: (...args: unknown[]) => mockOnStatusChange(...args),
  },
}));

const mockAuthState = {
  isAuthenticated: false,
  user: null as { id: string } | null,
};

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthState),
}));

import { usePresence, useUserOnline } from '../usePresence';

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthState.isAuthenticated = false;
  mockAuthState.user = null;
  mockOnStatusChange.mockReturnValue(vi.fn()); // unsubscribe
  mockJoinPresenceLobby.mockReturnValue({
    on: mockChannelOn.mockReturnValue('ref-1'),
    off: mockChannelOff,
  });
  mockGetOnlineFriends.mockReturnValue([]);
  mockIsFriendOnline.mockReturnValue(false);
});

describe('usePresence', () => {
  it('returns disconnected state when not authenticated', () => {
    const { result } = renderHook(() => usePresence());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.onlineFriends.size).toBe(0);
    expect(result.current.onlineCount).toBe(0);
  });

  it('connects to presence lobby when authenticated', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };

    renderHook(() => usePresence());

    expect(mockJoinPresenceLobby).toHaveBeenCalled();
    expect(mockOnStatusChange).toHaveBeenCalled();
  });

  it('populates onlineFriends from initial state', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockGetOnlineFriends.mockReturnValue(['u-1', 'u-2']);

    const { result } = renderHook(() => usePresence());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.onlineFriends.size).toBe(2);
    expect(result.current.onlineCount).toBe(2);
  });

  it('isUserOnline returns true for known online user', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockGetOnlineFriends.mockReturnValue(['u-1']);

    const { result } = renderHook(() => usePresence());

    expect(result.current.isUserOnline('u-1')).toBe(true);
    expect(result.current.isUserOnline('u-99')).toBe(false);
  });

  it('isUserOnline returns false for empty userId', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };

    const { result } = renderHook(() => usePresence());

    expect(result.current.isUserOnline('')).toBe(false);
  });

  it('updates onlineFriends when status change callback fires for lobby', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };

    const { result } = renderHook(() => usePresence());

    // Get the callback passed to onStatusChange
    const statusCallback = mockOnStatusChange.mock.calls[0]![0];

    // User comes online
    act(() => {
      statusCallback('lobby', 'u-5', true);
    });

    expect(result.current.onlineFriends.has('u-5')).toBe(true);
    expect(result.current.onlineCount).toBe(1);

    // User goes offline
    act(() => {
      statusCallback('lobby', 'u-5', false);
    });

    expect(result.current.onlineFriends.has('u-5')).toBe(false);
    expect(result.current.onlineCount).toBe(0);
  });

  it('ignores status changes for non-lobby conversations', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };

    const { result } = renderHook(() => usePresence());

    const statusCallback = mockOnStatusChange.mock.calls[0]![0];

    act(() => {
      statusCallback('conversation:123', 'u-5', true);
    });

    expect(result.current.onlineFriends.size).toBe(0);
  });

  it('cleans up on unmount', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    const unsubscribe = vi.fn();
    mockOnStatusChange.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => usePresence());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('getStatusMessage returns undefined when no status message exists', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };

    const { result } = renderHook(() => usePresence());

    expect(result.current.getStatusMessage('u-1')).toBeUndefined();
  });

  it('handles joinPresenceLobby returning null', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockJoinPresenceLobby.mockReturnValue(null);

    const { result } = renderHook(() => usePresence());

    expect(result.current.isConnected).toBe(false);
  });
});

describe('useUserOnline', () => {
  it('returns false when not authenticated', () => {
    const { result } = renderHook(() => useUserOnline('u-1'));

    expect(result.current).toBe(false);
  });

  it('returns false when userId is undefined', () => {
    mockAuthState.isAuthenticated = true;

    const { result } = renderHook(() => useUserOnline(undefined));

    expect(result.current).toBe(false);
  });

  it('returns initial online state from socketManager', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockIsFriendOnline.mockReturnValue(true);

    const { result } = renderHook(() => useUserOnline('u-1'));

    expect(result.current).toBe(true);
    expect(mockIsFriendOnline).toHaveBeenCalledWith('u-1');
  });

  it('updates when user status changes', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockIsFriendOnline.mockReturnValue(false);

    const { result } = renderHook(() => useUserOnline('u-1'));

    expect(result.current).toBe(false);

    const statusCallback = mockOnStatusChange.mock.calls[0]![0];

    act(() => {
      statusCallback('lobby', 'u-1', true);
    });

    expect(result.current).toBe(true);
  });

  it('ignores status changes for other users', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    mockIsFriendOnline.mockReturnValue(false);

    const { result } = renderHook(() => useUserOnline('u-1'));

    const statusCallback = mockOnStatusChange.mock.calls[0]![0];

    act(() => {
      statusCallback('lobby', 'u-99', true);
    });

    expect(result.current).toBe(false);
  });

  it('cleans up subscription on unmount', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'me' };
    const unsubscribe = vi.fn();
    mockOnStatusChange.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useUserOnline('u-1'));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
