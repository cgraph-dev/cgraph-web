/**
 * Notification store implementation.
 */
import { createLogger } from '@/lib/logger';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import { isRecord, asString } from '@/lib/api-utils';

const logger = createLogger('NotificationStore');

/** Maximum notifications kept in memory to prevent unbounded growth. */
const MAX_NOTIFICATIONS = 200;

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'mention' | 'forum_reply' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  action?: Record<string, unknown> | null;
  actionUrl?: string | null;
  data: Record<string, unknown>;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;

  // Actions
  fetchNotifications: (cursor?: string | number | null) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearAll: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasMore: true,

      fetchNotifications: async (cursor: string | number | null = null) => {
        set({ isLoading: true });
        const isLegacyPage = typeof cursor === 'number';
        const shouldAppend = isLegacyPage ? cursor > 1 : cursor !== null;
        const result = await apiClient.notifications.list({
          limit: 20,
          ...(isLegacyPage && cursor > 1 ? { page: cursor } : {}),
          ...(!isLegacyPage && cursor ? { cursor } : {}),
        });
        if (!result.ok) {
          logger.warn('Failed to fetch notifications:', result.error.message);
          set({ isLoading: false });
          return;
        }
        // Map apiClient Notification (snake_case, optional fields) -> store Notification (camelCase, required fields)
        const knownTypes: Notification['type'][] = [
          'message',
          'friend_request',
          'group_invite',
          'mention',
          'forum_reply',
          'system',
        ];
        const newNotifications: Notification[] = result.data.filter(isRecord).map((n) => {
          const rawType = asString(n['type']);
          const type: Notification['type'] = knownTypes.find((t) => t === rawType) ?? 'system';
          const sender = isRecord(n['sender'])
            ? {
                id: asString(n['sender']['id']),
                username: asString(n['sender']['username']),
                displayName:
                  typeof n['sender']['display_name'] === 'string'
                    ? n['sender']['display_name']
                    : typeof n['sender']['displayName'] === 'string'
                      ? n['sender']['displayName']
                      : null,
                avatarUrl:
                  typeof n['sender']['avatar_url'] === 'string'
                    ? n['sender']['avatar_url']
                    : typeof n['sender']['avatarUrl'] === 'string'
                      ? n['sender']['avatarUrl']
                      : null,
              }
            : undefined;
          return {
            id: asString(n['id']),
            type,
            title: asString(n['title']),
            body: asString(n['body'] ?? n['message']),
            isRead: Boolean(n['is_read'] ?? n['isRead'] ?? n['read'] ?? false),
            action: isRecord(n['action']) ? n['action'] : null,
            actionUrl:
              typeof n['action_url'] === 'string'
                ? n['action_url']
                : typeof n['actionUrl'] === 'string'
                  ? n['actionUrl']
                  : null,
            data: isRecord(n['data']) ? n['data'] : {},
            sender,
            createdAt: asString(n['created_at'] ?? n['createdAt']),
          };
        });
        // Derive pagination from the raw array length (cursor support via store state)
        const hasMore = newNotifications.length === 20;
        const calculatedUnreadCount = newNotifications.filter((n) => !n.isRead).length;

        set((state) => {
          const merged = shouldAppend
            ? [...state.notifications, ...newNotifications]
            : newNotifications;
          return {
            notifications: merged.slice(0, MAX_NOTIFICATIONS),
            unreadCount: calculatedUnreadCount,
            hasMore,
            isLoading: false,
          };
        });
      },

      markAsRead: async (notificationId: string) => {
        const result = await apiClient.notifications.markAsRead(notificationId);
        if (!result.ok) {
          logger.warn('Failed to mark notification as read:', result.error.message);
          return;
        }
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: async () => {
        const result = await apiClient.notifications.markAllAsRead();
        if (!result.ok) {
          logger.warn('Failed to mark all notifications as read:', result.error.message);
          return;
        }
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: async (notificationId: string) => {
        const result = await apiClient.notifications.delete(notificationId);
        if (!result.ok) {
          logger.warn('Failed to delete notification:', result.error.message);
          return;
        }
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount:
              notification && !notification.isRead
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      },

      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
          unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        }));
      },

      clearAll: async () => {
        const result = await apiClient.notifications.deleteAll();
        if (!result.ok) {
          logger.warn('Failed to clear all notifications:', result.error.message);
          return;
        }
        set({ notifications: [], unreadCount: 0 });
      },

      reset: () =>
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          hasMore: true,
        }),
    }),
    {
      name: 'NotificationStore',
      enabled: import.meta.env.DEV,
    }
  )
);
