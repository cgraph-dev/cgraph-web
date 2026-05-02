import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
const { mockFriendStore, mockAuthStore, mockApi, mockUnsubscribe } = vi.hoisted(() => ({
  mockFriendStore: {
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    removeFriend: vi.fn(),
  },
  mockAuthStore: {
    isAuthenticated: false,
    user: null as { id: string; username: string } | null,
  },
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  mockUnsubscribe: vi.fn(),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: vi.fn(() => mockFriendStore),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    joinPresenceLobby: vi.fn(() => ({ on: vi.fn(() => ({})), off: vi.fn() })),
    getOnlineFriends: vi.fn(() => []),
    isFriendOnline: vi.fn(() => false),
    isUserOnline: vi.fn(() => false),
    onStatusChange: vi.fn(() => mockUnsubscribe),
  },
}));

vi.mock('@/components/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), light: vi.fn() },
}));

vi.mock('@/data/achievements', () => ({
  ACHIEVEMENT_DEFINITIONS: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
}));

import { useProfileActions } from '../useProfileActions';
import { useProfileData } from '../useProfileData';
// NOTE: useProfileEdit removed — useProfileEdit.ts archived in batch 2
// NOTE: usePresence, useUserOnline removed — usePresence.ts archived in batch 2
import type { UserProfileData } from '@/types/profile.types';
function makeProfile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    bannerUrl: null,
    bio: 'Hello world',
    status: 'online',
    statusMessage: null,
    isVerified: false,
    isPremium: false,
    createdAt: '2025-01-01',
    ...overrides,
  };
}
describe('useProfileActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial isActioning as false', () => {
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    expect(result.current.isActioning).toBe(false);
    expect(typeof result.current.handleSendRequest).toBe('function');
    expect(typeof result.current.handleAcceptRequest).toBe('function');
    expect(typeof result.current.handleRemoveFriend).toBe('function');
  });

  it('handleSendRequest should call sendRequest and set status to pending_sent', async () => {
    mockFriendStore.sendRequest.mockResolvedValueOnce(undefined);
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(mockFriendStore.sendRequest).toHaveBeenCalledWith('testuser');
    expect(setStatus).toHaveBeenCalledWith('pending_sent');
    expect(result.current.isActioning).toBe(false);
  });

  it('handleSendRequest should not call sendRequest if profile is null', async () => {
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(null, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(mockFriendStore.sendRequest).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('handleAcceptRequest should call acceptRequest and set status to friends', async () => {
    mockFriendStore.acceptRequest.mockResolvedValueOnce(undefined);
    const profile = makeProfile({ id: 'friend-42' });
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleAcceptRequest();
    });

    expect(mockFriendStore.acceptRequest).toHaveBeenCalledWith('friend-42');
    expect(setStatus).toHaveBeenCalledWith('friends');
  });

  it('handleRemoveFriend should call removeFriend and set status to none', async () => {
    mockFriendStore.removeFriend.mockResolvedValueOnce(undefined);
    const profile = makeProfile({ id: 'friend-42' });
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleRemoveFriend();
    });

    expect(mockFriendStore.removeFriend).toHaveBeenCalledWith('friend-42');
    expect(setStatus).toHaveBeenCalledWith('none');
  });

  it('handleSendRequest should handle errors gracefully', async () => {
    mockFriendStore.sendRequest.mockRejectedValueOnce(new Error('Network error'));
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    // Should not set status on error, and isActioning should be reset
    expect(setStatus).not.toHaveBeenCalled();
    expect(result.current.isActioning).toBe(false);
  });
});
describe('useProfileData', () => {
  const ownStats = { level: 5, totalXP: 500, loginStreak: 3, totalUnlocked: 2 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load profile data from API', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          username: 'bob',
          display_name: 'Bob',
          avatar_url: null,
          banner_url: null,
          bio: 'Hi',
          status: 'online',
          custom_status: null,
          is_verified: true,
          is_premium: false,
          inserted_at: '2025-01-01',
          friendship_status: 'friends',
        },
      },
    });

    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile!.username).toBe('bob');
    expect(result.current.profile!.isVerified).toBe(true);
    expect(result.current.friendshipStatus).toBe('friends');
  });

  it('should set error when API fails', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load user profile');
    expect(result.current.profile).toBeNull();
  });

  it('should not fetch if userId is undefined', () => {
    const { result: _result } = renderHook(() => useProfileData(undefined, false, ownStats));

    // fetchProfile early-returns without calling the API
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});

// NOTE: useProfileEdit describe block removed — useProfileEdit.ts archived in batch 2
// NOTE: usePresence describe block removed — usePresence.ts archived in batch 2
// NOTE: useUserOnline describe block removed — usePresence.ts archived in batch 2
