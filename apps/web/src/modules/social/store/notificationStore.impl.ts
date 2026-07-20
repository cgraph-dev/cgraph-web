/**
 * Notification store implementation.
 */
import { createLogger } from '@/lib/logger';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NotificationContract as ApiNotification } from '@cgraph-dev/api-client';
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

type NotificationApiRecord = ApiNotification & Record<string, unknown>;
const NOTIFICATION_TYPES = [
  'message',
  'friend_request',
  'friend_accepted',
  'group_invite',
  'group_mention',
  'channel_mention',
  'mention',
  'forum_reply',
  'forum_mention',
  'post_reply',
  'achievement',
  'level_up',
  'streak_reminder',
  'quest_completed',
  'gift_received',
  'event_reminder',
  'event_invite',
  'system',
] as const;

type NotificationStoreType = (typeof NOTIFICATION_TYPES)[number] & ApiNotification['type'];
type NotificationStoreData = NonNullable<ApiNotification['data']>;

function isNotificationApiRecord(value: ApiNotification): value is NotificationApiRecord {
  return isRecord(value);
}

export function toNotificationStoreType(rawType: string): NotificationStoreType {
  return NOTIFICATION_TYPES.find((type) => type === rawType) ?? 'system';
}

function notificationSenderId(notification: Notification): string {
  return (
    asString(notification.data['sender_id']) ||
    asString(notification.data['from_user_id']) ||
    asString(notification.data['requester_id']) ||
    notification.sender?.id ||
    ''
  );
}

function isFriendRequestFrom(notification: Notification, userId: string): boolean {
  return notification.type === 'friend_request' && notificationSenderId(notification) === userId;
}

function serverUnreadCount(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const count = value['count'] ?? value['unread_count'];
  return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null;
}

export interface Notification {
  id: ApiNotification['id'];
  type: NotificationStoreType;
  title: ApiNotification['title'];
  body: string;
  isRead: boolean;
  action?: Record<string, unknown> | null;
  actionUrl?: string | null;
  data: NotificationStoreData;
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
  addNotification: (notification: Notification, unreadCount?: number | null) => void;
  removeNotifications: (notificationIds: readonly string[], unreadCount?: number | null) => void;
  dismissFriendRequestNotificationsFromUser: (userId: string) => void;
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
          const listRequest = apiClient.notifications.list({
            limit: 20,
            ...(cursor ? { cursor } : {}),
          });
          const unreadRequest = cursor === null ? apiClient.notifications.getUnreadCount() : null;
          const [result, unreadResult] = await Promise.all([
            listRequest,
            unreadRequest ?? Promise.resolve(null),
          ]);
          if (!result.ok) {
            const rateLimitMessage = rememberRateLimit(NOTIFICATION_RATE_LIMIT_SCOPES, result);
            logger.warn('Failed to fetch notifications:', rateLimitMessage ?? result.error.message);
            set({ isLoading: false });
            return;
          }
          const newNotifications: Notification[] = result.data
            .filter(isNotificationApiRecord)
            .map((n) => {
              const rawType = asString(n['type']);
              const type = toNotificationStoreType(rawType);
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
          const authoritativeUnreadCount = unreadResult?.ok
            ? serverUnreadCount(unreadResult.data)
            : null;

          set((state) => {
            const merged =
              cursor === null ? newNotifications : [...state.notifications, ...newNotifications];
            const capped = merged.slice(0, MAX_NOTIFICATIONS);
            return {
              notifications: capped,
              unreadCount:
                cursor === null
                  ? (authoritativeUnreadCount ?? capped.filter((n) => !n.isRead).length)
                  : state.unreadCount,
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
        const authoritativeUnreadCount = serverUnreadCount(result.data);
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount:
              authoritativeUnreadCount ??
              (notification && !notification.isRead
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount),
          };
        });
      },

      markAllAsRead: async () => {
        const result = await apiClient.notifications.markAllAsRead();
        if (!result.ok) {
          logger.warn('Failed to mark all notifications as read:', result.error.message);
          return;
        }
        const authoritativeUnreadCount = serverUnreadCount(result.data);
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: authoritativeUnreadCount ?? 0,
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

      addNotification: (notification: Notification, unreadCount: number | null = null) => {
        set((state) => {
          const alreadyPresent = state.notifications.some((existing) => existing.id === notification.id);
          const notifications = alreadyPresent
            ? state.notifications
            : [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);

          return {
            notifications,
            unreadCount:
              unreadCount ??
              (alreadyPresent || notification.isRead ? state.unreadCount : state.unreadCount + 1),
          };
        });
      },

      removeNotifications: (notificationIds: readonly string[], unreadCount: number | null = null) => {
        const ids = new Set(notificationIds);
        if (ids.size === 0) return;

        set((state) => {
          const removedUnread = state.notifications.filter(
            (notification) => ids.has(notification.id) && !notification.isRead
          ).length;

          return {
            notifications: state.notifications.filter((notification) => !ids.has(notification.id)),
            unreadCount: unreadCount ?? Math.max(0, state.unreadCount - removedUnread),
          };
        });
      },

      dismissFriendRequestNotificationsFromUser: (userId: string) => {
        if (!userId) return;

        set((state) => {
          const removedUnread = state.notifications.filter(
            (notification) => isFriendRequestFrom(notification, userId) && !notification.isRead
          ).length;
          const notifications = state.notifications.filter(
            (notification) => !isFriendRequestFrom(notification, userId)
          );

          if (notifications.length === state.notifications.length) {
            return {};
          }

          return {
            notifications,
            unreadCount: Math.max(0, state.unreadCount - removedUnread),
          };
        });
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
