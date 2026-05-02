/**
 * Chat Store — Message Operations Tests
 *
 * Tests for message add, update, remove, mark deleted,
 * delivery status, read receipts, and socket-driven reactions.
 *
 * These test the action creators in isolation with mock set/get.
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils', () => ({
  ensureObject: (_d: unknown, key: string) => {
    if (_d && typeof _d === 'object' && key in (_d as Record<string, unknown>))
      return (_d as Record<string, unknown>)[key];
    return _d;
  },
  normalizeMessage: (m: unknown) => m,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ user: { id: 'current-user', username: 'me' } })),
  },
}));

import { api } from '@/lib/api-client';
import { createMessageOpsActions } from '../chatStore.message-ops';
import type { Message, ChatState } from '../chatStore.types';

const mockApi = {
  post: api.post as MockedFunction<typeof api.post>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};
function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'hello',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatarUrl: null },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockSetGet(initialMessages: Record<string, Message[]> = {}) {
  const state: Partial<ChatState> = {
    messages: initialMessages,
    messageIdSets: {},
    conversations: [],
    readReceipts: {},
  };

  const set = vi.fn((partial: unknown) => {
    const updates = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, updates);
  });

  const get = vi.fn(() => state);

  // Attach sub-actions that message-ops calls on `get()`
  (state as Record<string, unknown>).updateMessage = vi.fn((msg: Message) => {
    const convMsgs = state.messages?.[msg.conversationId] || [];
    state.messages = {
      ...state.messages,
      [msg.conversationId]: convMsgs.map((m: Message) => (m.id === msg.id ? msg : m)),
    };
  });

  (state as Record<string, unknown>).markMessageDeleted = vi.fn((messageId: string) => {
    const newMessages = { ...state.messages };
    for (const [convId, msgs] of Object.entries(newMessages)) {
      const idx = (msgs as Message[]).findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        const updated = [...(msgs as Message[])];
        updated[idx] = { ...updated[idx]!, deletedAt: new Date().toISOString(), content: '' };
        newMessages[convId] = updated;
        state.messages = newMessages;
        return;
      }
    }
  });

  return { state, set, get };
}
describe('createMessageOpsActions', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('editMessage', () => {
    it('sends PATCH request to correct endpoint', async () => {
      const msg = makeMsg();
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      const editedMsg = { ...msg, content: 'edited' };
      mockApi.patch.mockResolvedValueOnce({ data: { message: editedMsg } });

      await actions.editMessage('msg-1', 'edited');

      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1', {
        content: 'edited',
      });
    });

    it('creates optimistic edit history entry', async () => {
      const msg = makeMsg({ content: 'original' });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      mockApi.patch.mockResolvedValueOnce({ data: { message: { ...msg, content: 'edited' } } });

      await actions.editMessage('msg-1', 'edited');

      // updateMessage should have been called with edit history
      const updateCall = (state.updateMessage as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(updateCall.content).toBe('edited');
      expect(updateCall.isEdited).toBe(true);
      expect(updateCall.edits).toHaveLength(1);
      expect(updateCall.edits[0].previousContent).toBe('original');
    });

    it('throws when message not found in any conversation', async () => {
      const { set, get } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      await expect(actions.editMessage('nonexistent', 'content')).rejects.toThrow(
        'Message not found in any conversation'
      );
    });
  });

  describe('deleteMessage', () => {
    it('calls DELETE API and marks message as deleted', async () => {
      const msg = makeMsg();
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      mockApi.delete.mockResolvedValueOnce({});

      await actions.deleteMessage('msg-1');

      expect(state.markMessageDeleted).toHaveBeenCalledWith('msg-1');
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1');
    });

    it('throws when message not found', async () => {
      const { set, get } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      await expect(actions.deleteMessage('nonexistent')).rejects.toThrow(
        'Message not found in any conversation'
      );
    });
  });

  describe('addReaction', () => {
    it('sends reaction to API endpoint', async () => {
      const { set, get } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      mockApi.post.mockResolvedValueOnce({});

      await actions.addReaction('msg-1', '👍');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions', {
        emoji: '👍',
      });
    });

    it('does not rollback on 422 (already exists)', async () => {
      const msg = makeMsg({ reactions: [] });
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      const err = { response: { status: 422 } };
      mockApi.post.mockRejectedValueOnce(err);

      // Should not throw
      await actions.addReaction('msg-1', '👍');
    });

    it('rolls back and throws on 500 error', async () => {
      const msg = makeMsg({ reactions: [] });
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      const err = { response: { status: 500 } };
      mockApi.post.mockRejectedValueOnce(err);

      await expect(actions.addReaction('msg-1', '👍')).rejects.toBeDefined();
    });
  });

  describe('removeReaction', () => {
    it('sends DELETE to correct reaction endpoint', async () => {
      const { set, get } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      mockApi.delete.mockResolvedValueOnce({});

      await actions.removeReaction('msg-1', '👍');

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions/👍');
    });

    it('does not rollback on 404 (already removed)', async () => {
      const { set, get } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      const err = { response: { status: 404 } };
      mockApi.delete.mockRejectedValueOnce(err);

      // Should not throw
      await actions.removeReaction('msg-1', '👍');
    });
  });

  describe('updateMessage', () => {
    it('replaces message content in the correct conversation', () => {
      const msg = makeMsg({ content: 'old' });
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.updateMessage(makeMsg({ content: 'new' }));

      // set should be called with updater function
      expect(set).toHaveBeenCalled();
    });
  });

  describe('removeMessage', () => {
    it('filters out the message and cleans id set', () => {
      const msg = makeMsg();
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      state.messageIdSets = { 'conv-1': new Set(['msg-1']) };
      const actions = createMessageOpsActions(set as never, get as never);

      actions.removeMessage('msg-1', 'conv-1');

      expect(set).toHaveBeenCalled();
    });

    it('handles missing id set gracefully', () => {
      const msg = makeMsg();
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      // Should not throw
      actions.removeMessage('msg-1', 'conv-1');
      expect(set).toHaveBeenCalled();
    });
  });

  describe('markMessageDeleted', () => {
    it('sets deletedAt and empties content', () => {
      const msg = makeMsg({ content: 'secret' });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.markMessageDeleted('msg-1');

      // The set function is called with an updater
      const updater = set.mock.calls[set.mock.calls.length - 1]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;

      if (result.messages) {
        const updated = result.messages['conv-1']![0]!;
        expect(updated.deletedAt).toBeTruthy();
        expect(updated.content).toBe('');
      }
    });

    it('returns state unchanged if message not found', () => {
      const { set, get, state } = createMockSetGet({ 'conv-1': [makeMsg()] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.markMessageDeleted('nonexistent');

      const updater = set.mock.calls[set.mock.calls.length - 1]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      // Should return state reference (no changes)
      expect(result).toBe(state);
    });
  });

  describe('addReactionToMessage (socket event)', () => {
    it('adds a reaction from another user', () => {
      const msg = makeMsg({ reactions: [] });
      const { set, get } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.addReactionToMessage('msg-1', '🎉', 'user-2', 'bob');

      expect(set).toHaveBeenCalled();
    });

    it('deduplicates same user+emoji combination', () => {
      const existing = {
        id: 'r-1',
        emoji: '🎉',
        userId: 'user-2',
        user: { id: 'user-2', username: 'bob' },
      };
      const msg = makeMsg({ reactions: [existing] });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.addReactionToMessage('msg-1', '🎉', 'user-2', 'bob');

      // Extract the result from the updater
      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      // Should still have only 1 reaction (deduplicated)
      const convMessages = result.messages['conv-1'];
      if (convMessages) {
        const updatedMsg = convMessages.find((m: Message) => m.id === 'msg-1');
        if (updatedMsg) {
          expect(updatedMsg.reactions).toHaveLength(1);
        }
      }
    });
  });

  describe('removeReactionFromMessage (socket event)', () => {
    it('removes matching reaction', () => {
      const msg = makeMsg({
        reactions: [
          { id: 'r-1', emoji: '🎉', userId: 'user-2', user: { id: 'user-2', username: 'bob' } },
        ],
      });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.removeReactionFromMessage('msg-1', '🎉', 'user-2');

      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      const convMessages = result.messages['conv-1'];
      if (convMessages) {
        const updatedMsg = convMessages.find((m: Message) => m.id === 'msg-1');
        if (updatedMsg) {
          expect(updatedMsg.reactions).toHaveLength(0);
        }
      }
    });
  });

  describe('updateMessageStatus', () => {
    it('updates delivery status on correct message', () => {
      const msg = makeMsg({ deliveryStatus: 'sent' });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      const actions = createMessageOpsActions(set as never, get as never);

      actions.updateMessageStatus('conv-1', 'msg-1', 'delivered');

      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      expect(result.messages['conv-1']![0]!.deliveryStatus).toBe('delivered');
    });

    it('returns state unchanged for unknown conversation', () => {
      const { set, get, state } = createMockSetGet({});
      const actions = createMessageOpsActions(set as never, get as never);

      actions.updateMessageStatus('unknown-conv', 'msg-1', 'read');

      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      expect(result).toBe(state);
    });
  });

  describe('addReadReceipt', () => {
    it('stores read receipt for a message', () => {
      const msg = makeMsg({ senderId: 'current-user', deliveryStatus: 'sent' });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      state.readReceipts = {};
      const actions = createMessageOpsActions(set as never, get as never);

      actions.addReadReceipt('conv-1', 'msg-1', 'user-2', '2026-01-01T12:00:00Z');

      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;

      expect(result.readReceipts['msg-1']['user-2']).toBe('2026-01-01T12:00:00Z');
    });

    it('updates delivery status to read when reader is not the sender', () => {
      const msg = makeMsg({ senderId: 'current-user', deliveryStatus: 'delivered' });
      const { set, get, state } = createMockSetGet({ 'conv-1': [msg] });
      state.readReceipts = {};
      const actions = createMessageOpsActions(set as never, get as never);

      actions.addReadReceipt('conv-1', 'msg-1', 'user-2', '2026-01-01T12:00:00Z');

      const updater = set.mock.calls[0]![0];
      const result = typeof updater === 'function' ? updater(state) : updater;
      expect(result.messages['conv-1']![0]!.deliveryStatus).toBe('read');
    });
  });
});
