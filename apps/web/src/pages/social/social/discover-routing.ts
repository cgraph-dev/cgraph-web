import type { SearchResult } from './types';
import { getGroupDestinationRoute } from '@/modules/groups/routing';

/**
 * Resolves a search result into the app route it should open.
 */
export function getDiscoverResultRoute(result: SearchResult): string {
  if (result.type === 'group') {
    const canonicalRoute = getGroupDestinationRoute({
      groupId: result.id,
      channelId: result.defaultChannelId,
    });

    if (canonicalRoute && canonicalRoute !== `/groups/${result.id}`) {
      return canonicalRoute;
    }

    return result.route ?? canonicalRoute ?? `/groups/${result.id}`;
  }

  if (result.route) return result.route;

  if (result.type === 'user') {
    return `/user/${result.id}`;
  }

  if (result.type === 'forum') {
    return result.slug ? `/forums/${result.slug}` : '/forums';
  }

  return `/groups/${result.id}`;
}
