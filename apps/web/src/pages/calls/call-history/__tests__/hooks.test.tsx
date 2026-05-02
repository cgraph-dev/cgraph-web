import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mockGet,
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: <T,>(selector: (state: { user: { id: string } }) => T) =>
    selector({ user: { id: 'user-me' } }),
}));

import { normalizeCallHistory, useCallHistory } from '../hooks';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCallHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the real backend route and normalizes real call records', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 'call-1',
            type: 'video',
            state: 'ended',
            creator_id: 'user-me',
            participant_ids: ['user-me', 'user-other'],
            duration_seconds: 42,
            started_at: '2026-04-30T10:00:00Z',
            ended_at: '2026-04-30T10:00:42Z',
            inserted_at: '2026-04-30T09:59:58Z',
          },
        ],
      },
    });

    const { result } = renderHook(() => useCallHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('/api/v1/calls');
    expect(result.current.sections[0]?.calls[0]).toMatchObject({
      id: 'call-1',
      recipientId: 'user-other',
      recipientName: 'Call participant',
      type: 'video',
      direction: 'outgoing',
      duration: 42,
      timestamp: '2026-04-30T10:00:00Z',
    });
    expect(result.current.isEmpty).toBe(false);
  });

  it('does not return demo calls when the backend request fails', async () => {
    mockGet.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCallHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 3_000 });

    expect(result.current.sections).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });
});

describe('normalizeCallHistory', () => {
  it('maps missed group calls without inventing contact names', () => {
    expect(
      normalizeCallHistory(
        [
          {
            id: 'call-2',
            type: 'group_audio',
            state: 'missed',
            creator_id: 'user-other',
            group_id: 'group-1',
            participant_ids: ['user-me', 'user-other'],
            duration_seconds: null,
            inserted_at: '2026-04-30T11:00:00Z',
          },
        ],
        'user-me'
      )
    ).toEqual([
      {
        id: 'call-2',
        recipientId: 'user-other',
        recipientName: 'Group call',
        type: 'audio',
        direction: 'missed',
        duration: 0,
        timestamp: '2026-04-30T11:00:00Z',
      },
    ]);
  });
});
