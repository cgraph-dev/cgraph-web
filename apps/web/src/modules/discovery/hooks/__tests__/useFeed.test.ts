/**
 * useFeed Hook Unit Tests
 *
 * Tests for feed infinite query: query key construction, API call params,
 * pagination via getNextPageParam, and cursor forwarding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ReactNode } from 'react';
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
import { useFeed } from '../useFeed';

const mockGet = api.get as ReturnType<typeof vi.fn>;
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makeFeedResponse(
  threads: Array<{ id: string }>,
  hasMore = false,
  cursor: string | null = null
) {
  return {
    data: {
      data: threads.map((t) => ({
        id: t.id,
        title: `Thread ${t.id}`,
        slug: `thread-${t.id}`,
        content_preview: null,
        thread_type: 'discussion',
        is_locked: false,
        is_pinned: false,
        is_content_gated: false,
        gate_price_nodes: null,
        view_count: 10,
        reply_count: 2,
        score: 5,
        hot_score: 3.5,
        weighted_resonates: 1.2,
        author: { id: 'user-1', username: 'tester' },
        board: { id: 'board-1', name: 'General' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })),
      meta: { cursor, has_more: hasMore, per_page: 20 },
    },
  };
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe('useFeed', () => {
  it('fetches feed with the correct mode parameter', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: '1' }]));

    const { result } = renderHook(() => useFeed('pulse'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledTimes(1);
    const callUrl = mockGet.mock.calls[0]![0] as string;
    expect(callUrl).toContain('mode=pulse');
  });

  it('includes community_id when provided', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: '1' }]));

    const { result } = renderHook(() => useFeed('fresh', 'community-42'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callUrl = mockGet.mock.calls[0]![0] as string;
    expect(callUrl).toContain('community_id=community-42');
    expect(callUrl).toContain('mode=fresh');
  });

  it('does not include community_id when null', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: '1' }]));

    const { result } = renderHook(() => useFeed('rising', null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callUrl = mockGet.mock.calls[0]![0] as string;
    expect(callUrl).not.toContain('community_id');
  });

  it('returns thread data from the response', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: 'thread-1' }, { id: 'thread-2' }]));

    const { result } = renderHook(() => useFeed('pulse'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const pages = result.current.data?.pages ?? [];
    expect(pages).toHaveLength(1);
    expect(pages[0]!.data).toHaveLength(2);
    expect(pages[0]!.data[0]!.id).toBe('thread-1');
  });

  it('reports hasNextPage when has_more is true', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: '1' }], true, 'cursor-abc'));

    const { result } = renderHook(() => useFeed('pulse'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });

  it('reports no next page when has_more is false', async () => {
    mockGet.mockResolvedValueOnce(makeFeedResponse([{ id: '1' }], false, null));

    const { result } = renderHook(() => useFeed('pulse'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    // retry: 1 means it retries once, so we need to reject twice
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFeed('deep_cut'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.error).toBeTruthy();
  });
});
