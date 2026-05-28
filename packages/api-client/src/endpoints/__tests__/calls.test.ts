import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';

import { createCallsEndpoints } from '../calls';

describe('createCallsEndpoints', () => {
  it('normalizes the backend call-history envelope without dropping missed-call truth', async () => {
    const get = vi.fn().mockResolvedValue({
      status: 200,
      data: {
        data: [
          {
            id: 'call-1',
            room_id: 'room-1',
            type: 'video',
            state: 'ended',
            creator_id: 'user-a',
            group_id: null,
            participant_ids: ['user-a', 'user-b'],
            max_participants: 2,
            started_at: '2026-05-28T00:00:00Z',
            ended_at: '2026-05-28T00:01:00Z',
            duration_seconds: 60,
            end_reason: 'missed',
            missed_seen: false,
            inserted_at: '2026-05-28T00:00:00Z',
          },
        ],
        meta: {
          cursor: 'next-cursor',
          has_more: true,
        },
      },
    });

    const calls = createCallsEndpoints({ get } as unknown as AxiosInstance);

    const result = await calls.getHistory({ limit: 1 });

    expect(get).toHaveBeenCalledWith('/api/v1/calls', { params: { limit: 1 } });
    expect(result).toMatchObject({
      ok: true,
      data: {
        cursor: 'next-cursor',
        has_more: true,
        calls: [
          {
            id: 'call-1',
            end_reason: 'missed',
            missed_seen: false,
          },
        ],
      },
      pageInfo: {
        has_next_page: true,
        end_cursor: 'next-cursor',
      },
    });
  });
});
