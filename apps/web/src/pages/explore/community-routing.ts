import { getGroupDestinationRoute } from '@/modules/groups/routing';

export interface CommunityRouteTarget {
  id: string;
  type: 'group' | 'forum';
  default_channel_id?: string | null;
  defaultChannelId?: string | null;
}

/**
 * Builds the mounted destination for an Explore community card.
 */
export function getCommunityRoute(community: CommunityRouteTarget): string {
  if (community.type === 'group') {
    return (
      getGroupDestinationRoute({
        groupId: community.id,
        channelId: community.default_channel_id ?? community.defaultChannelId,
      }) ?? `/groups/${community.id}`
    );
  }

  return `/forums/${community.id}`;
}
