/**
 * Channel Thread Store Tests
 *
 * Tests for thread state management: open/close thread, send replies,
 * add replies, fetch reply counts, deduplication, and reset.
 */
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { useChannelThreadStore } from '../channelThreadStore';
import type { ChannelMessage } from '../group-types';

// --- Mock dependencies ---

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

import { api } from '@/lib/api-client';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
};

// --- Factory ---

function makeMessage(overrides: Partial<ChannelMessage> = {}): ChannelMessage {
  return {
    id: 'msg-1',
    channelId: 'ch-1',
    authorId: 'u-1',
    content: 'Hello',
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    author: { id: 'u-1', username: 'alice', displayName: 'Alice', avatarUrl: null, member: null },
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Tests ---

describe('channelThreadStore', () => {
  beforeEach(() => {
    useChannelThreadStore.getState().reset();
    vi.clearAllMocks();
  });

  it('starts with default state', () => {
    const state = useChannelThreadStore.getState();
    expect(state.activeThread).toBeNull();
    expect(state.activeChannelId).toBeNull();
    expect(state.threadReplies).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.hasMore).toBe(false);
    expect(state.replyCounts).toEqual({});
  });

  it('openThread sets active thread and fetches replies from res.data.data', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    const replies = [makeMessage({ id: 'reply-1', replyToId: 'parent-1' })];

    mockedApi.get.mockResolvedValueOnce({
      data: { data: replies, meta: { has_more: true } },
    });

    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const state = useChannelThreadStore.getState();
    expect(state.activeThread?.id).toBe('parent-1');
    expect(state.activeChannelId).toBe('ch-1');
    expect(state.threadReplies).toHaveLength(1);
    expect(state.hasMore).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('openThread falls back to res.data.replies', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    const replies = [makeMessage({ id: 'reply-1' })];

    mockedApi.get.mockResolvedValueOnce({
      data: { replies, meta: {} },
    });

    await useChannelThreadStore.getState().openThread('ch-1', parent);
    expect(useChannelThreadStore.getState().threadReplies).toHaveLength(1);
  });

  it('openThread handles API failure gracefully', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const state = useChannelThreadStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.threadReplies).toEqual([]);
  });

  it('closeThread clears all thread state', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    useChannelThreadStore.getState().closeThread();

    const state = useChannelThreadStore.getState();
    expect(state.activeThread).toBeNull();
    expect(state.activeChannelId).toBeNull();
    expect(state.threadReplies).toEqual([]);
  });

  it('sendThreadReply posts to API and appends reply', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const newReply = makeMessage({ id: 'reply-new', replyToId: 'parent-1' });
    mockedApi.post.mockResolvedValueOnce({ data: { data: newReply } });

    await useChannelThreadStore.getState().sendThreadReply('Hello thread');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/channels/ch-1/messages', {
      content: 'Hello thread',
      reply_to_id: 'parent-1',
    });
    const state = useChannelThreadStore.getState();
    expect(state.threadReplies).toHaveLength(1);
    expect(state.replyCounts['parent-1']).toBe(1);
  });

  it('sendThreadReply is a no-op without active thread', async () => {
    await useChannelThreadStore.getState().sendThreadReply('Orphan message');
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('sendThreadReply handles API failure without crashing', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    mockedApi.post.mockRejectedValueOnce(new Error('Server error'));
    await useChannelThreadStore.getState().sendThreadReply('Fail');

    expect(useChannelThreadStore.getState().threadReplies).toEqual([]);
  });

  it('addThreadReply appends reply matching the active thread', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const reply = makeMessage({ id: 'reply-ext', replyToId: 'parent-1' });
    useChannelThreadStore.getState().addThreadReply(reply);

    expect(useChannelThreadStore.getState().threadReplies).toHaveLength(1);
    expect(useChannelThreadStore.getState().replyCounts['parent-1']).toBe(1);
  });

  it('addThreadReply ignores replies for a different parent', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const unrelatedReply = makeMessage({ id: 'reply-x', replyToId: 'other-parent' });
    useChannelThreadStore.getState().addThreadReply(unrelatedReply);

    expect(useChannelThreadStore.getState().threadReplies).toEqual([]);
  });

  it('addThreadReply deduplicates replies by id', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    const reply = makeMessage({ id: 'reply-dup', replyToId: 'parent-1' });
    useChannelThreadStore.getState().addThreadReply(reply);
    useChannelThreadStore.getState().addThreadReply(reply);

    expect(useChannelThreadStore.getState().threadReplies).toHaveLength(1);
  });

  it('fetchReplyCounts stores counts from API', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { data: { 'msg-1': 5, 'msg-2': 12 } },
    });

    await useChannelThreadStore.getState().fetchReplyCounts('ch-1', ['msg-1', 'msg-2']);

    const state = useChannelThreadStore.getState();
    expect(state.replyCounts['msg-1']).toBe(5);
    expect(state.replyCounts['msg-2']).toBe(12);
  });

  it('fetchReplyCounts skips API call for empty messageIds', async () => {
    await useChannelThreadStore.getState().fetchReplyCounts('ch-1', []);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('fetchReplyCounts handles API failure gracefully', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('fail'));
    await useChannelThreadStore.getState().fetchReplyCounts('ch-1', ['msg-1']);
    // Should not throw, counts remain empty
    expect(useChannelThreadStore.getState().replyCounts).toEqual({});
  });

  it('reset clears all state back to defaults', async () => {
    const parent = makeMessage({ id: 'parent-1' });
    mockedApi.get.mockResolvedValueOnce({ data: { data: [makeMessage({ id: 'r-1' })] } });
    await useChannelThreadStore.getState().openThread('ch-1', parent);

    useChannelThreadStore.getState().reset();

    const state = useChannelThreadStore.getState();
    expect(state.activeThread).toBeNull();
    expect(state.threadReplies).toEqual([]);
    expect(state.replyCounts).toEqual({});
  });
});
