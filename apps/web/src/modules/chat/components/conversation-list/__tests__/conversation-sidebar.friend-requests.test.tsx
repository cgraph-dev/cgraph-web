import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConversationSidebar } from '../conversation-sidebar';

const { friendState } = vi.hoisted(() => ({
  friendState: {
    pendingRequests: [{ id: 'request-incoming-1' }],
    sentRequests: [{ id: 'request-outgoing-1' }],
    fetchPendingRequests: vi.fn(() => Promise.resolve()),
    fetchSentRequests: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: (selector: (state: typeof friendState) => unknown) => selector(friendState),
}));

function renderSidebar(onAddFriend = vi.fn(), activeConversationId?: string) {
  return render(
    <ConversationSidebar
      conversations={[]}
      activeConversationId={activeConversationId}
      currentUserId="current-user"
      onlineStatus={{}}
      searchQuery=""
      isLoading={false}
      onSearchChange={vi.fn()}
      onOpenSearch={vi.fn()}
      onAddFriend={onAddFriend}
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

describe('ConversationSidebar friend request ownership', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the count visible and routes to the canonical center without a duplicate panel', async () => {
    const user = userEvent.setup();
    const onAddFriend = vi.fn();
    renderSidebar(onAddFriend);

    await waitFor(() => expect(friendState.fetchPendingRequests).toHaveBeenCalledOnce());
    await waitFor(() => expect(friendState.fetchSentRequests).toHaveBeenCalledOnce());

    const requestsButton = screen.getByRole('button', { name: /friend requests, 2 requests/i });
    expect(within(requestsButton).getByText('2')).toBeInTheDocument();

    await user.click(requestsButton);
    expect(onAddFriend).toHaveBeenCalledOnce();
    expect(screen.queryByRole('region', { name: /friend requests/i })).not.toBeInTheDocument();
  });

  it('fills the narrow viewport only when no conversation route is active', () => {
    renderSidebar();

    expect(screen.getByTestId('conversation-sidebar')).toHaveClass(
      'flex',
      'w-full',
      'lg:w-80',
    );
    expect(screen.getByTestId('conversation-sidebar')).not.toHaveClass('hidden');
  });

  it('leaves the narrow viewport when a conversation route is active', () => {
    renderSidebar(vi.fn(), 'conversation-1');

    expect(screen.getByTestId('conversation-sidebar')).toHaveClass(
      'hidden',
      'lg:flex',
      'lg:w-80',
    );
    expect(screen.getByTestId('conversation-sidebar')).not.toHaveClass('w-full');
  });

  it('keeps every header action in the same fixed control box', () => {
    renderSidebar();

    for (const name of [
      'Search messages',
      'Add friend',
      'Friend requests, 2 requests',
      'New conversation',
    ]) {
      expect(screen.getByRole('button', { name })).toHaveClass(
        'h-9',
        'min-h-9',
        'w-9',
        'min-w-9',
        'p-0',
      );
    }
  });

  it('uses the shared two-color search material', () => {
    renderSidebar();

    const input = screen.getByRole('textbox', { name: 'Search conversations' });
    expect(input.parentElement).toHaveClass('cgraph-search-field');
    expect(input.parentElement?.querySelector('.cgraph-search-icon')).toBeInTheDocument();
  });
});
