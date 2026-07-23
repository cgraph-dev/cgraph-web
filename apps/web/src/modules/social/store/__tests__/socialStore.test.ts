import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useFriendStore } from '../friendStore.impl';
import { useNotificationStore } from '../notificationStore.impl';
import { clearRateLimitScopes } from '@/lib/api-rate-limit';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock('@cgraph-dev/utils', () => ({ createIdempotencyKey: () => 'idem-1' }));
vi.mock('@/lib/apiUtils', () => ({
  ensureArray: (_d: unknown, key: string) => {
    if (Array.isArray(_d)) return _d;
    if (_d && typeof _d === 'object') {
      const val = (Object.entries(_d).find(([k]) => k === key) ?? [])[1];
      if (Array.isArray(val)) return val;
    }
    return [];
  },
  extractErrorMessage: (_e: unknown, fallback: string) =>
    _e instanceof Error ? _e.message : fallback,
  extractPagination: () => ({ hasMore: false }),
}));
vi.mock('../friend-normalizers', () => ({
  normalizeFriend: (d: Record<string, unknown>) => d,
  normalizeRequest: (d: Record<string, unknown>, type: string) => ({ ...d, type }),
}));

import { api } from '@/lib/api-client';
const mockApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

const makeFriend = (overrides = {}) => ({
  id: 'f-1',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: null,
  status: 'online' as const,
  statusMessage: null,
  friendshipId: 'fs-1',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeRequest = (overrides = {}) => ({
  id: 'req-1',
  user: { id: 'u-2', username: 'bob', displayName: 'Bob', avatarUrl: null },
  createdAt: '2026-01-01T00:00:00Z',
  type: 'incoming' as const,
  ...overrides,
});

const makeNotification = (overrides = {}) => ({
  id: 'n-1',
  type: 'message' as const,
  title: 'New message',
  body: 'Hey!',
  isRead: false,
  data: {},
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  useFriendStore.getState().reset();
  useNotificationStore.getState().reset();
  clearRateLimitScopes([
    'friends:read',
    'friends:write',
    'notifications:read',
  ]);
  useFriendStore.setState({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
  });
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
  });
  vi.clearAllMocks();
});

// FRIEND STORE

describe('fetchFriends', () => {
  it('fetches and stores friends list', async () => {
    const friends = [makeFriend()];
    mockApi.get.mockResolvedValueOnce({ data: { data: friends } });
    await useFriendStore.getState().fetchFriends();
    expect(useFriendStore.getState().friends).toEqual([
      expect.objectContaining({ id: 'f-1', username: 'alice', status: 'online' }),
    ]);
    expect(useFriendStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('network'));
    await useFriendStore.getState().fetchFriends();
    expect(useFriendStore.getState().error).toBe('network');
    expect(useFriendStore.getState().isLoading).toBe(false);
  });
});

describe('fetchPendingRequests', () => {
  it('fetches and stores incoming requests', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [makeRequest()] } });
    await useFriendStore.getState().fetchPendingRequests();
    expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
  });

  it('sets error on failure', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await useFriendStore.getState().fetchPendingRequests();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('fetchSentRequests', () => {
  it('fetches and stores outgoing requests', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [makeRequest({ type: 'outgoing' })] } });
    await useFriendStore.getState().fetchSentRequests();
    expect(useFriendStore.getState().sentRequests).toHaveLength(1);
  });

  it('sets error on failure', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await useFriendStore.getState().fetchSentRequests();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('sendRequest', () => {
  it('sends by username', async () => {
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().sendRequest('alice');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/friends',
      expect.objectContaining({ username: 'alice' }),
      expect.any(Object)
    );
  });

  it('sends by email', async () => {
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().sendRequest('alice@example.com');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/friends',
      expect.objectContaining({ email: 'alice@example.com' }),
      expect.any(Object)
    );
  });

  it('sends by UUID', async () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().sendRequest(uuid);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/friends',
      expect.objectContaining({ user_id: uuid }),
      expect.any(Object)
    );
  });

  it('sends by UID (numeric)', async () => {
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().sendRequest('#12345');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/friends',
      expect.objectContaining({ uid: '12345' }),
      expect.any(Object)
    );
  });

  it('does not require a sent-requests refresh on success', async () => {
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().sendRequest('alice');
    expect(mockApi.get).not.toHaveBeenCalledWith('/api/v1/friends/sent');
  });

  it('sets error and rethrows on failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('already sent'));
    await expect(useFriendStore.getState().sendRequest('alice')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
    expect(useFriendStore.getState().isLoading).toBe(false);
  });
});

