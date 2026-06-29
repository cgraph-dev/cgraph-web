/**
 * Notification store implementation.
 */
import { createLogger } from '@/lib/logger';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import { isRecord, asString } from '@/lib/api-utils';
import {
  getMaxRateLimitRemainingMs,
  rememberRateLimit,
  USER_API_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';

const logger = createLogger('NotificationStore');

/** Maximum notifications kept in memory to prevent unbounded growth. */
const MAX_NOTIFICATIONS = 200;
const NOTIFICATION_RATE_LIMIT_SCOPE = 'notifications:read';
const NOTIFICATION_RATE_LIMIT_SCOPES = [
  USER_API_RATE_LIMIT_SCOPE,
  NOTIFICATION_RATE_LIMIT_SCOPE,
] as const;
const NOTIFICATION_ROOT_FRESH_MS = 20_000;

let notificationRootInFlight: Promise<void> | null = null;
let notificationRootLastSuccessAt = 0;

function isNotificationRootFresh(): boolean {
  return Date.now() - notificationRootLastSuccessAt < NOTIFICATION_ROOT_FRESH_MS;
}

function resetNotificationFetchGuards() {
  notificationRootInFlight = null;
  notificationRootLastSuccessAt = 0;
}

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
  fetchNotifications: (cursor?: string | null) => Promise<void>;
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

      fetchNotifications: async (cursor: string | null = null) => {
        if (cursor === null) {
          if (notificationRootInFlight) return notificationRootInFlight;
          if (isNotificationRootFresh()) return;
        }

        const remaining = getMaxRateLimitRemainingMs(NOTIFICATION_RATE_LIMIT_SCOPES);
        if (remaining > 0) {
          set({ isLoading: false });
          return;
        }

        const request = (async () => {
          set({ isLoading: true });
          const result = await apiClient.notifications.list({
            limit: 20,
            ...(cursor ? { cursor } : {}),
          });
          if (!result.ok) {
            const rateLimitMessage = rememberRateLimit(NOTIFICATION_RATE_LIMIT_SCOPES, result);
            logger.warn('Failed to fetch notifications:', rateLimitMessage ?? result.error.message);
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
            const actor = isRecord(n['actor'])
              ? n['actor']
              : isRecord(n['sender'])
                ? n['sender']
                : null;
            const sender = actor
              ? {
                  id: asString(actor['id']),
                  username: asString(actor['username']),
                  displayName:
                    typeof actor['display_name'] === 'string' ? actor['display_name'] : null,
                  avatarUrl: typeof actor['avatar_url'] === 'string' ? actor['avatar_url'] : null,
                }
              : undefined;
            return {
              id: asString(n['id']),
              type,
              title: asString(n['title']),
              body: asString(n['body'] ?? n['message']),
              isRead: Boolean(n['is_read'] ?? n['read'] ?? false),
              action: isRecord(n['action']) ? n['action'] : null,
              actionUrl: typeof n['action_url'] === 'string' ? n['action_url'] : null,
              data: isRecord(n['data']) ? n['data'] : {},
              sender,
              createdAt: asString(n['created_at']),
            };
          });
          // Derive pagination from the raw array length (cursor support via store state)
          const hasMore = newNotifications.length === 20;

          set((state) => {
            const merged =
              cursor === null ? newNotifications : [...state.notifications, ...newNotifications];
            const capped = merged.slice(0, MAX_NOTIFICATIONS);
            return {
              notifications: capped,
              unreadCount: capped.filter((n) => !n.isRead).length,
              hasMore,
              isLoading: false,
            };
          });

          if (cursor === null) {
            notificationRootLastSuccessAt = Date.now();
          }
        })();

        if (cursor === null) {
          const guardedRequest = request.finally(() => {
            if (notificationRootInFlight === guardedRequest) {
              notificationRootInFlight = null;
            }
          });
          notificationRootInFlight = guardedRequest;
          return guardedRequest;
        }

        return request;
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

      reset: () => {
        resetNotificationFetchGuards();
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          hasMore: true,
        });
      },
    }),
    {
      name: 'NotificationStore',
      enabled: import.meta.env.DEV,
    }
  )
);
