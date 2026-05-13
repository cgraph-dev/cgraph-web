import { describe, expect, it } from 'vitest';

import { getDiscoverResultRoute } from '../discover-routing';
import type { SearchResult } from '../types';

function result(overrides: Partial<SearchResult>): SearchResult {
  return {
    id: 'item-1',
    type: 'user',
    name: 'Result',
    description: '',
    ...overrides,
  };
}

describe('getDiscoverResultRoute', () => {
  it('opens users on their profile route', () => {
    expect(getDiscoverResultRoute(result({ id: 'user-1', type: 'user' }))).toBe('/user/user-1');
  });

  it('opens forums by slug instead of id', () => {
    expect(
      getDiscoverResultRoute(result({ id: 'forum-id', type: 'forum', slug: 'forum-slug' }))
    ).toBe('/forums/forum-slug');
  });

  it('keeps forum results away from dead id routes when slug is unavailable', () => {
    expect(getDiscoverResultRoute(result({ id: 'forum-id', type: 'forum' }))).toBe('/forums');
  });

  it('opens groups on the canonical channel route when search metadata includes it', () => {
    expect(
      getDiscoverResultRoute(
        result({ id: 'group-1', type: 'group', defaultChannelId: 'channel-1' })
      )
    ).toBe('/groups/group-1/channels/channel-1');
  });

  it('opens groups on the mounted group root fallback when no channel metadata exists', () => {
    expect(getDiscoverResultRoute(result({ id: 'group-1', type: 'group' }))).toBe(
      '/groups/group-1'
    );
  });

  it('does not let stale bare routes override canonical group channel metadata', () => {
    expect(
      getDiscoverResultRoute(
        result({
          id: 'group-1',
          type: 'group',
          defaultChannelId: 'channel-1',
          route: '/groups/group-1',
        })
      )
    ).toBe('/groups/group-1/channels/channel-1');
  });
});
