import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMessageRequest } from '../use-message-request';

const messageRequestApi = vi.hoisted(() => ({
  get: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
  block: vi.fn(),
  blockAndReport: vi.fn(),
  unblock: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    messageRequests: messageRequestApi,
  },
}));

const CONVERSATION_ID = '8d83c7b0-285c-4c34-b2de-0af389c74713';

function requestPayload(
  status: 'pending' | 'blocked' = 'pending',
  reportedAsSpam = false
) {
  return {
    id: '3f56b2be-093a-4836-9858-290452c52b4d',
    conversation_id: CONVERSATION_ID,
    requester: {
      id: 'b35350d0-faf9-45de-8ff7-d010bd5ce3fb',
      username: 'ada',
      display_name: 'Ada Lovelace',
      avatar_url: null,
      is_verified: true,
    },
    status,
    shared_group_count: 2,
    auto_accepted: false,
    reported_as_spam: reportedAsSpam,
    inserted_at: '2026-07-03T12:00:00Z',
  };
}

function success(status: 'accepted' | 'rejected' | 'blocked', reported?: boolean) {
  return {
    ok: true,
    data: {
      conversation_id: CONVERSATION_ID,
      status,
      ...(reported === undefined ? {} : { reported }),
    },
  };
}

describe('useMessageRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageRequestApi.get.mockResolvedValue({
      ok: true,
      data: requestPayload(),
    });
  });

  it('loads validated requester details and gates the composer while pending', async () => {
    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));

    expect(result.current.status).toBe('loading');
    expect(result.current.blocksComposer).toBe(true);

    await waitFor(() => expect(result.current.status).toBe('pending'));

    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.details).toEqual({
      requesterName: 'Ada Lovelace',
      requesterAvatar: null,
      sharedGroupCount: 2,
      reportedAsSpam: false,
    });
  });

  it('uses cleared participant request state as accepted without loading request metadata', async () => {
    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID, null));

    await waitFor(() => expect(result.current.status).toBe('accepted'));

    expect(result.current.blocksComposer).toBe(false);
    expect(result.current.details).toBeNull();
    expect(messageRequestApi.get).not.toHaveBeenCalled();
  });

  it('restores a durable blocked request after a refresh', async () => {
    messageRequestApi.get.mockResolvedValue({
      ok: true,
      data: requestPayload('blocked'),
    });

    const { result } = renderHook(() =>
      useMessageRequest(CONVERSATION_ID, 'blocked')
    );

    await waitFor(() => expect(result.current.status).toBe('blocked'));

    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.details?.requesterName).toBe('Ada Lovelace');
  });

  it('fails closed if an installed legacy client returns the removed fallback shape', async () => {
    messageRequestApi.get.mockResolvedValue({
      ok: true,
      data: { status: 'accepted', conversation_id: CONVERSATION_ID },
    });

    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.error).toBe('Message request details are unavailable.');
  });

  it('does not advance state or report success when the API rejects an action', async () => {
    messageRequestApi.accept.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: 'action_failed', message: 'Could not accept request.' },
    });

    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));
    await waitFor(() => expect(result.current.status).toBe('pending'));

    let accepted = true;
    await act(async () => {
      accepted = await result.current.accept();
    });

    expect(accepted).toBe(false);
    expect(result.current.status).toBe('pending');
    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.error).toBe('Could not accept request.');
  });

  it('keeps blocked requests gated and restores the composer only after unblock succeeds', async () => {
    messageRequestApi.block.mockResolvedValue(success('blocked'));
    messageRequestApi.unblock.mockResolvedValue(success('accepted'));

    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));
    await waitFor(() => expect(result.current.status).toBe('pending'));

    await act(async () => {
      expect(await result.current.block()).toBe(true);
    });

    expect(result.current.status).toBe('blocked');
    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.details?.requesterName).toBe('Ada Lovelace');

    await act(async () => {
      expect(await result.current.unblock()).toBe(true);
    });

    expect(result.current.status).toBe('accepted');
    expect(result.current.blocksComposer).toBe(false);
    expect(result.current.details).toBeNull();
  });

  it('records report state and suppresses a duplicate action while one is running', async () => {
    let resolveBlock: ((value: ReturnType<typeof success>) => void) | undefined;
    messageRequestApi.blockAndReport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBlock = resolve;
        })
    );

    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));
    await waitFor(() => expect(result.current.status).toBe('pending'));

    let firstAction: Promise<boolean> | undefined;
    let duplicateResult = true;
    act(() => {
      firstAction = result.current.blockAndReport();
    });
    await act(async () => {
      duplicateResult = await result.current.blockAndReport();
    });

    expect(duplicateResult).toBe(false);
    expect(messageRequestApi.blockAndReport).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveBlock?.(success('blocked', true));
      await firstAction;
    });

    expect(result.current.status).toBe('blocked');
    expect(result.current.details?.reportedAsSpam).toBe(true);
  });

  it('fails closed on load errors and retries the request explicitly', async () => {
    messageRequestApi.get
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ ok: true, data: requestPayload() });

    const { result } = renderHook(() => useMessageRequest(CONVERSATION_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.blocksComposer).toBe(true);
    expect(result.current.error).toBe('Network unavailable');

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('pending'));
    expect(messageRequestApi.get).toHaveBeenCalledTimes(2);
  });
});
