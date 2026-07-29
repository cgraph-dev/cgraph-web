import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockGet, mockPost, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}));

vi.mock('@/shared/components/ui', async () => {
  const [alert, badge, button, card, input] = await Promise.all([
    vi.importActual<typeof import('@/components/ui/alert')>('@/components/ui/alert'),
    vi.importActual<typeof import('@/components/ui/badge')>('@/components/ui/badge'),
    vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button'),
    vi.importActual<typeof import('@/components/ui/card')>('@/components/ui/card'),
    vi.importActual<typeof import('@/components/ui/input')>('@/components/ui/input'),
  ]);
  return {
    ...alert,
    Badge: badge.default,
    ...button,
    Card: card.default,
    ...input,
    toast: {
      error: mockToastError,
      success: mockToastSuccess,
    },
  };
});

import WarningPanel from '../warning-panel';

const warning = {
  id: 'warning-1',
  reason: 'Repeated spam',
  points: 6,
  expires_at: '2026-08-05T12:00:00Z',
  acknowledged: false,
  revoked: false,
  issued_by_id: 'moderator-1',
  inserted_at: '2026-07-29T12:00:00Z',
};

describe('WarningPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      data: {
        data: [warning],
        total_points: 6,
      },
    });
    mockPost.mockResolvedValue({ data: { data: warning } });
  });

  it('loads an encoded user ID and presents the threshold through shared materials', async () => {
    render(<WarningPanel forumId="forum-1" />);

    fireEvent.change(screen.getByLabelText('User ID'), { target: { value: ' user/a ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        '/api/v1/forums/forum-1/moderation/warnings?user_id=user%2Fa'
      )
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Active warning points: 6');
    expect(screen.getByRole('alert')).toHaveTextContent('Temporary ban threshold (7 days)');
    expect(screen.getByText('Repeated spam').closest('[data-cgraph-surface="card"]')).not.toBeNull();
    expect(screen.getByText('6 points')).toBeInTheDocument();
  });

  it('submits normalized warning data and refreshes history before leaving the busy state', async () => {
    render(<WarningPanel forumId="forum-2" />);

    fireEvent.change(screen.getByLabelText('User ID'), { target: { value: ' user-2 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText(/^Reason/), { target: { value: '  Abuse  ' } });
    fireEvent.change(screen.getByLabelText('Points (1–5)'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Issue Warning' }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/api/v1/forums/forum-2/moderation/warn', {
        user_id: 'user-2',
        reason: 'Abuse',
        points: 4,
      })
    );
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    expect(mockToastSuccess).toHaveBeenCalledWith('Warning issued');
    expect(screen.getByLabelText(/^Reason/)).toHaveValue('');
    expect(screen.getByLabelText('Points (1–5)')).toHaveValue(1);
  });

  it('shows a stable empty state after a successful lookup with no warnings', async () => {
    mockGet.mockResolvedValue({ data: { data: [], total_points: 0 } });
    render(<WarningPanel forumId="forum-3" />);

    fireEvent.change(screen.getByLabelText('User ID'), { target: { value: 'user-3' } });
    fireEvent.keyDown(screen.getByLabelText('User ID'), { key: 'Enter' });

    expect(await screen.findByText('No warning history')).toBeInTheDocument();
    expect(screen.getByText('This user has no forum warnings.')).toBeInTheDocument();
  });

  it('reports lookup failures without replacing existing moderation data', async () => {
    mockGet.mockRejectedValue(new Error('offline'));
    render(<WarningPanel forumId="forum-4" />);

    fireEvent.change(screen.getByLabelText('User ID'), { target: { value: 'user-4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Failed to load warnings'));
    expect(screen.queryByText('No warning history')).not.toBeInTheDocument();
  });
});
