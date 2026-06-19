import type { SearchResult } from './types';
import { getGroupDestinationRoute } from '@/modules/groups/routing';
import { isCanonicalUsername } from '@/lib/profile-route';

function safeInAppRoute(route: string | undefined, resultType: SearchResult['type']): string | null {
  const trimmed = route?.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, 'https://web.cgraph.org');
    if (parsed.origin !== 'https://web.cgraph.org') {
      return null;
    }

    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const usernamePath = parsed.pathname.split('/').filter(Boolean);
    if (
      resultType === 'user' &&
      (path.startsWith('/user/') ||
        path.startsWith('/u/') ||
        (usernamePath.length === 1 && isCanonicalUsername(usernamePath[0])))
    ) {
      return path;
    }
    if (resultType === 'group' && path.startsWith('/groups/')) return path;
    if (resultType === 'forum' && path.startsWith('/forums')) return path;
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolves a search result into the app route it should open.
 */
export function getDiscoverResultRoute(result: SearchResult): string {
  const backendCanonicalRoute = safeInAppRoute(result.canonicalUrl, result.type);
  if (backendCanonicalRoute) return backendCanonicalRoute;

  if (result.type === 'group') {
    const canonicalRoute = getGroupDestinationRoute({
      groupId: result.id,
      channelId: result.defaultChannelId,
    });

    if (canonicalRoute && canonicalRoute !== `/groups/${result.id}`) {
      return canonicalRoute;
    }

    return safeInAppRoute(result.route, result.type) ?? canonicalRoute ?? `/groups/${result.id}`;
  }

  const backendRoute = safeInAppRoute(result.route, result.type);
  if (backendRoute) return backendRoute;

  if (result.type === 'user') {
    if (isCanonicalUsername(result.username)) return `/${encodeURIComponent(result.username)}`;
    return `/user/${result.id}`;
  }

  if (result.type === 'forum') {
    return result.slug ? `/forums/${result.slug}` : '/forums';
  }

  return `/groups/${result.id}`;
}
