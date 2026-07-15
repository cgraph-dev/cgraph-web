import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  getLastSyncTimestamp: vi.fn(),
  setLastSyncTimestamp: vi.fn(),
  saveMessages: vi.fn(),
  saveConversations: vi.fn(),
  removeMessages: vi.fn(),
  getPendingMessages: vi.fn(),
  removePendingMessage: vi.fn(),
  updatePendingMessageStatus: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.get,
    post: mocks.post,
  },
}));

vi.mock('../indexeddb-cache', () => ({
  getLastSyncTimestamp: mocks.getLastSyncTimestamp,
  setLastSyncTimestamp: mocks.setLastSyncTimestamp,
  saveMessages: mocks.saveMessages,
  saveConversations: mocks.saveConversations,
  removeMessages: mocks.removeMessages,
  getPendingMessages: mocks.getPendingMessages,
  removePendingMessage: mocks.removePendingMessage,
  updatePendingMessageStatus: mocks.updatePendingMessageStatus,
}));

import { runSync } from '../sync-service';

const validMessage = {
  id: 'message-1',
  conversationId: 'conversation-1',
  senderId: 'user-1',
  content: 'persisted cloud message',
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
  metadata: {},
  createdAt: '2026-07-15T00:00:00Z',
  updatedAt: '2026-07-15T00:00:00Z',
};

function pullResponse(messages: unknown[]) {
  return {
    data: {
      data: {
        messages,
        tombstones: [],
        conversations: [
          {
            id: 'conversation-1',
            type: 'cloud',
            name: null,
            createdAt: '2026-07-15T00:00:00Z',
            updatedAt: '2026-07-15T00:00:00Z',
          },
        ],
        cursor: null,
        has_more: false,
        server_timestamp: '2026-07-15T00:01:00Z',
      },
    },
  };
}

describe('offline sync response validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    mocks.getLastSyncTimestamp.mockResolvedValue(null);
    mocks.getPendingMessages.mockResolvedValue([]);
  });

  it('persists canonical messages by their validated conversation key', async () => {
    mocks.get.mockResolvedValue(pullResponse([validMessage]));

    await expect(runSync()).resolves.toMatchObject({ pulled: 1, pushed: 0, tombstones: 0 });

    expect(mocks.saveMessages).toHaveBeenCalledWith('conversation-1', [validMessage]);
    expect(mocks.saveConversations).toHaveBeenCalledTimes(1);
    expect(mocks.setLastSyncTimestamp).toHaveBeenCalledWith('2026-07-15T00:01:00Z');
  });

  it('rejects snake_case messages without advancing the sync cursor', async () => {
    const malformed = {
      ...validMessage,
      conversation_id: validMessage.conversationId,
      conversationId: undefined,
    };
    mocks.get.mockResolvedValue(pullResponse([malformed]));

    await expect(runSync()).resolves.toBeNull();

    expect(mocks.saveMessages).not.toHaveBeenCalled();
    expect(mocks.setLastSyncTimestamp).not.toHaveBeenCalled();
  });
});
