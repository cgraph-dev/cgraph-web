import { describe, expect, it } from 'vitest';
import { normalizeMessageReactions, toTypedMessage } from '../chatStore.normalizers';

describe('chatStore normalizers', () => {
  it('normalizes backend reaction summaries without losing counts or users', () => {
    expect(
      normalizeMessageReactions([
        {
          emoji: '👍',
          count: 3,
          users: [
            { id: 'user-1', username: 'alice' },
            { id: 'user-2', display_name: 'Bob' },
          ],
        },
      ])
    ).toEqual([
      {
        id: '👍-user-1-0',
        emoji: '👍',
        userId: 'user-1',
        user: { id: 'user-1', username: 'alice' },
        count: 3,
        users: [
          { id: 'user-1', username: 'alice' },
          { id: 'user-2', username: 'Bob' },
        ],
        hasReacted: undefined,
      },
    ]);
  });

  it('keeps normalized message reactions from API payloads', () => {
    const message = toTypedMessage({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'sender-1',
      content: 'hello',
      isEncrypted: false,
      messageType: 'text',
      sender: { id: 'sender-1', username: 'sender' },
      reactions: [{ id: 'r-1', emoji: '🔥', user_id: 'user-1' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(message.reactions).toEqual([
      {
        id: 'r-1',
        emoji: '🔥',
        userId: 'user-1',
        user: { id: 'user-1', username: 'Unknown User' },
        count: undefined,
        users: undefined,
        hasReacted: undefined,
      },
    ]);
  });
});
