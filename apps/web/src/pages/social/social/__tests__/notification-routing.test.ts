import { describe, expect, it } from 'vitest';

import { getNotificationActionUrl } from '../notification-routing';
import type { Notification } from '@/modules/social/store';

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: 'notification-1',
    type: 'system',
    title: 'Notification',
    body: 'Body',
    isRead: false,
    data: {},
    createdAt: '2026-04-30T12:00:00Z',
    ...overrides,
  };
}

describe('getNotificationActionUrl', () => {
  it('preserves canonical action URLs from the API', () => {
    expect(getNotificationActionUrl(notification({ actionUrl: '/messages/canonical' }))).toBe(
      '/messages/canonical'
    );
  });

  it('maps conversation actions to routed messages with message anchors', () => {
    expect(
      getNotificationActionUrl(
        notification({
          type: 'message',
          action: {
            type: 'navigate',
            screen: 'conversation',
            params: { conversation_id: 'conversation-1', message_id: 'message-1' },
          },
        })
      )
    ).toBe('/messages/conversation-1?scrollTo=message-1');
  });

  it('maps forum notification data to the routed forum post', () => {
    expect(
      getNotificationActionUrl(
        notification({
          type: 'forum_reply',
          data: { forum_slug: 'forum-slug', post_id: 'post-1' },
        })
      )
    ).toBe('/forums/forum-slug/post/post-1');
  });

  it('maps group invitations to the mounted group route', () => {
    expect(
      getNotificationActionUrl(
        notification({
          type: 'group_invite',
          data: { group_id: 'group-1' },
        })
      )
    ).toBe('/groups/group-1');
  });

  it('routes friend requests to the social friend-request surface', () => {
    expect(
      getNotificationActionUrl(
        notification({
          type: 'friend_request',
          data: { sender_id: 'user-1' },
        })
      )
    ).toBe('/social/friends');
  });
});
