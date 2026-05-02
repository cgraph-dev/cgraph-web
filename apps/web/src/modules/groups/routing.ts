import type { Channel, Group } from './store';

const CHANNEL_ROUTE_TYPES = new Set<Channel['type']>(['text', 'announcement', 'forum']);

type RoutableGroup = Pick<Group, 'id' | 'channels' | 'categories'>;

function collectChannels(group: Pick<Group, 'channels' | 'categories'>): Channel[] {
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
  const channels = collectChannels(group);
  return channels.find((channel) => CHANNEL_ROUTE_TYPES.has(channel.type)) ?? channels[0] ?? null;
}

/**
 * Builds the default app route for a group.
 */
export function getGroupRoute(group: RoutableGroup): string {
  const channel = getDefaultGroupChannel(group);
  return channel ? `/groups/${group.id}/channels/${channel.id}` : `/groups/${group.id}`;
}
