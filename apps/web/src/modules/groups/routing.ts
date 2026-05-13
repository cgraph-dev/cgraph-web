import type { Channel, Group } from './store';

const CHANNEL_ROUTE_TYPES = new Set<Channel['type']>(['text', 'announcement', 'forum']);

type RoutableGroup = Pick<Group, 'id' | 'channels' | 'categories'>;

export interface GroupDestinationParams {
  groupId?: string | null;
  channelId?: string | null;
  channelType?: Channel['type'] | null;
  messageId?: string | null;
}

/**
 * Collects flat and categorized channels into one stable ordered list.
 */
export function collectGroupChannels(group: Pick<Group, 'channels' | 'categories'>): Channel[] {
  const channelsById = new Map<string, Channel>();

  for (const channel of group.channels ?? []) {
    channelsById.set(channel.id, channel);
  }

  for (const category of group.categories ?? []) {
    for (const channel of category.channels ?? []) {
      channelsById.set(channel.id, channel);
    }
  }

  return Array.from(channelsById.values()).sort((left, right) => {
    const positionDelta = left.position - right.position;
    return positionDelta === 0 ? left.name.localeCompare(right.name) : positionDelta;
  });
}

/**
 * Returns the first routeable channel for a group.
 */
export function getDefaultGroupChannel(group: Pick<Group, 'channels' | 'categories'>) {
  const channels = collectGroupChannels(group);
  return channels.find((channel) => CHANNEL_ROUTE_TYPES.has(channel.type)) ?? channels[0] ?? null;
}

/**
 * Finds a channel by id across flat and categorized group channel collections.
 */
export function findGroupChannel(
  group: Pick<Group, 'channels' | 'categories'>,
  channelId?: string | null
): Channel | null {
  if (!channelId) return null;
  return collectGroupChannels(group).find((channel) => channel.id === channelId) ?? null;
}

/**
 * Builds the default app route for a group.
 */
export function getGroupRoute(group: RoutableGroup): string {
  const channel = getDefaultGroupChannel(group);
  return (
    getGroupDestinationRoute({
      groupId: group.id,
      channelId: channel?.id,
      channelType: channel?.type,
    }) ?? `/groups/${group.id}`
  );
}

/**
 * Builds the mounted route for a specific group channel.
 */
export function getGroupChannelRoute(
  groupId: string,
  channelId: string,
  channelType: Channel['type'] = 'text'
): string {
  switch (channelType) {
    case 'voice':
      return `/groups/${groupId}/voice/${channelId}`;
    case 'video':
      return `/groups/${groupId}/video/${channelId}`;
    case 'announcement':
      return `/groups/${groupId}/announcements/${channelId}`;
    case 'forum':
      return `/groups/${groupId}/forums/${channelId}`;
    default:
      return `/groups/${groupId}/channels/${channelId}`;
  }
}

/**
 * Builds the mounted route for a channel when the full channel type is available.
 */
export function getGroupChannelRouteForChannel(
  groupId: string,
  channel: Pick<Channel, 'id' | 'type'>
): string {
  return getGroupChannelRoute(groupId, channel.id, channel.type);
}

/**
 * Builds the backend-compatible LiveKit room name for a group call channel.
 */
export function getGroupLiveKitRoomName(groupId: string, channelId: string): string {
  return `group_${groupId}_channel_${channelId}`;
}

/**
 * Builds the best available group route from group, channel, and optional message context.
 */
export function getGroupDestinationRoute({
  groupId,
  channelId,
  channelType,
  messageId,
}: GroupDestinationParams): string | undefined {
  if (!groupId) return undefined;

  const route = channelId
    ? getGroupChannelRoute(groupId, channelId, channelType ?? 'text')
    : `/groups/${groupId}`;
  return messageId ? `${route}?scrollTo=${encodeURIComponent(messageId)}` : route;
}
