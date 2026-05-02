/**
 * useFrequencies Hook Unit Tests
 *
 * Tests for useTopics, useUserFrequencies, and useUpdateFrequencies hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ReactNode } from 'react';
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
import { useTopics, useUserFrequencies, useUpdateFrequencies } from '../useFrequencies';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const mockTopics = [
  { id: 'topic-1', name: 'Gaming', icon: 'G', slug: 'gaming' },
  { id: 'topic-2', name: 'Music', icon: 'M', slug: 'music' },
  { id: 'topic-3', name: 'Art', icon: 'A', slug: 'art' },
];

const mockFrequencies = [
  { topic_id: 'topic-1', weight: 80, topic: mockTopics[0] },
  { topic_id: 'topic-2', weight: 40, topic: mockTopics[1] },
];
beforeEach(() => {
  vi.clearAllMocks();
});
describe('useTopics', () => {
  it('fetches topics from the API', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockTopics } });

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTopics);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/topics');
  });

  it('handles API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUserFrequencies', () => {
  it('fetches user frequencies from the API', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockFrequencies } });

    const { result } = renderHook(() => useUserFrequencies(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFrequencies);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/frequencies');
  });

  it('handles empty frequency list', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });

    const { result } = renderHook(() => useUserFrequencies(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useUpdateFrequencies', () => {
  it('sends PUT request with frequency data', async () => {
    mockPut.mockResolvedValueOnce({ data: { ok: true } });

    const { result } = renderHook(() => useUpdateFrequencies(), { wrapper: createWrapper() });

    const payload = [
      { topic_id: 'topic-1', weight: 90 },
      { topic_id: 'topic-3', weight: 60 },
    ];

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(mockPut).toHaveBeenCalledWith('/api/v1/frequencies', { frequencies: payload });
  });

  it('invalidates queries on success', async () => {
    mockPut.mockResolvedValueOnce({ data: { ok: true } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }

    const { result } = renderHook(() => useUpdateFrequencies(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync([{ topic_id: 'topic-1', weight: 50 }]);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['discovery', 'frequencies'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed'] });
  });

  it('handles mutation errors', async () => {
    mockPut.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateFrequencies(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync([{ topic_id: 'topic-1', weight: 50 }]);
      })
    ).rejects.toThrow('Update failed');
  });
});
