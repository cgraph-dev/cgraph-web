import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Friend, FriendRequest } from '@/modules/social/store';
import type { UserProfileData } from '@/types/profile.types';
import { useProfileActions } from '../useProfileActions';

const { friendState, toast, navigate } = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  friendState: {
    friends: [] as Friend[],
    pendingRequests: [] as FriendRequest[],
    sentRequests: [] as FriendRequest[],
    sendRequest: vi.fn(() => Promise.resolve()),
    acceptRequest: vi.fn(() => Promise.resolve()),
    declineRequest: vi.fn(() => Promise.resolve()),
    cancelRequest: vi.fn(() => Promise.resolve()),
    removeFriend: vi.fn(() => Promise.resolve()),
    blockUser: vi.fn(() => Promise.resolve()),
    fetchFriends: vi.fn(() => Promise.resolve()),
    fetchSentRequests: vi.fn(() => Promise.resolve()),
    fetchPendingRequests: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('@/modules/social/store', () => {
  function useFriendStore() {
    return friendState;
  }
  useFriendStore.getState = () => friendState;
  return { useFriendStore };
});

vi.mock('@/shared/components/ui', () => ({ toast }));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { error: vi.fn(), light: vi.fn(), medium: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({ http: { patch: vi.fn(() => Promise.resolve({})) } }));

vi.mock('@/lib/avatar-upload', () => ({
  uploadCurrentUserAvatarAndSync: vi.fn(),
}));

vi.mock('@/lib/identity/ownIdentitySync', () => ({ applyOwnIdentityPatch: vi.fn() }));

function profile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 'profile-user',
    username: 'profileuser',
    displayName: 'Profile User',
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    status: 'offline',
    statusMessage: null,
    isVerified: false,
    isPremium: false,
    createdAt: '2026-07-08T00:00:00.000Z',
    ...overrides,
  };
}

function request(id: string, type: FriendRequest['type']): FriendRequest {
  return {
    id,
    type,
    createdAt: '2026-07-08T00:00:00.000Z',
    user: {
      id: 'profile-user',
      username: 'profileuser',
      displayName: 'Profile User',
      avatarUrl: null,
    },
  };
}

function friend(): Friend {
  return {
    id: 'profile-user',
    username: 'profileuser',
    displayName: 'Profile User',
    avatarUrl: null,
    status: 'offline',
    statusMessage: null,
    friendshipId: 'friendship-1',
    createdAt: '2026-07-08T00:00:00.000Z',
  };
}

function renderActions(setFriendshipStatus = vi.fn()) {
  return renderHook(() =>
    useProfileActions({
      profile: profile(),
      setProfile: vi.fn(),
      isOwnProfile: false,
      setFriendshipStatus,
    })
  );
}

describe('useProfileActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    friendState.friends = [];
    friendState.pendingRequests = [];
    friendState.sentRequests = [];
    friendState.sendRequest.mockResolvedValue(undefined);
    friendState.acceptRequest.mockResolvedValue(undefined);
    friendState.declineRequest.mockResolvedValue(undefined);
    friendState.cancelRequest.mockResolvedValue(undefined);
    friendState.removeFriend.mockResolvedValue(undefined);
    friendState.blockUser.mockResolvedValue(undefined);
    friendState.fetchFriends.mockResolvedValue(undefined);
    friendState.fetchSentRequests.mockResolvedValue(undefined);
    friendState.fetchPendingRequests.mockResolvedValue(undefined);
  });

  it('resolves sent request state from the friend store after sending', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.sendRequest.mockImplementationOnce(async () => {
      friendState.sentRequests = [request('sent-1', 'outgoing')];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(friendState.sendRequest).toHaveBeenCalledWith('profileuser');
    expect(setFriendshipStatus).toHaveBeenCalledWith('pending_sent');
  });

  it('refreshes pending requests before accepting when profile loaded first', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.fetchPendingRequests.mockImplementationOnce(async () => {
      friendState.pendingRequests = [request('incoming-1', 'incoming')];
    });
    friendState.acceptRequest.mockImplementationOnce(async () => {
      friendState.pendingRequests = [];
      friendState.friends = [friend()];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleAcceptRequest();
    });

    expect(friendState.fetchPendingRequests).toHaveBeenCalled();
    expect(friendState.acceptRequest).toHaveBeenCalledWith('incoming-1');
    expect(setFriendshipStatus).toHaveBeenCalledWith('friends');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps friend state when declining a stale incoming request after friendship exists', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.pendingRequests = [request('incoming-1', 'incoming')];
    friendState.friends = [friend()];
    friendState.declineRequest.mockImplementationOnce(async () => {
      friendState.pendingRequests = [];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleDeclineRequest();
    });

    expect(friendState.declineRequest).toHaveBeenCalledWith('incoming-1');
    expect(setFriendshipStatus).toHaveBeenCalledWith('friends');
  });

  it('refreshes sent requests before canceling when profile loaded first', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.fetchSentRequests.mockImplementationOnce(async () => {
      friendState.sentRequests = [request('sent-1', 'outgoing')];
    });
    friendState.cancelRequest.mockImplementationOnce(async () => {
      friendState.sentRequests = [];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleCancelRequest();
    });

    expect(friendState.fetchSentRequests).toHaveBeenCalled();
    expect(friendState.cancelRequest).toHaveBeenCalledWith('sent-1');
    expect(friendState.removeFriend).not.toHaveBeenCalled();
    expect(setFriendshipStatus).toHaveBeenCalledWith('none');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('refreshes friends before removing when profile loaded first', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.fetchFriends.mockImplementationOnce(async () => {
      friendState.friends = [friend()];
    });
    friendState.removeFriend.mockImplementationOnce(async () => {
      friendState.friends = [];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleRemoveFriend();
    });

    expect(friendState.fetchFriends).toHaveBeenCalled();
    expect(friendState.removeFriend).toHaveBeenCalledWith('friendship-1');
    expect(setFriendshipStatus).toHaveBeenCalledWith('none');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps blocked as the terminal profile status after block removes normal lists', async () => {
    const setFriendshipStatus = vi.fn();
    friendState.friends = [friend()];
    friendState.pendingRequests = [request('incoming-1', 'incoming')];
    friendState.sentRequests = [request('sent-1', 'outgoing')];
    friendState.blockUser.mockImplementationOnce(async () => {
      friendState.friends = [];
      friendState.pendingRequests = [];
      friendState.sentRequests = [];
    });
    const { result } = renderActions(setFriendshipStatus);

    await act(async () => {
      await result.current.handleBlockUser();
    });

    expect(friendState.blockUser).toHaveBeenCalledWith('profile-user');
    expect(setFriendshipStatus).toHaveBeenCalledWith('blocked');
  });
});