describe('acceptRequest', () => {
  it('accepts and refreshes friends + pending', async () => {
    mockApi.post.mockResolvedValueOnce({});
    mockApi.get.mockResolvedValueOnce({ data: { data: [makeFriend()] } });
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useFriendStore.getState().acceptRequest('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/accept');
    expect(useFriendStore.getState().isLoading).toBe(false);
  });

  it('removes the matching friend request notification after accept', async () => {
    useFriendStore.setState({
      pendingRequests: [
        makeRequest({
          id: 'req-1',
          user: { id: 'u-2', username: 'bob', displayName: 'Bob', avatarUrl: null },
        }),
      ],
    });
    useNotificationStore.setState({
      notifications: [
        makeNotification({
          id: 'n-request',
          type: 'friend_request',
          data: { sender_id: 'u-2' },
        }),
        makeNotification({
          id: 'n-keep',
          type: 'friend_request',
          data: { sender_id: 'u-3' },
        }),
      ],
      unreadCount: 2,
    });
    mockApi.post.mockResolvedValueOnce({});
    mockApi.get.mockResolvedValueOnce({ data: { data: [makeFriend()] } });
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });

    await useFriendStore.getState().acceptRequest('req-1');

    expect(useNotificationStore.getState().notifications.map((n) => n.id)).toEqual(['n-keep']);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('sets error on failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('expired'));
    await expect(useFriendStore.getState().acceptRequest('req-1')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('declineRequest', () => {
  it('declines and refreshes pending', async () => {
    mockApi.post.mockResolvedValueOnce({});
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useFriendStore.getState().declineRequest('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/decline');
  });

  it('removes the matching friend request notification after decline', async () => {
    useFriendStore.setState({
      pendingRequests: [
        makeRequest({
          id: 'req-1',
          user: { id: 'u-2', username: 'bob', displayName: 'Bob', avatarUrl: null },
        }),
      ],
    });
    useNotificationStore.setState({
      notifications: [
        makeNotification({
          id: 'n-request',
          type: 'friend_request',
          data: { sender_id: 'u-2' },
        }),
      ],
      unreadCount: 1,
    });
    mockApi.post.mockResolvedValueOnce({});
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });

    await useFriendStore.getState().declineRequest('req-1');

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('sets error on failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    await expect(useFriendStore.getState().declineRequest('req-1')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('cancelRequest', () => {
  it('cancels only the matching outgoing request', async () => {
    useFriendStore.setState({
      sentRequests: [
        makeRequest({ id: 'sent-1', type: 'outgoing' }),
        makeRequest({ id: 'sent-2', type: 'outgoing' }),
      ],
    });
    mockApi.delete.mockResolvedValueOnce({});

    await useFriendStore.getState().cancelRequest('sent-1');

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/friends/sent-1');
    expect(useFriendStore.getState().sentRequests.map((request) => request.id)).toEqual(['sent-2']);
  });

  it('keeps outgoing state when cancellation fails', async () => {
    useFriendStore.setState({
      sentRequests: [makeRequest({ id: 'sent-1', type: 'outgoing' })],
    });
    mockApi.delete.mockRejectedValueOnce(new Error('cancel failed'));

    await expect(useFriendStore.getState().cancelRequest('sent-1')).rejects.toThrow('cancel failed');

    expect(useFriendStore.getState().sentRequests).toHaveLength(1);
    expect(useFriendStore.getState().error).toBe('cancel failed');
  });
});

describe('removeFriend', () => {
  it('removes friend from list optimistically', async () => {
    useFriendStore.setState({ friends: [makeFriend()] });
    mockApi.delete.mockResolvedValueOnce({});
    await useFriendStore.getState().removeFriend('fs-1');
    expect(useFriendStore.getState().friends).toHaveLength(0);
  });

  it('sets error on failure', async () => {
    mockApi.delete.mockRejectedValueOnce(new Error('fail'));
    await expect(useFriendStore.getState().removeFriend('fs-1')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('blockUser', () => {
  it('blocks user and removes them from every normal contact/request list', async () => {
    useFriendStore.setState({
      friends: [makeFriend({ id: 'target' })],
      pendingRequests: [
        makeRequest({ user: { id: 'target', username: 'x', displayName: null, avatarUrl: null } }),
      ],
      sentRequests: [
        makeRequest({
          id: 'sent-target',
          type: 'outgoing',
          user: { id: 'target', username: 'x', displayName: null, avatarUrl: null },
        }),
      ],
    });
    mockApi.post.mockResolvedValueOnce({});
    await useFriendStore.getState().blockUser('target');
    expect(useFriendStore.getState().friends).toHaveLength(0);
    expect(useFriendStore.getState().pendingRequests).toHaveLength(0);
    expect(useFriendStore.getState().sentRequests).toHaveLength(0);
  });

  it('sets error on failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    await expect(useFriendStore.getState().blockUser('u-1')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('unblockUser', () => {
  it('calls unblock API', async () => {
    mockApi.delete.mockResolvedValueOnce({});
    await useFriendStore.getState().unblockUser('u-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/friends/u-1/block');
    expect(useFriendStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockApi.delete.mockRejectedValueOnce(new Error('fail'));
    await expect(useFriendStore.getState().unblockUser('u-1')).rejects.toThrow();
    expect(useFriendStore.getState().error).toBeTruthy();
  });
});

describe('clearError', () => {
  it('resets error to null', () => {
    useFriendStore.setState({ error: 'something bad' });
    useFriendStore.getState().clearError();
    expect(useFriendStore.getState().error).toBeNull();
  });
});

// NOTIFICATION STORE

describe('fetchNotifications', () => {
  it('fetches first page (no cursor) and replaces list', async () => {
    const notifs = [makeNotification()];
    mockApi.get.mockResolvedValueOnce({ data: { notifications: notifs } });
    await useNotificationStore.getState().fetchNotifications(null);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('preserves backend friend accepted notifications and action metadata', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        notifications: [
          makeNotification({
            id: 'n-accepted',
            type: 'friend_accepted',
            title: 'Friend request accepted',
            action: {
              type: 'navigate',
              screen: 'profile',
              params: { user_id: 'u-2' },
            },
            data: { accepter_id: 'u-2' },
          }),
        ],
      },
    });

    await useNotificationStore.getState().fetchNotifications(null);

    expect(useNotificationStore.getState().notifications[0]).toMatchObject({
      id: 'n-accepted',
      type: 'friend_accepted',
      action: {
        screen: 'profile',
        params: { user_id: 'u-2' },
      },
      data: { accepter_id: 'u-2' },
    });
  });

  it('appends when cursor is provided', async () => {
    useNotificationStore.setState({ notifications: [makeNotification({ id: 'n-0' })] });
    mockApi.get.mockResolvedValueOnce({
      data: { notifications: [makeNotification({ id: 'n-2' })] },
    });
    await useNotificationStore.getState().fetchNotifications('cursor-abc');
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
  });

  it('sets loading false on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await useNotificationStore.getState().fetchNotifications();
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });
});

describe('markAsRead', () => {
  it('marks single notification as read and decrements count', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification()],
      unreadCount: 3,
    });
    mockApi.post.mockResolvedValueOnce({});
    await useNotificationStore.getState().markAsRead('n-1');
    expect(useNotificationStore.getState().notifications[0]!.isRead).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });
});

describe('markAllAsRead', () => {
  it('marks all as read and resets count to 0', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ id: 'a' }), makeNotification({ id: 'b' })],
      unreadCount: 2,
    });
    mockApi.post.mockResolvedValueOnce({});
    await useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications.every((n) => n.isRead)).toBe(true);
  });
});

