/**
 * Thread Store Tests
 *
 * Tests for the thread/reply management store:
 * openThread, closeThread, fetchMoreReplies, sendThreadReply,
 * addThreadMessage, fetchReplyCounts, and reset.
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils', () => ({
  normalizeMessage: (m: unknown) => m,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
  }),
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
import { useThreadStore } from '../threadStore';
import type { Message } from '../chatStore.types';

const mockApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
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

function resetStore() {
  useThreadStore.setState({
    activeThread: null,
    activeConversationId: null,
    threadMessages: [],
    isLoading: false,
    hasMore: false,
    endCursor: null,
    replyCounts: {},
  });
}
describe('ThreadStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('starts with no active thread', () => {
      const s = useThreadStore.getState();
      expect(s.activeThread).toBeNull();
      expect(s.activeConversationId).toBeNull();
      expect(s.threadMessages).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.hasMore).toBe(false);
      expect(s.endCursor).toBeNull();
      expect(s.replyCounts).toEqual({});
    });
  });

  describe('openThread', () => {
    it('sets active thread and fetches replies', async () => {
      const rootMsg = makeMsg({ id: 'root-1' });
      const replies = [makeMsg({ id: 'reply-1', replyToId: 'root-1' })];

      mockApi.get.mockResolvedValueOnce({
        data: { data: replies, meta: { has_more: false, end_cursor: null } },
      });

      await useThreadStore.getState().openThread('conv-1', rootMsg);

      const s = useThreadStore.getState();
      expect(s.activeThread?.id).toBe('root-1');
      expect(s.activeConversationId).toBe('conv-1');
      expect(s.threadMessages).toHaveLength(1);
      expect(s.threadMessages[0]!.id).toBe('reply-1');
      expect(s.isLoading).toBe(false);
      expect(s.hasMore).toBe(false);
    });

    it('sets hasMore and endCursor for paginated responses', async () => {
      const rootMsg = makeMsg({ id: 'root-1' });
      const replies = Array.from({ length: 50 }, (_, i) =>
        makeMsg({ id: `reply-${i}`, replyToId: 'root-1' })
      );

      mockApi.get.mockResolvedValueOnce({
        data: { data: replies, meta: { has_more: true, end_cursor: 'cursor-50' } },
      });

      await useThreadStore.getState().openThread('conv-1', rootMsg);

      const s = useThreadStore.getState();
      expect(s.hasMore).toBe(true);
      expect(s.endCursor).toBe('cursor-50');
    });

    it('handles API error gracefully', async () => {
      const rootMsg = makeMsg({ id: 'root-1' });
      mockApi.get.mockRejectedValueOnce(new Error('network'));

      await useThreadStore.getState().openThread('conv-1', rootMsg);

      const s = useThreadStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.threadMessages).toEqual([]);
    });

    it('calls correct API endpoint with params', async () => {
      const rootMsg = makeMsg({ id: 'root-1' });
      mockApi.get.mockResolvedValueOnce({
        data: { data: [], meta: {} },
      });

      await useThreadStore.getState().openThread('conv-1', rootMsg);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1/messages/root-1/replies',
        { params: { limit: 50 } }
      );
    });
  });

  describe('closeThread', () => {
    it('resets all thread state', async () => {
      // First open a thread
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        threadMessages: [makeMsg({ id: 'reply-1' })],
        isLoading: false,
        hasMore: true,
        endCursor: 'cursor',
      });

      useThreadStore.getState().closeThread();

      const s = useThreadStore.getState();
      expect(s.activeThread).toBeNull();
      expect(s.activeConversationId).toBeNull();
      expect(s.threadMessages).toEqual([]);
      expect(s.hasMore).toBe(false);
      expect(s.endCursor).toBeNull();
    });
  });

  describe('fetchMoreReplies', () => {
    it('appends new replies to existing thread messages', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        threadMessages: [makeMsg({ id: 'reply-1' })],
        endCursor: 'cursor-1',
        hasMore: true,
      });

      const moreReplies = [makeMsg({ id: 'reply-2' })];
      mockApi.get.mockResolvedValueOnce({
        data: { data: moreReplies, meta: { has_more: false, end_cursor: null } },
      });

      await useThreadStore.getState().fetchMoreReplies();

      const s = useThreadStore.getState();
      expect(s.threadMessages).toHaveLength(2);
      expect(s.hasMore).toBe(false);
    });

    it('does nothing when no active thread', async () => {
      await useThreadStore.getState().fetchMoreReplies();
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('does nothing when already loading', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        isLoading: true,
      });

      await useThreadStore.getState().fetchMoreReplies();
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('passes cursor to API for pagination', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        endCursor: 'prev-cursor',
      });

      mockApi.get.mockResolvedValueOnce({
        data: { data: [], meta: {} },
      });

      await useThreadStore.getState().fetchMoreReplies();

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1/messages/root-1/replies',
        { params: { limit: 50, cursor: 'prev-cursor' } }
      );
    });
  });

  describe('sendThreadReply', () => {
    it('sends reply and adds to thread messages', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        threadMessages: [],
        replyCounts: {},
      });

      const replyMsg = makeMsg({ id: 'new-reply', replyToId: 'root-1' });
      mockApi.post.mockResolvedValueOnce({ data: { data: replyMsg } });

      await useThreadStore.getState().sendThreadReply('my reply');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages', {
        content: 'my reply',
        reply_to_id: 'root-1',
      });

      const s = useThreadStore.getState();
      expect(s.threadMessages).toHaveLength(1);
      expect(s.replyCounts['root-1']).toBe(1);
    });

    it('does nothing without active thread', async () => {
      await useThreadStore.getState().sendThreadReply('hello');
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('increments reply count on each reply', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        threadMessages: [],
        replyCounts: { 'root-1': 3 },
      });

      const replyMsg = makeMsg({ id: 'reply-new', replyToId: 'root-1' });
      mockApi.post.mockResolvedValueOnce({ data: { data: replyMsg } });

      await useThreadStore.getState().sendThreadReply('content');

      expect(useThreadStore.getState().replyCounts['root-1']).toBe(4);
    });

    it('handles API error without crashing', async () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
      });

      mockApi.post.mockRejectedValueOnce(new Error('fail'));

      // Should not throw
      await useThreadStore.getState().sendThreadReply('content');
    });
  });

  describe('addThreadMessage', () => {
    it('adds a message if it belongs to the active thread', () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        threadMessages: [],
        replyCounts: {},
      });

      const reply = makeMsg({ id: 'reply-socket', replyToId: 'root-1' });
      useThreadStore.getState().addThreadMessage(reply);

      const s = useThreadStore.getState();
      expect(s.threadMessages).toHaveLength(1);
      expect(s.replyCounts['root-1']).toBe(1);
    });

    it('ignores messages not belonging to active thread', () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        threadMessages: [],
      });

      const unrelated = makeMsg({ id: 'other', replyToId: 'different-root' });
      useThreadStore.getState().addThreadMessage(unrelated);

      expect(useThreadStore.getState().threadMessages).toHaveLength(0);
    });

    it('ignores when no active thread', () => {
      const reply = makeMsg({ id: 'reply', replyToId: 'root-1' });
      useThreadStore.getState().addThreadMessage(reply);

      expect(useThreadStore.getState().threadMessages).toHaveLength(0);
    });

    it('deduplicates messages by id', () => {
      const reply = makeMsg({ id: 'reply-1', replyToId: 'root-1' });
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        threadMessages: [reply],
        replyCounts: { 'root-1': 1 },
      });

      useThreadStore.getState().addThreadMessage(reply);

      // Should still have only 1 message
      expect(useThreadStore.getState().threadMessages).toHaveLength(1);
    });
  });

  describe('fetchReplyCounts', () => {
    it('fetches and merges reply counts', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { data: { 'msg-1': 5, 'msg-2': 3 } },
      });

      await useThreadStore.getState().fetchReplyCounts('conv-1', ['msg-1', 'msg-2']);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/thread-counts', {
        message_ids: ['msg-1', 'msg-2'],
      });
      expect(useThreadStore.getState().replyCounts).toEqual({ 'msg-1': 5, 'msg-2': 3 });
    });

    it('skips fetch for empty message IDs', async () => {
      await useThreadStore.getState().fetchReplyCounts('conv-1', []);
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('merges with existing counts', async () => {
      useThreadStore.setState({ replyCounts: { 'msg-existing': 10 } });

      mockApi.post.mockResolvedValueOnce({
        data: { data: { 'msg-new': 2 } },
      });

      await useThreadStore.getState().fetchReplyCounts('conv-1', ['msg-new']);

      const counts = useThreadStore.getState().replyCounts;
      expect(counts['msg-existing']).toBe(10);
      expect(counts['msg-new']).toBe(2);
    });

    it('silently handles API errors', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('fail'));

      // Should not throw
      await useThreadStore.getState().fetchReplyCounts('conv-1', ['msg-1']);
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      useThreadStore.setState({
        activeThread: makeMsg({ id: 'root-1' }),
        activeConversationId: 'conv-1',
        threadMessages: [makeMsg()],
        isLoading: true,
        hasMore: true,
        endCursor: 'cursor',
        replyCounts: { 'msg-1': 5 },
      });

      useThreadStore.getState().reset();

      const s = useThreadStore.getState();
      expect(s.activeThread).toBeNull();
      expect(s.activeConversationId).toBeNull();
      expect(s.threadMessages).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.hasMore).toBe(false);
      expect(s.endCursor).toBeNull();
      expect(s.replyCounts).toEqual({});
    });
  });
});
