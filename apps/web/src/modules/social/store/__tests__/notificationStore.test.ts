/**
 * Notification store contract tests.
 *
 * The store is the sole browser projection of the notification API. These cases
 * preserve server-owned unread totals across first-page refreshes and realtime
 * updates, including duplicate delivery and dismissal events.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationApi = vi.hoisted(() => ({
  list: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  delete: vi.fn(),
  deleteAll: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    notifications: notificationApi,
  },
}));

import { clearRateLimitScopes, USER_API_RATE_LIMIT_SCOPE } from '@/lib/api-rate-limit';
import { useNotificationStore, type Notification } from '../notificationStore.impl';

const NOTIFICATION_RATE_LIMIT_SCOPE = 'notifications:read';

function ok<T>(data: T) {
  return { ok: true as const, data };
}

function failure(message = 'request failed') {
  return {
    ok: false as const,
    error: { code: 'request_failed', message },
    status: 500,
  };
}

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notification-1',
    type: 'friend_request',
    title: 'New friend request',
    body: 'alice wants to be your friend',
    isRead: false,
    data: { sender_id: 'alice-id' },
    sender: {
      id: 'alice-id',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
    },
    createdAt: '2026-07-20T10:00:00Z',
    ...overrides,
  };
}

const first = notification();
const second = notification({ id: 'notification-2', type: 'message', title: 'New message' });
const read = notification({ id: 'notification-3', isRead: true });

function notificationResponse(item: Notification): Record<string, unknown> {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    is_read: item.isRead,
    action: item.action ?? null,
    action_url: item.actionUrl ?? null,
    data: item.data,
    actor: item.sender
      ? {
          id: item.sender.id,
          username: item.sender.username,
          display_name: item.sender.displayName,
          avatar_url: item.sender.avatarUrl,
        }
      : null,
    created_at: item.createdAt,
  };
}

beforeEach(() => {
  useNotificationStore.getState().reset();
  clearRateLimitScopes([USER_API_RATE_LIMIT_SCOPE, NOTIFICATION_RATE_LIMIT_SCOPE]);
  vi.clearAllMocks();

  notificationApi.list.mockResolvedValue(ok([]));
  notificationApi.getUnreadCount.mockResolvedValue(ok({ count: 0 }));
  notificationApi.markAsRead.mockResolvedValue(ok({ unread_count: 0 }));
  notificationApi.markAllAsRead.mockResolvedValue(ok({ unread_count: 0 }));
  notificationApi.delete.mockResolvedValue(ok({}));
  notificationApi.deleteAll.mockResolvedValue(ok({}));
});

describe('NotificationStore', () => {
  it('starts with an empty server projection', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.hasMore).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('uses the authoritative unread count instead of its first notification page', async () => {
    notificationApi.list.mockResolvedValueOnce(ok([notificationResponse(first)]));
    notificationApi.getUnreadCount.mockResolvedValueOnce(ok({ count: 31 }));

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]).toMatchObject(first);
    expect(state.unreadCount).toBe(31);
    expect(notificationApi.list).toHaveBeenCalledWith({ limit: 20 });
    expect(notificationApi.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('falls back to the loaded rows only when the count endpoint is unavailable', async () => {
    notificationApi.list.mockResolvedValueOnce(
      ok([notificationResponse(first), notificationResponse(read)])
    );
    notificationApi.getUnreadCount.mockResolvedValueOnce(failure());

    await useNotificationStore.getState().fetchNotifications();

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('does not fetch another global count while appending a cursor page', async () => {
    useNotificationStore.setState({ notifications: [first], unreadCount: 17 });
    notificationApi.list.mockResolvedValueOnce(ok([notificationResponse(second)]));

    await useNotificationStore.getState().fetchNotifications('next-page');

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[0]).toMatchObject(first);
    expect(state.notifications[1]).toMatchObject(second);
    expect(state.unreadCount).toBe(17);
    expect(notificationApi.list).toHaveBeenCalledWith({ limit: 20, cursor: 'next-page' });
    expect(notificationApi.getUnreadCount).not.toHaveBeenCalled();
  });

  it('coalesces overlapping root refreshes into one list and one count request', async () => {
    let resolveList: ((value: ReturnType<typeof ok<Notification[]>>) => void) | undefined;
    notificationApi.list.mockImplementationOnce(
      () => new Promise((resolve) => (resolveList = resolve))
    );
    notificationApi.getUnreadCount.mockResolvedValueOnce(ok({ count: 4 }));

    const firstFetch = useNotificationStore.getState().fetchNotifications();
    const secondFetch = useNotificationStore.getState().fetchNotifications();
    resolveList?.(ok([notificationResponse(first)]));

    await Promise.all([firstFetch, secondFetch]);

    expect(notificationApi.list).toHaveBeenCalledTimes(1);
    expect(notificationApi.getUnreadCount).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('keeps the server count when an unread notification is marked read', async () => {
    useNotificationStore.setState({ notifications: [first, second], unreadCount: 22 });
    notificationApi.markAsRead.mockResolvedValueOnce(ok({ unread_count: 21 }));

    await useNotificationStore.getState().markAsRead(first.id);

    const state = useNotificationStore.getState();
    expect(state.notifications[0]?.isRead).toBe(true);
    expect(state.unreadCount).toBe(21);
    expect(notificationApi.markAsRead).toHaveBeenCalledWith(first.id);
  });

  it('does not decrement a count twice for an already-read notification without a server total', async () => {
    useNotificationStore.setState({ notifications: [read], unreadCount: 9 });
    notificationApi.markAsRead.mockResolvedValueOnce(ok({}));

    await useNotificationStore.getState().markAsRead(read.id);

    expect(useNotificationStore.getState().unreadCount).toBe(9);
  });

  it('uses the server total after mark-all rather than assuming zero', async () => {
    useNotificationStore.setState({ notifications: [first, second], unreadCount: 12 });
    notificationApi.markAllAsRead.mockResolvedValueOnce(ok({ unread_count: 3 }));

    await useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every((item) => item.isRead)).toBe(true);
    expect(state.unreadCount).toBe(3);
    expect(notificationApi.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('does not double-count a duplicated realtime notification and accepts its newer server total', () => {
    useNotificationStore.setState({ notifications: [first], unreadCount: 2 });

    useNotificationStore.getState().addNotification(first, 5);

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([first]);
    expect(state.unreadCount).toBe(5);
  });

  it('removes dismissed notifications without replacing a server-provided unread total', () => {
    useNotificationStore.setState({ notifications: [first, second], unreadCount: 8 });

    useNotificationStore.getState().removeNotifications([first.id], 6);

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([second]);
    expect(state.unreadCount).toBe(6);
  });

  it('uses the same sender identity to remove a cancelled friend request locally', () => {
    useNotificationStore.setState({ notifications: [first, second], unreadCount: 2 });

    useNotificationStore.getState().dismissFriendRequestNotificationsFromUser('alice-id');

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([second]);
    expect(state.unreadCount).toBe(1);
  });

  it('keeps the previous projection when the root list request fails', async () => {
    useNotificationStore.setState({ notifications: [first], unreadCount: 7 });
    notificationApi.list.mockResolvedValueOnce(failure());

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([first]);
    expect(state.unreadCount).toBe(7);
    expect(state.isLoading).toBe(false);
  });
});
