export type NotificationMode = 'all' | 'mentions_only' | 'none';

export type NotificationTargetType = 'conversation' | 'channel' | 'group';

export interface NotificationPreference {
  id?: string;
  targetType: NotificationTargetType;
  targetId: string;
  mode: NotificationMode;
  mutedUntil?: string | null; // ISO 8601 datetime
  insertedAt?: string;
  updatedAt?: string;
}

export interface UpsertNotificationPreferenceRequest {
  mode: NotificationMode;
  mutedUntil?: string | null;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export interface NotificationPreferenceResponse {
  preference: NotificationPreference;
}

export const MUTE_DURATIONS = {
  '1h': 3600,
  '8h': 28800,
  '24h': 86400,
  '1w': 604800,
  forever: null,
} as const;

export type MuteDurationKey = keyof typeof MUTE_DURATIONS;

export type NotificationType = 'message' | 'social' | 'group' | 'forum' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  groupKey?: string;
  count?: number;
  readAt?: string;
  clickedAt?: string;
  createdAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
}
