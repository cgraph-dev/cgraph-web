import type { Notification as StoreNotification } from '@/modules/social/store';
import { getGroupDestinationRoute } from '@/modules/groups/routing';

type RoutableNotification = Pick<
  StoreNotification,
  'type' | 'action' | 'actionUrl' | 'data' | 'sender'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function withMessageAnchor(route: string, messageId?: string): string {
  return messageId ? `${route}?scrollTo=${encodeURIComponent(messageId)}` : route;
}

function postRoute(params: Record<string, unknown>): string | undefined {
  const forumIdOrSlug = stringValue(params, 'forum_slug') ?? stringValue(params, 'forum_id');
  const postId = stringValue(params, 'post_id');

  return forumIdOrSlug && postId ? `/forums/${forumIdOrSlug}/post/${postId}` : undefined;
}

function groupRoute(params: Record<string, unknown>): string | undefined {
  const groupId = stringValue(params, 'group_id') ?? stringValue(params, 'groupId');
  const channelId =
    stringValue(params, 'channel_id') ??
    stringValue(params, 'channelId') ??
    stringValue(params, 'default_channel_id') ??
    stringValue(params, 'defaultChannelId');
  const messageId = stringValue(params, 'message_id') ?? stringValue(params, 'messageId');

  return getGroupDestinationRoute({ groupId, channelId, messageId });
}

function routeFromAction(action: Record<string, unknown>): string | undefined {
  const screen = stringValue(action, 'screen');
  const params = isRecord(action.params) ? action.params : {};

  if (screen === 'conversation') {
    const conversationId = stringValue(params, 'conversation_id');
    return conversationId
      ? withMessageAnchor(`/messages/${conversationId}`, stringValue(params, 'message_id'))
      : undefined;
  }

  if (screen === 'profile') {
    const userId = stringValue(params, 'user_id');
    return userId ? `/user/${userId}` : undefined;
  }

  if (screen === 'friend_requests') {
    return '/social/friends';
  }

  if (screen === 'group') {
    return groupRoute(params);
  }

  if (screen === 'post') {
    return postRoute(params);
  }

  return undefined;
}

/**
 * Resolves the destination route for a notification action.
 */
export function getNotificationActionUrl(notification: RoutableNotification): string | undefined {
  if (notification.actionUrl) return notification.actionUrl;

  const actionRoute = notification.action ? routeFromAction(notification.action) : undefined;
  if (actionRoute) return actionRoute;

  const { data } = notification;
  const conversationId = stringValue(data, 'conversation_id');
  if (conversationId) {
    return withMessageAnchor(`/messages/${conversationId}`, stringValue(data, 'message_id'));
  }

  const group = groupRoute(data);
  if (group) return group;

  const post = postRoute(data);
  if (post) return post;

  const userId =
    stringValue(data, 'user_id') ??
    stringValue(data, 'sender_id') ??
    stringValue(data, 'accepter_id') ??
    notification.sender?.id;

  if (notification.type === 'friend_request') {
    return '/social/friends';
  }

  return userId ? `/user/${userId}` : undefined;
}
