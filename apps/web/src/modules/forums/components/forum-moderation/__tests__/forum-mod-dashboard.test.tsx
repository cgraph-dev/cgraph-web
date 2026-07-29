import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const {
  mockFetchQueue,
  mockTakeAction,
  mockFetchStats,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockFetchQueue: vi.fn(),
  mockTakeAction: vi.fn(),
  mockFetchStats: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('../../../store/use-forum-moderation-store', () => ({
  useForumModerationStore: () => ({
    fetchForumModQueue: mockFetchQueue,
    takeForumModAction: mockTakeAction,
    fetchForumModStats: mockFetchStats,
  }),
}));

vi.mock('../warning-panel', () => ({
  default: ({ forumId }: { forumId: string }) => <div>Warnings panel {forumId}</div>,
}));

vi.mock('../forum-automod-settings', () => ({
  default: ({ forumId }: { forumId: string }) => <div>Automod panel {forumId}</div>,
}));

vi.mock('@/shared/components/ui', async () => {
  const [alert, button, card, emptyState, skeleton, tabs] = await Promise.all([
    vi.importActual<typeof import('@/components/ui/alert')>('@/components/ui/alert'),
    vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button'),
    vi.importActual<typeof import('@/components/ui/card')>('@/components/ui/card'),
    vi.importActual<typeof import('@/components/ui/empty-state')>('@/components/ui/empty-state'),
    vi.importActual<typeof import('@/components/ui/skeleton')>('@/components/ui/skeleton'),
    vi.importActual<typeof import('@/components/ui/tabs')>('@/components/ui/tabs'),
  ]);
  return {
    ...alert,
    ...button,
    Card: card.default,
    EmptyState: emptyState.default,
    Skeleton: skeleton.default,
    ...tabs,
    toast: {
      error: mockToastError,
      success: mockToastSuccess,
    },
  };
});

import ForumModDashboard from '../forum-mod-dashboard';

const queueItem = {
  id: 'post-1',
  content: 'Review this post',
  reason: 'Reported',
  createdAt: '2026-07-29',
};

describe('ForumModDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchQueue.mockResolvedValue([queueItem]);
    mockTakeAction.mockResolvedValue(undefined);
    mockFetchStats.mockResolvedValue({ pending_count: 4, resolved_count: 9 });
  });

  it('loads the default queue and exposes one semantic four-tab owner', async () => {
    render(<ForumModDashboard forumId="forum-1" />);

    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Queue' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status', { name: 'Loading moderation queue' })).toBeInTheDocument();
    expect(await screen.findByText('Review this post')).toBeInTheDocument();
    expect(mockFetchQueue).toHaveBeenCalledWith('forum-1');
  });

  it('mounts the existing warning and automod owners only for their selected tabs', async () => {
    render(<ForumModDashboard forumId="forum-2" />);
    await screen.findByText('Review this post');

    fireEvent.click(screen.getByRole('tab', { name: 'Warnings' }));
    expect(screen.getByText('Warnings panel forum-2')).toBeInTheDocument();
    expect(screen.queryByText('Review this post')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Automod' }));
    expect(screen.getByText('Automod panel forum-2')).toBeInTheDocument();
  });

  it('runs an exact queue action once and removes only the resolved item', async () => {
    render(<ForumModDashboard forumId="forum-3" />);
    await screen.findByText('Review this post');

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(mockTakeAction).toHaveBeenCalledWith('forum-3', 'post-1', 'approve')
    );
    expect(await screen.findByText('Moderation queue is clear')).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith('Post approved');
  });

  it('keeps an item mounted and reports a failed moderation action', async () => {
    mockTakeAction.mockRejectedValue(new Error('denied'));
    render(<ForumModDashboard forumId="forum-4" />);
    await screen.findByText('Review this post');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Moderation action failed')
    );
    expect(screen.getByText('Review this post')).toBeInTheDocument();
  });

  it('shows a queue load failure and retries the same store method', async () => {
    mockFetchQueue
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    render(<ForumModDashboard forumId="forum-5" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Moderation queue unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Moderation queue is clear')).toBeInTheDocument();
    expect(mockFetchQueue).toHaveBeenCalledTimes(2);
    expect(mockFetchQueue).toHaveBeenLastCalledWith('forum-5');
  });

  it('normalizes missing statistics without changing valid counts', async () => {
    mockFetchStats.mockResolvedValue({ pending_count: 'invalid', resolved_count: 9 });
    render(<ForumModDashboard forumId="forum-6" />);
    await screen.findByText('Review this post');

    fireEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(
      screen.getByRole('status', { name: 'Loading moderation statistics' })
    ).toBeInTheDocument();

    expect(await screen.findByText('Pending items')).toBeInTheDocument();
    expect(screen.getByText('Pending items').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Resolved items').parentElement).toHaveTextContent('9');
    expect(mockFetchStats).toHaveBeenCalledWith('forum-6');
  });
});
