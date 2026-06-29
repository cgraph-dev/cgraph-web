/**
 * Notification Store Unit Tests
 *
 * Comprehensive tests for the Zustand notification store.
 * Covers initial state, fetch with pagination, mark as read,
 * mark all as read, delete, add, clearAll, and error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
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
  extractPagination: (data: unknown) => {
    if (data === null || typeof data !== 'object') return { hasMore: false };
    const metaVal = Object.entries(data).find(([k]) => k === 'meta')?.[1];
    if (metaVal === null || typeof metaVal !== 'object') return { hasMore: false };
    const hasMore = Object.entries(metaVal).find(([k]) => k === 'has_more')?.[1];
    return { hasMore: hasMore === true };
  },
}));

import { api } from '@/lib/api-client';
import { clearRateLimitScopes, USER_API_RATE_LIMIT_SCOPE } from '@/lib/api-rate-limit';
import { useNotificationStore, type Notification } from '../notificationStore.impl';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

const mkNotif = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  type: 'message',
  title: 'New Message',
  body: 'You have a new message',
  isRead: false,
  data: {},
  sender: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
  },
  createdAt: '2025-06-01T12:00:00Z',
  ...overrides,
});

const notif1 = mkNotif();
const notif2 = mkNotif({ id: 'notif-2', type: 'friend_request', title: 'Friend Request' });
const notifRead = mkNotif({ id: 'notif-3', isRead: true });

const getInitialState = () => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
});

beforeEach(() => {
  useNotificationStore.getState().reset();
  useNotificationStore.setState(getInitialState());
  clearRateLimitScopes([USER_API_RATE_LIMIT_SCOPE, 'notifications:read']);
  vi.clearAllMocks();
});

describe('NotificationStore', () => {
  describe('Initial state', () => {
    it('starts with empty notifications', () => {
      expect(useNotificationStore.getState().notifications).toEqual([]);
    });

    it('starts with unreadCount 0', () => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('starts not loading', () => {
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('starts with hasMore true', () => {
      expect(useNotificationStore.getState().hasMore).toBe(true);
    });
  });

  describe('fetchNotifications', () => {
    it('sets isLoading during fetch', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {}));
      useNotificationStore.getState().fetchNotifications();
      await vi.waitFor(() => expect(useNotificationStore.getState().isLoading).toBe(true));
    });

    it('replaces notifications on first fetch (no cursor)', async () => {
      useNotificationStore.setState({ notifications: [notifRead] });
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif1, notif2] },
      });

      await useNotificationStore.getState().fetchNotifications(null);

      const s = useNotificationStore.getState();
      expect(s.notifications).toHaveLength(2);
      expect(s.isLoading).toBe(false);
    });

    it('appends when cursor is provided', async () => {
      useNotificationStore.setState({ notifications: [notif1] });
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif2] },
      });

      await useNotificationStore.getState().fetchNotifications('cursor-abc');

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
    });

    it('passes cursor and limit params', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } });

      await useNotificationStore.getState().fetchNotifications('cursor-xyz');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { cursor: 'cursor-xyz', limit: 20 },
      });
    });

    it('defaults to no cursor (first page)', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } });
      await useNotificationStore.getState().fetchNotifications();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { limit: 20 },
      });
    });

    it('coalesces concurrent first-page fetches', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } });

      const first = useNotificationStore.getState().fetchNotifications();
      const second = useNotificationStore.getState().fetchNotifications();
      await Promise.all([first, second]);

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { limit: 20 },
      });
    });

    it('skips immediate duplicate first-page refreshes after success', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } });

      await useNotificationStore.getState().fetchNotifications();
      await useNotificationStore.getState().fetchNotifications();

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
    });

    it('resets isLoading on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('network'));
      await useNotificationStore.getState().fetchNotifications();
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('pauses background notification fetches after a rate-limit response', async () => {
      mockedApi.get.mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please wait 20 seconds before retrying.',
              details: { retry_after_seconds: 20 },
            },
          },
        },
      });

      await useNotificationStore.getState().fetchNotifications();
      await useNotificationStore.getState().fetchNotifications();

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('calculates unreadCount from notifications', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif1, notif2, { ...notifRead, is_read: true }] },
      });

      await useNotificationStore.getState().fetchNotifications(null);

      // 2 unread (notif1, notif2), 1 read
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('notif-1');

      const s = useNotificationStore.getState();
      expect(s.notifications[0]!.isRead).toBe(true);
      expect(s.notifications[1]!.isRead).toBe(false);
      expect(s.unreadCount).toBe(1);
    });

    it('calls correct API endpoint', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 1 });
      mockedApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('notif-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read');
    });

    it('does not go below 0 unread', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 0 });
      mockedApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('notif-1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAllAsRead();

      const s = useNotificationStore.getState();
      expect(s.notifications.every((n) => n.isRead)).toBe(true);
      expect(s.unreadCount).toBe(0);
    });

    it('calls bulk read endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({});
      await useNotificationStore.getState().markAllAsRead();
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/notifications/read-all');
    });
  });

  describe('deleteNotification', () => {
    it('removes notification from list', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('notif-1');

      const s = useNotificationStore.getState();
      expect(s.notifications).toHaveLength(1);
      expect(s.notifications[0]!.id).toBe('notif-2');
    });

    it('decrements unreadCount for unread notification', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 1 });
      mockedApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('notif-1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('does not decrement unreadCount for read notification', async () => {
      useNotificationStore.setState({ notifications: [notifRead], unreadCount: 0 });
      mockedApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('notif-3');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('calls correct API endpoint', async () => {
      useNotificationStore.setState({ notifications: [notif1] });
      mockedApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('notif-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/notifications/notif-1');
    });
  });

  describe('addNotification', () => {
    it('prepends notification to list', () => {
      useNotificationStore.setState({ notifications: [notif2], unreadCount: 1 });

      useNotificationStore.getState().addNotification(notif1);

      const s = useNotificationStore.getState();
      expect(s.notifications[0]!.id).toBe('notif-1');
      expect(s.notifications).toHaveLength(2);
    });

    it('increments unreadCount for unread notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
      useNotificationStore.getState().addNotification(notif1);
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('does not increment unreadCount for read notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
      useNotificationStore.getState().addNotification(notifRead);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('removes all notifications', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().clearAll();

      const s = useNotificationStore.getState();
      expect(s.notifications).toEqual([]);
      expect(s.unreadCount).toBe(0);
    });

    it('calls bulk delete endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({});
      await useNotificationStore.getState().clearAll();
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/notifications');
    });
  });
});
