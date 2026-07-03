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

function renderSidebar(onAddFriend = vi.fn()) {
  render(
    <ConversationSidebar
      conversations={[]}
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
});
