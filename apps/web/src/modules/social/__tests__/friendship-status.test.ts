import { describe, expect, it } from 'vitest';

import {
  friendshipActionLabel,
  isRelationshipActionDisabled,
  normalizeFriendshipStatus,
  resolveFriendshipStatus,
} from '../friendship-status';

describe('friendship status resolver', () => {
  it('keeps incoming and outgoing request states distinct', () => {
    expect(
      resolveFriendshipStatus(
        { id: 'user-1' },
        {
          pendingRequests: [{ user: { id: 'user-1' } }],
          sentRequests: [{ user: { id: 'user-2' } }],
        }
      )
    ).toBe('pending_received');

    expect(
      resolveFriendshipStatus(
        { id: 'user-2' },
        {
          pendingRequests: [{ user: { id: 'user-1' } }],
          sentRequests: [{ user: { id: 'user-2' } }],
        }
      )
    ).toBe('pending_sent');
  });

  it('lets blocked and local store state override stale search metadata', () => {
    expect(
      resolveFriendshipStatus(
        { id: 'user-1', friendship_status: 'friends', is_blocked: true },
        { friends: [{ id: 'user-1' }] }
      )
    ).toBe('blocked');

    expect(
      resolveFriendshipStatus(
        { id: 'user-1', friendship_status: 'none' },
        { friends: [{ id: 'user-1' }] }
      )
    ).toBe('friends');
  });

  it('normalizes labels and disabled states for user-result actions', () => {
    expect(normalizeFriendshipStatus('pending_received')).toBe('pending_received');
    expect(normalizeFriendshipStatus('unknown')).toBeNull();
    expect(friendshipActionLabel('pending_received')).toBe('Review');
    expect(friendshipActionLabel('none', true)).toBe('Sending');
    expect(isRelationshipActionDisabled('pending_received')).toBe(false);
    expect(isRelationshipActionDisabled('pending_sent')).toBe(true);
  });
});
