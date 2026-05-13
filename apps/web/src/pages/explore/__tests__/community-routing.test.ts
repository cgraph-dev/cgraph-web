import { describe, expect, it } from 'vitest';
import { getCommunityRoute } from '../community-routing';

describe('getCommunityRoute', () => {
  it('routes group communities with default channel metadata to the mounted channel', () => {
    expect(
      getCommunityRoute({
        id: 'group-1',
        type: 'group',
        default_channel_id: 'channel-1',
      })
    ).toBe('/groups/group-1/channels/channel-1');
  });

  it('keeps bare group fallback only when the API has no channel metadata', () => {
    expect(getCommunityRoute({ id: 'group-1', type: 'group' })).toBe('/groups/group-1');
  });

  it('routes forums to their forum destination', () => {
    expect(getCommunityRoute({ id: 'forum-1', type: 'forum' })).toBe('/forums/forum-1');
  });
});
