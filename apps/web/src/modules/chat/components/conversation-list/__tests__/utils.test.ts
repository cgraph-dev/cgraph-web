import { describe, expect, it } from 'vitest';
import type { Conversation } from '@/modules/chat/store/chatStore.impl';
import { getConversationName } from '../utils';

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conversation-1',
    type: 'direct',
    name: 'Generic backend title',
    avatarUrl: null,
    participants: [
      {
        id: 'participant-current',
        userId: 'current-user',
        nickname: null,
        isMuted: false,
        mutedUntil: null,
        joinedAt: '2026-01-01T00:00:00.000Z',
        user: {
          id: 'current-user',
          username: 'current',
          displayName: 'Current User',
          avatarUrl: null,
          status: 'online',
        },
      },
      {
        id: 'participant-peer',
        userId: 'peer-user',
        nickname: null,
        isMuted: false,
        mutedUntil: null,
        joinedAt: '2026-01-01T00:00:00.000Z',
        user: {
          id: 'peer-user',
          username: 'peer',
          displayName: 'Peer User',
          avatarUrl: null,
          status: 'online',
        },
      },
    ],
    lastMessage: null,
    unreadCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getConversationName', () => {
  it('uses the peer identity for a direct conversation', () => {
    expect(getConversationName(conversation(), 'current-user')).toBe('Peer User');
  });

  it('preserves explicit titles for groups and Note to Self', () => {
    expect(
      getConversationName(conversation({ type: 'group', isGroup: true, name: 'Design Team' }))
    ).toBe('Design Team');
    expect(
      getConversationName(conversation({ isNoteToSelf: true, name: 'Saved Messages' }), 'current-user')
    ).toBe('Saved Messages');
  });
});
