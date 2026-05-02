/**
 * Notification endpoints.
 *
 * Endpoints under /api/v1/notifications.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import {
  NotificationSchema,
  NotificationStatsSchema,
  UnreadCountSchema,
  PushTokenSchema,
  NotificationPreferenceSchema,
} from '../schemas/notification';
import type {
  Notification,
  NotificationStats,
  UnreadCount,
  PushToken,
  NotificationPreference,
  NotificationType,
} from '../schemas/notification';
import type { ApiResult } from '../schemas/api-result';

const EmptySchema = z.object({}).passthrough();

export type {
  Notification,
  NotificationStats,
  UnreadCount,
  PushToken,
  NotificationPreference,
  NotificationType,
};

/**
 * Creates notification endpoints for managing in-app, push, and email notifications.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all notification-related endpoint methods
 */
export function createNotificationEndpoints(http: AxiosInstance) {
  return {
    /** Get notifications. */
    async list(options?: {
      readonly limit?: number;
      readonly offset?: number;
      readonly type?: NotificationType;
      readonly unread_only?: boolean;
    }): Promise<ApiResult<Notification[]>> {
      return apiCall(
        () => http.get('/api/v1/notifications', { params: options }),
        NotificationSchema.array()
      );
    },

    /** Get a notification by ID. */
    async get(notificationId: string): Promise<ApiResult<Notification>> {
      return apiCall(() => http.get(`/api/v1/notifications/${notificationId}`), NotificationSchema);
    },

    /** Get notification stats. */
    async getStats(): Promise<ApiResult<NotificationStats>> {
      return apiCall(() => http.get('/api/v1/notifications/stats'), NotificationStatsSchema);
    },

    /** Get unread count. */
    async getUnreadCount(): Promise<ApiResult<UnreadCount>> {
      return apiCall(() => http.get('/api/v1/notifications/unread/count'), UnreadCountSchema);
    },

    /** Mark a notification as read. */
    async markAsRead(notificationId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post(`/api/v1/notifications/${notificationId}/read`), EmptySchema);
    },

    /** Mark multiple notifications as read. */
    async markMultipleAsRead(
      notificationIds: readonly string[]
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.post('/api/v1/notifications/read', { notification_ids: notificationIds }),
        EmptySchema
      );
    },

    /** Mark all notifications as read. */
    async markAllAsRead(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/notifications/read-all'), EmptySchema);
    },

    /** Mark notifications of a type as read. */
    async markTypeAsRead(type: NotificationType): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/notifications/read-type', { type }), EmptySchema);
    },

    /** Delete a notification. */
    async delete(notificationId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/notifications/${notificationId}`), EmptySchema);
    },

    /** Delete all notifications. */
    async deleteAll(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete('/api/v1/notifications'), EmptySchema);
    },

    /** Delete read notifications. */
    async deleteRead(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete('/api/v1/notifications/read'), EmptySchema);
    },

    /** Register a push token. */
    async registerPushToken(
      token: string,
      platform: 'ios' | 'android' | 'web',
      deviceName?: string
    ): Promise<ApiResult<PushToken>> {
      return apiCall(
        () =>
          http.post('/api/v1/notifications/push-tokens', {
            token,
            platform,
            device_name: deviceName,
          }),
        PushTokenSchema
      );
    },

    /** Unregister a push token. */
    async unregisterPushToken(token: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.delete('/api/v1/notifications/push-tokens', { data: { token } }),
        EmptySchema
      );
    },

    /** Get notification preferences. */
    async getPreferences(): Promise<ApiResult<NotificationPreference[]>> {
      return apiCall(
        () => http.get('/api/v1/users/me/notification-preferences'),
        NotificationPreferenceSchema.array()
      );
    },

    /** Update a notification preference. */
    async updatePreference(
      type: NotificationType,
      settings: {
        readonly enabled?: boolean;
        readonly push?: boolean;
        readonly email?: boolean;
        readonly in_app?: boolean;
      }
    ): Promise<ApiResult<NotificationPreference>> {
      return apiCall(
        () => http.patch(`/api/v1/users/me/notification-preferences/${type}`, settings),
        NotificationPreferenceSchema
      );
    },
  };
}
