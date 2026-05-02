import type { SearchResult } from './types';

/**
 * Resolves a search result into the app route it should open.
 */
export function getDiscoverResultRoute(result: SearchResult): string {
  if (result.route) return result.route;

  if (result.type === 'user') {
    return `/user/${result.id}`;
  }

  if (result.type === 'forum') {
    return result.slug ? `/forums/${result.slug}` : '/forums';
  }

  return `/groups/${result.id}`;
}
