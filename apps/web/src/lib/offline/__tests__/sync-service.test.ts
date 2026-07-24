import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.get,
    post: mocks.post,
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: mocks.getCurrentUser,
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
  let serviceWorkerDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
    mocks.getCurrentUser.mockReturnValue({ user: { id: 'account-1' } });
    mocks.getLastSyncTimestamp.mockResolvedValue(null);
    mocks.getPendingMessages.mockResolvedValue([]);
  });

  afterEach(() => {
    if (serviceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', serviceWorkerDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    }
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

  it('retries stale interrupted sends through the direct Cloud Chat endpoint', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(31_000);
    mocks.get.mockResolvedValue(pullResponse([]));
    mocks.getPendingMessages.mockResolvedValue([
      {
        id: 'pending-1',
        accountId: 'account-1',
        clientMessageId: 'client-1',
        conversationId: 'conversation-1',
        content: 'retry after reload',
        contentType: 'text',
        payload: { content: 'retry after reload', client_message_id: 'client-1' },
        createdAt: 1,
        status: 'sending',
        lastAttemptAt: 0,
        retryCount: 0,
      },
      {
        id: 'failed-1',
        accountId: 'account-1',
        clientMessageId: 'client-failed',
        conversationId: 'conversation-1',
        content: 'manual retry only',
        contentType: 'text',
        payload: { content: 'manual retry only', client_message_id: 'client-failed' },
        createdAt: 2,
        status: 'failed',
        retryCount: 1,
      },
    ]);
    mocks.post.mockResolvedValue({ data: { message: validMessage } });

    await expect(runSync()).resolves.toMatchObject({ pushed: 1 });

    expect(mocks.getPendingMessages).toHaveBeenCalledWith('account-1');
    expect(mocks.post).toHaveBeenCalledWith('/api/v1/conversations/conversation-1/messages', {
      content: 'retry after reload',
      client_message_id: 'client-1',
    });
    expect(mocks.updatePendingMessageStatus).toHaveBeenCalledWith('pending-1', 'sending');
    expect(mocks.updatePendingMessageStatus).not.toHaveBeenCalledWith('failed-1', 'sending');
    expect(mocks.removePendingMessage).toHaveBeenCalledWith('pending-1');
  });

  it('does not retry an active direct send before its stale window', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    mocks.get.mockResolvedValue(pullResponse([]));
    mocks.getPendingMessages.mockResolvedValue([
      {
        id: 'pending-1',
        accountId: 'account-1',
        clientMessageId: 'client-1',
        conversationId: 'conversation-1',
        content: 'still sending',
        contentType: 'text',
        payload: { content: 'still sending', client_message_id: 'client-1' },
        createdAt: 1,
        status: 'sending',
        lastAttemptAt: 9_999,
        retryCount: 0,
      },
    ]);

    await expect(runSync()).resolves.toMatchObject({ pushed: 0 });

    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.updatePendingMessageStatus).not.toHaveBeenCalled();
  });

  it('leaves queued delivery to Background Sync when the browser supports it', async () => {
    mocks.get.mockResolvedValue(pullResponse([]));
    mocks.getPendingMessages.mockResolvedValue([
      {
        id: 'pending-1',
        accountId: 'account-1',
        clientMessageId: 'client-1',
        conversationId: 'conversation-1',
        content: 'worker owns retry',
        contentType: 'text',
        payload: { content: 'worker owns retry', client_message_id: 'client-1' },
        createdAt: 1,
        status: 'pending',
        retryCount: 0,
      },
    ]);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({ sync: { register: vi.fn() } }) },
    });

    await expect(runSync()).resolves.toMatchObject({ pushed: 0 });

    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.getPendingMessages).not.toHaveBeenCalled();
  });
});
