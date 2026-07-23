/**
 * Friend Store Unit Tests
 *
 * Comprehensive tests for the Zustand friend store.
 * Covers initial state, fetch friends, pending/sent requests,
 * send/accept/decline, remove, block/unblock, error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@cgraph-dev/utils', () => ({
  createIdempotencyKey: () => 'idem-key-123',
}));

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: (_data: unknown, key: string) => {
    if (Array.isArray(_data)) return _data;
    if (_data && typeof _data === 'object') {
      const entry = Object.entries(_data).find(([k]) => k === key);
      if (entry) return entry[1];
    }
    return [];
  },
  extractErrorMessage: (_err: unknown, fallback: string) => {
    if (_err instanceof Error) return _err.message;
    return fallback;
  },
}));

import { api } from '@/lib/api-client';
import { clearRateLimitScopes } from '@/lib/api-rate-limit';
import { useFriendStore } from '../friendStore.impl';
import type { Friend, FriendRequest } from '../friend-types';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

const mockFriend: Friend = {
  id: 'friend-1',
  username: 'bob',
  displayName: 'Bob',
  avatarUrl: null,
  status: 'online',
  statusMessage: null,
  friendshipId: 'fs-1',
  createdAt: '2025-01-01T00:00:00Z',
};

const mockFriend2: Friend = {
  ...mockFriend,
  id: 'friend-2',
  username: 'carol',
  displayName: 'Carol',
  friendshipId: 'fs-2',
};

const mockRequest: FriendRequest = {
  id: 'req-1',
  user: { id: 'user-3', username: 'dave', displayName: 'Dave', avatarUrl: null },
  createdAt: '2025-06-01T00:00:00Z',
  type: 'incoming',
};

const getInitialState = () => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,
});

beforeEach(() => {
  useFriendStore.getState().reset();
  useFriendStore.setState(getInitialState());
  clearRateLimitScopes(['friends:read', 'friends:write']);
  vi.clearAllMocks();
});

describe('FriendStore', () => {
  describe('Initial state', () => {
    it('starts with empty friends', () => {
      expect(useFriendStore.getState().friends).toEqual([]);
    });

    it('starts with empty pendingRequests', () => {
      expect(useFriendStore.getState().pendingRequests).toEqual([]);
    });

    it('starts with empty sentRequests', () => {
      expect(useFriendStore.getState().sentRequests).toEqual([]);
    });

    it('starts not loading', () => {
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('starts with null error', () => {
      expect(useFriendStore.getState().error).toBeNull();
    });
  });

  describe('fetchFriends', () => {
    it('sets isLoading during fetch', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {}));
      useFriendStore.getState().fetchFriends();
      await vi.waitFor(() => expect(useFriendStore.getState().isLoading).toBe(true));
    });

    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
      await useFriendStore.getState().fetchFriends();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends');
    });

    it('coalesces concurrent friend list reads', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

      const first = useFriendStore.getState().fetchFriends();
      const second = useFriendStore.getState().fetchFriends();
      await Promise.all([first, second]);

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends');
    });

    it('refetches completed friend reads so cross-user accepts are visible', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [mockFriend] } });

      await useFriendStore.getState().fetchFriends();
      await useFriendStore.getState().fetchFriends();

      expect(mockedApi.get).toHaveBeenCalledTimes(2);
      expect(useFriendStore.getState().friends).toEqual([
        expect.objectContaining({ id: 'friend-1', username: 'bob' }),
      ]);
    });

    it('sets isLoading false on success', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
      await useFriendStore.getState().fetchFriends();
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
      await useFriendStore.getState().fetchFriends();
      expect(useFriendStore.getState().error).toBe('Network error');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchPendingRequests', () => {
    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
      await useFriendStore.getState().fetchPendingRequests();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/requests');
    });

    it('refetches completed pending request reads', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [mockRequest] } });

      await useFriendStore.getState().fetchPendingRequests();
      await useFriendStore.getState().fetchPendingRequests();

      expect(mockedApi.get).toHaveBeenCalledTimes(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/requests');
      expect(useFriendStore.getState().pendingRequests).toEqual([
        expect.objectContaining({ id: 'req-1', type: 'incoming' }),
      ]);
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await useFriendStore.getState().fetchPendingRequests();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('fetchSentRequests', () => {
    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
      await useFriendStore.getState().fetchSentRequests();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/sent');
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await useFriendStore.getState().fetchSentRequests();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('sendRequest', () => {
    it('sends with username payload for plain text', async () => {
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().sendRequest('alice');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { username: 'alice' },
        expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-key-123' } })
      );
    });

    it('sends with user_id payload for UUID', async () => {
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().sendRequest('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        expect.any(Object)
      );
    });

    it('sends with email payload for email format', async () => {
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().sendRequest('alice@example.com');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { email: 'alice@example.com' },
        expect.any(Object)
      );
    });

    it('sends with uid payload for numeric UID', async () => {
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().sendRequest('#1234567890');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { uid: '1234567890' },
        expect.any(Object)
      );
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Already friends'));

      await expect(useFriendStore.getState().sendRequest('bob')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('Already friends');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('does not require a sent-requests refresh for a successful send', async () => {
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().sendRequest('alice');

      expect(mockedApi.get).not.toHaveBeenCalledWith('/api/v1/friends/sent');
      expect(useFriendStore.getState().isLoading).toBe(false);
      expect(useFriendStore.getState().error).toBeNull();
    });

    it('adds the outgoing request from the send response when available', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'req-out-1',
            to: {
              id: 'user-alice',
              username: 'alice',
              display_name: 'Alice',
              avatar_url: null,
            },
            created_at: '2026-06-01T00:00:00Z',
          },
        },
      });

      await useFriendStore.getState().sendRequest('alice');

      expect(useFriendStore.getState().sentRequests).toEqual([
        expect.objectContaining({
          id: 'req-out-1',
          type: 'outgoing',
          user: expect.objectContaining({ id: 'user-alice', username: 'alice' }),
        }),
      ]);
      expect(mockedApi.get).not.toHaveBeenCalled();
    });

    it('refreshes sent requests when the backend returns a friendship record without recipient data', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'req-out-1',
            user_id: 'me',
            friend_id: 'user-alice',
            status: 'pending',
            created_at: '2026-06-01T00:00:00Z',
          },
        },
      });
      mockedApi.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'req-out-1',
              to: {
                id: 'user-alice',
                username: 'alice',
                display_name: 'Alice',
                avatar_url: null,
              },
              sent_at: '2026-06-01T00:00:00Z',
            },
          ],
        },
      });

      await useFriendStore.getState().sendRequest('alice');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/sent');
      expect(useFriendStore.getState().sentRequests).toEqual([
        expect.objectContaining({
          id: 'req-out-1',
          type: 'outgoing',
          user: expect.objectContaining({ id: 'user-alice', username: 'alice' }),
        }),
      ]);
    });

    it('pauses duplicate sends after a rate-limit response', async () => {
      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please wait 18 seconds before retrying.',
              details: { retry_after_seconds: 18 },
            },
          },
        },
      });

      await expect(useFriendStore.getState().sendRequest('alice')).rejects.toThrow(
        'Too many requests'
      );
      await expect(useFriendStore.getState().sendRequest('alice')).rejects.toThrow(
        'Too many requests'
      );

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('acceptRequest', () => {
    it('calls accept endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({});
      // fetchFriends + fetchPendingRequests
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      await useFriendStore.getState().acceptRequest('req-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/accept');
    });

    it('refreshes friends and pending lists', async () => {
      mockedApi.post.mockResolvedValueOnce({});
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      await useFriendStore.getState().acceptRequest('req-1');

      const getCalls = mockedApi.get.mock.calls.map((c: unknown[]) => c[0]);
      expect(getCalls).toContain('/api/v1/friends');
      expect(getCalls).toContain('/api/v1/friends/requests');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('expired'));

      await expect(useFriendStore.getState().acceptRequest('req-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('expired');
    });
  });

  describe('declineRequest', () => {
    it('calls decline endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({});
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

      await useFriendStore.getState().declineRequest('req-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/decline');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().declineRequest('req-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('removeFriend', () => {
    it('removes friend from list optimistically', async () => {
      useFriendStore.setState({ friends: [mockFriend, mockFriend2] });
      mockedApi.delete.mockResolvedValueOnce({});

      await useFriendStore.getState().removeFriend('fs-1');

      const s = useFriendStore.getState();
      expect(s.friends).toHaveLength(1);
      expect(s.friends[0]!.id).toBe('friend-2');
    });

    it('calls correct endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({});
      await useFriendStore.getState().removeFriend('fs-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/friends/fs-1');
    });

    it('sets error on failure', async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().removeFriend('fs-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('blockUser', () => {
    it('removes user from friends and pending lists', async () => {
      useFriendStore.setState({
        friends: [mockFriend],
        pendingRequests: [{ ...mockRequest, user: { ...mockRequest.user, id: 'friend-1' } }],
      });
      mockedApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().blockUser('friend-1');

      const s = useFriendStore.getState();
      expect(s.friends).toHaveLength(0);
      expect(s.pendingRequests).toHaveLength(0);
    });

    it('calls block endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({});
      await useFriendStore.getState().blockUser('user-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/user-1/block');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().blockUser('user-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('unblockUser', () => {
    it('calls unblock endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({});
      await useFriendStore.getState().unblockUser('user-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/friends/user-1/block');
    });

    it('sets isLoading false on success', async () => {
      mockedApi.delete.mockResolvedValueOnce({});
      await useFriendStore.getState().unblockUser('user-1');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().unblockUser('user-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  describe('clearError', () => {
    it('resets error to null', () => {
      useFriendStore.setState({ error: 'some error' });
      useFriendStore.getState().clearError();
      expect(useFriendStore.getState().error).toBeNull();
    });
  });

  describe('applyIdentityPatch', () => {
    it('updates friends and request users through one store owner', () => {
      useFriendStore.setState({
        friends: [mockFriend],
        pendingRequests: [mockRequest],
        sentRequests: [
          {
            ...mockRequest,
            id: 'req-2',
            user: { ...mockRequest.user, id: mockFriend.id },
            type: 'outgoing',
          },
        ],
      });

      useFriendStore.getState().applyIdentityPatch(mockFriend.id, {
        avatarBorderId: 'border-gold',
        avatar_border_id: 'border-gold',
        equippedTitleId: 'title-founder',
        equippedBadgeIds: ['badge-1'],
      });

      expect(useFriendStore.getState().friends[0]).toMatchObject({
        avatarBorderId: 'border-gold',
        equippedTitleId: 'title-founder',
        equippedBadgeIds: ['badge-1'],
      });
      expect(useFriendStore.getState().sentRequests[0].user).toMatchObject({
        avatarBorderId: 'border-gold',
        equippedTitleId: 'title-founder',
        equippedBadgeIds: ['badge-1'],
      });
      expect(useFriendStore.getState().pendingRequests[0].user.avatarBorderId).toBeUndefined();
    });
  });
});
