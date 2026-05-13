import { describe, expect, it } from 'vitest';
import {
  getDefaultGroupChannel,
  getGroupChannelRoute,
  getGroupLiveKitRoomName,
  getGroupDestinationRoute,
  getGroupRoute,
} from '@/modules/groups/routing';
import type { Group } from '@/modules/groups/store';

function groupWithChannels(
  channels: Group['channels'],
  categories: Group['categories'] = [],
) {
  return {
    id: 'group-1',
    channels,
    categories,
  } satisfies Pick<Group, 'id' | 'channels' | 'categories'>;
}

describe('group routing', () => {
  it('opens the first routable channel for a group root destination', () => {
    const group = groupWithChannels([
      {
        id: 'voice-1',
        name: 'Voice',
        type: 'voice',
        topic: null,
        categoryId: null,
        position: 0,
        isNsfw: false,
        slowModeSeconds: 0,
        unreadCount: 0,
        lastMessageAt: null,
      },
      {
        id: 'chat-1',
        name: 'General',
        type: 'text',
        topic: null,
        categoryId: null,
        position: 1,
        isNsfw: false,
        slowModeSeconds: 0,
        unreadCount: 0,
        lastMessageAt: null,
      },
    ]);

    expect(getDefaultGroupChannel(group)?.id).toBe('chat-1');
    expect(getGroupRoute(group)).toBe('/groups/group-1/channels/chat-1');
  });

  it('uses category channels when the flat channel list is empty', () => {
    const group = groupWithChannels(
      [],
      [
        {
          id: 'category-1',
          name: 'Main',
          position: 0,
          channels: [
            {
              id: 'announcements-1',
              name: 'Announcements',
              type: 'announcement',
              topic: null,
              categoryId: 'category-1',
              position: 0,
              isNsfw: false,
              slowModeSeconds: 0,
              unreadCount: 0,
              lastMessageAt: null,
            },
          ],
        },
      ],
    );

    expect(getGroupRoute(group)).toBe(
      '/groups/group-1/announcements/announcements-1',
    );
  });

  it('keeps the group root as a real fallback when no channels exist yet', () => {
    expect(getGroupRoute(groupWithChannels([]))).toBe('/groups/group-1');
  });

  it('builds canonical channel destinations with message anchors', () => {
    expect(
      getGroupDestinationRoute({
        groupId: 'group-1',
        channelId: 'channel-1',
        messageId: 'message 1',
      }),
    ).toBe('/groups/group-1/channels/channel-1?scrollTo=message%201');
  });

  it('builds type-specific routes for non-text group channels', () => {
    expect(getGroupChannelRoute('group-1', 'voice-1', 'voice')).toBe(
      '/groups/group-1/voice/voice-1',
    );
    expect(getGroupChannelRoute('group-1', 'video-1', 'video')).toBe(
      '/groups/group-1/video/video-1',
    );
    expect(
      getGroupChannelRoute('group-1', 'announcement-1', 'announcement'),
    ).toBe('/groups/group-1/announcements/announcement-1');
    expect(getGroupChannelRoute('group-1', 'forum-1', 'forum')).toBe(
      '/groups/group-1/forums/forum-1',
    );
  });

  it('uses the backend-compatible room name for group call channels', () => {
    expect(getGroupLiveKitRoomName('group-1', 'voice-1')).toBe(
      'group_group-1_channel_voice-1',
    );
  });
});
