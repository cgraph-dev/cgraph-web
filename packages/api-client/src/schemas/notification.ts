/**
 * Notification schemas.
 */
import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'message',
  'friend_request',
  'friend_accepted',
  'group_invite',
  'group_mention',
  'channel_mention',
  'forum_reply',
  'forum_mention',
  'achievement',
  'level_up',
  'streak_reminder',
  'quest_completed',
  'gift_received',
  'event_reminder',
  'event_invite',
  'system',
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSenderSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export type NotificationSender = z.infer<typeof NotificationSenderSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  message: z.string().optional(),
  image_url: z.string().nullable().optional(),
  action_url: z.string().nullable().optional(),
  action: z.unknown().nullable().optional(),
  data: z.record(z.unknown()).optional(),
  read: z.boolean().optional(),
  is_read: z.boolean().optional(),
  created_at: z.string().optional(),
  expires_at: z.string().nullable().optional(),
  sender: z.unknown().nullable().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationStatsSchema = z.object({
  total: z.number(),
  unread: z.number(),
  by_type: z.record(z.number()).optional(),
});

export type NotificationStats = z.infer<typeof NotificationStatsSchema>;

export const UnreadCountSchema = z.object({
  count: z.number(),
});

export type UnreadCount = z.infer<typeof UnreadCountSchema>;

export const PushTokenSchema = z.object({
  id: z.string().optional(),
  token: z.string(),
  platform: z.string(),
  device_name: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type PushToken = z.infer<typeof PushTokenSchema>;

export const NotificationPreferenceSchema = z.object({
  type: z.string(),
  enabled: z.boolean().optional(),
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  in_app: z.boolean().optional(),
});

export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
