import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import { AuditLogTab } from '../audit-log-tab';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: (name: string) => ({
      ...actual.createLogger(name),
      error: vi.fn(),
    }),
  };
});

const channelEntry = {
  id: 'event-1',
  action: 'channel_create',
  actor_id: 'user-alice',
  actor_username: 'Alice',
  target_user_id: null,
  changes: { name: 'announcements' },
  reason: null,
  created_at: '2026-07-29T00:00:00.000Z',
};

const memberEntry = {
  id: 'event-2',
  action: 'member_ban',
  actor_id: 'user-bob',
  actor_username: 'Bob',
  target_user_id: 'user-charlie',
  target_username: 'Charlie',
  changes: null,
  reason: 'Repeated spam',
  created_at: '2026-07-28T00:00:00.000Z',
};

describe('AuditLogTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads page_info and appends a deduplicated cursor page', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          data: [channelEntry],
          page_info: { has_next_page: true, end_cursor: 'cursor-2' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [channelEntry, memberEntry],
          page_info: { has_next_page: false, end_cursor: 'cursor-3' },
        },
      });

    render(<AuditLogTab groupId="group-1" />);

    expect(await screen.findByText('Channel Created')).toBeInTheDocument();
    expect(http.get).toHaveBeenNthCalledWith(1, '/api/v1/groups/group-1/audit-log', {
      params: { cursor: undefined, limit: 25 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Member Banned')).toBeInTheDocument();
    expect(http.get).toHaveBeenNthCalledWith(2, '/api/v1/groups/group-1/audit-log', {
      params: { cursor: 'cursor-2', limit: 25 },
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('filters the loaded event projection by search and action category', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        data: [channelEntry, memberEntry],
        page_info: { has_next_page: false, end_cursor: null },
      },
    });

    render(<AuditLogTab groupId="group-1" />);
    await screen.findByText('Channel Created');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search audit log' }), {
      target: { value: 'Alice' },
    });
    expect(screen.getByText('Channel Created')).toBeInTheDocument();
    expect(screen.queryByText('Member Banned')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search audit log' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show audit filters' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Members' }));

    const eventList = screen.getByRole('list');
    expect(within(eventList).getByText('Member Banned')).toBeInTheDocument();
    expect(within(eventList).queryByText('Channel Created')).not.toBeInTheDocument();
  });

  it('maps permission failures to explicit feedback without rendering stale controls', async () => {
    vi.mocked(http.get).mockRejectedValue({
      response: { status: 403, data: { error: 'Forbidden' } },
    });

    render(<AuditLogTab groupId="group-1" />);

    expect(
      await screen.findByText('You do not have permission to view this group audit log.')
    ).toHaveAttribute('role', 'alert');
    await waitFor(() => {
      expect(screen.getByText('No recent actions')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });
});