describe('deleteNotification', () => {
  it('removes notification and adjusts unread count for unread item', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ isRead: false })],
      unreadCount: 1,
    });
    mockApi.delete.mockResolvedValueOnce({});
    await useNotificationStore.getState().deleteNotification('n-1');
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('does not decrement unread count for already-read item', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ isRead: true })],
      unreadCount: 0,
    });
    mockApi.delete.mockResolvedValueOnce({});
    await useNotificationStore.getState().deleteNotification('n-1');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});

describe('addNotification', () => {
  it('prepends notification and increments unread', () => {
    useNotificationStore.getState().addNotification(makeNotification());
    expect(useNotificationStore.getState().notifications[0]!.id).toBe('n-1');
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('does not increment unread for already-read notification', () => {
    useNotificationStore.getState().addNotification(makeNotification({ isRead: true }));
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('dismisses only friend-request notifications from the matching sender', () => {
    useNotificationStore.setState({
      notifications: [
        makeNotification({
          id: 'n-request',
          type: 'friend_request',
          data: { sender_id: 'u-2' },
        }),
        makeNotification({
          id: 'n-other-request',
          type: 'friend_request',
          data: { sender_id: 'u-3' },
        }),
        makeNotification({
          id: 'n-message',
          type: 'message',
          data: { sender_id: 'u-2' },
        }),
      ],
      unreadCount: 3,
    });

    useNotificationStore.getState().dismissFriendRequestNotificationsFromUser('u-2');

    expect(useNotificationStore.getState().notifications.map((n) => n.id)).toEqual([
      'n-other-request',
      'n-message',
    ]);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });
});

describe('clearAll', () => {
  it('deletes all and resets state', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification()],
      unreadCount: 5,
    });
    mockApi.delete.mockResolvedValueOnce({});
    await useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
