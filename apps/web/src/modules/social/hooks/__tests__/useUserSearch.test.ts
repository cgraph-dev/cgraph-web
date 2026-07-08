/**
 * useUserSearch Hook Unit Tests
 *
 * Tests for the debounced user search hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock lodash.debounce to execute immediately for testing
vi.mock('lodash.debounce', () => ({
  default: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  },
}));

import { api } from '@/lib/api-client';
import {
  clearRateLimitScopes,
  rememberRateLimit,
  USER_API_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';
import { useUserSearch } from '../useUserSearch';

const mockApi = { get: api.get as ReturnType<typeof vi.fn> };

beforeEach(() => {
  clearRateLimitScopes([USER_API_RATE_LIMIT_SCOPE]);
  vi.clearAllMocks();
});

afterEach(() => {
  clearRateLimitScopes([USER_API_RATE_LIMIT_SCOPE]);
  vi.restoreAllMocks();
});

describe('useUserSearch', () => {
  it('returns empty results for empty query', () => {
    const { result } = renderHook(() => useUserSearch(''));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty results for single character query', () => {
    const { result } = renderHook(() => useUserSearch('a'));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('searches when query length >= 2', async () => {
    const mockUsers = [
      {
        id: 'u-1',
        username: 'alice',
        display_name: 'Alice',
        avatar_url: null,
        status: 'online',
      },
    ];

    mockApi.get.mockResolvedValueOnce({ data: { users: mockUsers } });

    const { result } = renderHook(() => useUserSearch('al'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/search/users', {
      params: { q: 'al' },
    });
    expect(result.current.results).toEqual(mockUsers);
  });

  it('handles API response with data array directly', async () => {
    const mockUsers = [
      { id: 'u-1', username: 'bob', display_name: null, avatar_url: null, status: 'offline' },
    ];

    mockApi.get.mockResolvedValueOnce({ data: mockUsers });

    const { result } = renderHook(() => useUserSearch('bo'));

    await waitFor(() => {
      expect(result.current.results).toEqual(mockUsers);
    });
  });

  it('preserves relationship flags returned by user search', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        users: [
          {
            id: 'u-1',
            username: 'alice',
            display_name: 'Alice',
            avatar_url: null,
            status: 'online',
            friendship_status: 'pending_received',
            is_friend: false,
            is_blocked: false,
            friend_request_sent: false,
            friend_request_received: true,
          },
        ],
      },
    });

    const { result } = renderHook(() => useUserSearch('al'));

    await waitFor(() => {
      expect(result.current.results[0]).toMatchObject({
        id: 'u-1',
        friendship_status: 'pending_received',
        is_friend: false,
        is_blocked: false,
        friend_request_sent: false,
        friend_request_received: true,
      });
    });
  });

  it('sets error on API failure', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserSearch('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to search users');
    expect(result.current.results).toEqual([]);
  });

  it('does not call search while the user API cooldown is active', async () => {
    rememberRateLimit([USER_API_RATE_LIMIT_SCOPE], {
      response: {
        status: 429,
        data: {
          error: {
            message: 'Too many requests. Please wait 18 seconds before retrying.',
            details: { retry_after_seconds: 18 },
          },
        },
      },
    });

    const { result } = renderHook(() => useUserSearch('al'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.get).not.toHaveBeenCalled();
    expect(result.current.error).toContain('Too many requests');
    expect(result.current.results).toEqual([]);
  });

  it('clears results when query is shortened below minimum', async () => {
    const mockUsers = [
      { id: 'u-1', username: 'alice', display_name: null, avatar_url: null, status: 'online' },
    ];

    mockApi.get.mockResolvedValueOnce({ data: { users: mockUsers } });

    const { result, rerender } = renderHook(({ query }) => useUserSearch(query), {
      initialProps: { query: 'al' },
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    // Shorten query below minimum
    rerender({ query: 'a' });

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles empty users response', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { users: [] } });

    const { result } = renderHook(() => useUserSearch('xyz'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toEqual([]);
  });
});
