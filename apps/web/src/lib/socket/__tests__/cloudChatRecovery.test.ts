import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  getSyncMetadata: vi.fn(),
  setSyncMetadata: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.get,
  },
}));

vi.mock('@/lib/offline/indexeddb-cache', () => ({
  getSyncMetadata: mocks.getSyncMetadata,
  setSyncMetadata: mocks.setSyncMetadata,
}));

import {
  recoverCloudChatEvents,
  type CloudChatRecoveryProjection,
} from '../cloudChatRecovery';

function event(streamSeq: number, conversationId = 'conversation-1') {
  return {
    streamSeq,
    eventType: 'message.sent',
    aggregateType: 'message',
    aggregateId: `message-${streamSeq}`,
    payload: { conversation_id: conversationId },
    occurredAt: '2026-07-24T12:00:00Z',
  };
}

function response(events: unknown[], hasMore: boolean, nextStreamSeq: number) {
  return {
    data: {
      data: {
        stream: 'cloud_chat',
        events,
        hasMore,
        nextStreamSeq,
      },
    },
  };
}

function projection(activeConversationId: string | null = null): {
  projection: CloudChatRecoveryProjection;
  refreshConversations: ReturnType<typeof vi.fn>;
  refreshMessages: ReturnType<typeof vi.fn>;
} {
  const refreshConversations = vi.fn().mockResolvedValue(undefined);
  const refreshMessages = vi.fn().mockResolvedValue(undefined);

  return {
    projection: {
      getActiveConversationId: () => activeConversationId,
      refreshConversations,
      refreshMessages,
    },
    refreshConversations,
    refreshMessages,
  };
}

describe('Cloud Chat durable recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSyncMetadata.mockResolvedValue(null);
    mocks.setSyncMetadata.mockResolvedValue(undefined);
  });

  it('continues ordered pages and advances only with server-issued positions', async () => {
    mocks.get.mockResolvedValueOnce(response([event(4)], true, 4));
    mocks.get.mockResolvedValueOnce(response([event(5)], false, 5));
    const state = projection('conversation-1');

    await recoverCloudChatEvents('account-1', state.projection);

    expect(mocks.get).toHaveBeenNthCalledWith(
      1,
      '/api/v1/sync/cloud-chat/events?after_stream_seq=0&limit=200'
    );
    expect(mocks.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/sync/cloud-chat/events?after_stream_seq=4&limit=200'
    );
    expect(mocks.setSyncMetadata).toHaveBeenNthCalledWith(1, 'cloud_chat_event_cursor:account-1', '4');
    expect(mocks.setSyncMetadata).toHaveBeenNthCalledWith(2, 'cloud_chat_event_cursor:account-1', '5');
    expect(state.refreshConversations).toHaveBeenCalledTimes(2);
    expect(state.refreshMessages).toHaveBeenCalledWith('conversation-1');
  });

  it('uses the persisted account cursor after a relogin or browser restart', async () => {
    mocks.getSyncMetadata.mockResolvedValue('41');
    mocks.get.mockResolvedValueOnce(response([event(42, 'conversation-2')], false, 42));
    const state = projection();

    await recoverCloudChatEvents('account-1', state.projection);

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/sync/cloud-chat/events?after_stream_seq=41&limit=200'
    );
    expect(mocks.setSyncMetadata).toHaveBeenCalledWith('cloud_chat_event_cursor:account-1', '42');
    expect(state.refreshMessages).not.toHaveBeenCalled();
  });

  it('coalesces overlapping reconnect recovery for one account', async () => {
    let resolveResponse: ((value: ReturnType<typeof response>) => void) | undefined;
    mocks.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
    );
    const state = projection();

    const first = recoverCloudChatEvents('account-1', state.projection);
    const second = recoverCloudChatEvents('account-1', state.projection);

    expect(second).toBe(first);
    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    resolveResponse?.(response([], false, 0));
    await expect(first).resolves.toBeUndefined();
  });

  it('deduplicates affected conversation refreshes within one event page', async () => {
    mocks.get.mockResolvedValueOnce(response([event(1), event(2)], false, 2));
    const state = projection('conversation-1');

    await recoverCloudChatEvents('account-1', state.projection);

    expect(state.refreshConversations).toHaveBeenCalledTimes(1);
    expect(state.refreshMessages).toHaveBeenCalledTimes(1);
    expect(mocks.setSyncMetadata).toHaveBeenCalledWith('cloud_chat_event_cursor:account-1', '2');
  });

  it('does not advance when a projection refresh fails', async () => {
    mocks.get.mockResolvedValueOnce(response([event(1)], false, 1));
    const state = projection();
    state.refreshConversations.mockRejectedValueOnce(new Error('conversation refresh failed'));

    await expect(recoverCloudChatEvents('account-1', state.projection)).rejects.toThrow(
      'conversation refresh failed'
    );

    expect(mocks.setSyncMetadata).not.toHaveBeenCalled();
  });

  it('rejects a non-progressing server page without advancing the cursor', async () => {
    mocks.get.mockResolvedValueOnce(response([event(1)], true, 0));
    const state = projection();

    await expect(recoverCloudChatEvents('account-1', state.projection)).rejects.toThrow(
      'invalid next stream sequence'
    );

    expect(state.refreshConversations).not.toHaveBeenCalled();
    expect(mocks.setSyncMetadata).not.toHaveBeenCalled();
  });

  it('falls back to the stream origin when durable cursor data is malformed', async () => {
    mocks.getSyncMetadata.mockResolvedValue('not-a-cursor');
    mocks.get.mockResolvedValueOnce(response([], false, 0));

    await recoverCloudChatEvents('account-1', projection().projection);

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/sync/cloud-chat/events?after_stream_seq=0&limit=200'
    );
    expect(mocks.setSyncMetadata).not.toHaveBeenCalled();
  });
});
