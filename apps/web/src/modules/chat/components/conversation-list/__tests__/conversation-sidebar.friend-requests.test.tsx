import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConversationSidebar } from '../conversation-sidebar';

const { friendState } = vi.hoisted(() => ({
  friendState: {
    pendingRequests: [
      {
        id: 'request-incoming-1',
        type: 'incoming' as const,
        createdAt: '2026-06-29T10:00:00.000Z',
        user: {
          id: 'user-alice',
          username: 'alice',
          displayName: 'Alice',
          avatarUrl: null,
        },
      },
    ],
    sentRequests: [
      {
        id: 'request-outgoing-1',
        type: 'outgoing' as const,
        createdAt: '2026-06-29T09:30:00.000Z',
        user: {
          id: 'user-bob',
          username: 'bob',
          displayName: 'Bob',
          avatarUrl: null,
        },
      },
    ],
    isLoading: false,
    error: null,
    fetchPendingRequests: vi.fn(() => Promise.resolve()),
    fetchSentRequests: vi.fn(() => Promise.resolve()),
    acceptRequest: vi.fn(() => Promise.resolve()),
    declineRequest: vi.fn(() => Promise.resolve()),
    removeFriend: vi.fn(() => Promise.resolve()),
    clearError: vi.fn(),
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  formatTimeAgo: () => 'just now',
  getAvatarBorderId: () => null,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt?: string }) => <div data-testid="request-avatar">{alt}</div>,
}));

vi.mock('@/shared/components/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: (selector: (state: typeof friendState) => unknown) => selector(friendState),
}));

function renderSidebar() {
  return render(
    <ConversationSidebar
      conversations={[]}
      currentUserId="current-user"
      onlineStatus={{}}
      searchQuery=""
      isLoading={false}
      onSearchChange={vi.fn()}
      onOpenSearch={vi.fn()}
      onAddFriend={vi.fn()}
      onNewConversation={vi.fn()}
      onMarkAsRead={vi.fn()}
      onMarkAsUnread={vi.fn()}
      onArchive={vi.fn()}
      onUnarchive={vi.fn()}
      onPin={vi.fn()}
      onMute={vi.fn()}
      spaces={[]}
      onToggleSpace={vi.fn()}
      showArchived={false}
      onShowArchivedChange={vi.fn()}
    />
  );
}

describe('ConversationSidebar friend requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows incoming and sent friend requests from the messages sidebar', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await waitFor(() => expect(friendState.fetchPendingRequests).toHaveBeenCalled());
    await waitFor(() => expect(friendState.fetchSentRequests).toHaveBeenCalled());

    const requestsButton = screen.getByRole('button', { name: /friend requests, 2 requests/i });
    await user.click(requestsButton);

    expect(screen.getByRole('region', { name: /friend requests/i })).toBeInTheDocument();
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /accept/i }));
    expect(friendState.acceptRequest).toHaveBeenCalledWith('request-incoming-1');

    await user.click(screen.getByRole('button', { name: /decline/i }));
    expect(friendState.declineRequest).toHaveBeenCalledWith('request-incoming-1');

    await user.click(screen.getByRole('button', { name: /cancel request/i }));
    expect(friendState.removeFriend).toHaveBeenCalledWith('request-outgoing-1');
  });

  it('keeps the request count visible before opening the panel', () => {
    renderSidebar();

    const requestsButton = screen.getByRole('button', { name: /friend requests, 2 requests/i });
    expect(within(requestsButton).getByText('2')).toBeInTheDocument();
  });
});
