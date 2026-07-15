import { describe, expect, it } from 'vitest';

import { getMessages, saveMessages, type CachedMessage } from '../indexeddb-cache';

const message: CachedMessage = {
  id: 'message-1',
  conversationId: 'conversation-1',
  senderId: 'user-1',
  content: 'hello',
  contentType: 'text',
  isEncrypted: true,
  isEdited: false,
  clientMessageId: 'client-1',
  replyToId: null,
  sender: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
  },
  createdAt: '2026-07-15T00:00:00Z',
  updatedAt: '2026-07-15T00:00:00Z',
};

describe('IndexedDB cache keys', () => {
  it('rejects a missing conversation key before opening IndexedDB', async () => {
    await expect(saveMessages('', [message])).rejects.toThrow(
      'conversationId must be a non-empty string'
    );
    await expect(getMessages('')).rejects.toThrow('conversationId must be a non-empty string');
  });

  it('rejects messages assigned to a different cache partition', async () => {
    await expect(
      saveMessages('conversation-2', [{ ...message, conversationId: 'conversation-1' }])
    ).rejects.toThrow('message.conversationId must match the cache partition');
  });
});
