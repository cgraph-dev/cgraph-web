import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Friend, FriendRequest } from '@/modules/social/store';
import { DiscoverTab } from '../discover-tab';
import type { SearchResult } from '../types';

const { navigate, sendRequest, friendStoreState } = vi.hoisted(() => ({
  navigate: vi.fn(),
  sendRequest: vi.fn(),
  friendStoreState: {
    friends: [] as Friend[],
    sentRequests: [] as FriendRequest[],
    pendingRequests: [] as FriendRequest[],
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/modules/social/store', () => ({
  useFriendStore: () => ({
    sendRequest,
    friends: friendStoreState.friends,
    sentRequests: friendStoreState.sentRequests,
    pendingRequests: friendStoreState.pendingRequests,
  }),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: { id: 'current-user' },
  }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const groupResult: SearchResult = {
  id: 'group-1',
  type: 'group',
  name: 'Design Guild',
  description: 'A real group',
  defaultChannelId: 'channel-1',
  memberCount: 42,
  isJoined: false,
};

const userResult: SearchResult = {
  id: 'user-1',
  type: 'user',
  name: 'Alice Example',
  description: '@alice',
  username: 'alice',
};

describe('DiscoverTab', () => {
  beforeEach(() => {
    navigate.mockClear();
    sendRequest.mockClear();
    sendRequest.mockResolvedValue(undefined);
    friendStoreState.friends = [];
    friendStoreState.sentRequests = [];
    friendStoreState.pendingRequests = [];
  });

  it('joins unjoined group results without treating Open as a fake action', () => {
    const onJoinGroup = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(
      <DiscoverTab
        searchQuery="design"
        searchResults={[groupResult]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={onJoinGroup}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Join Design Guild' }));

    expect(onJoinGroup).toHaveBeenCalledWith(groupResult);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps joined group results as route-open entries', () => {
    const onJoinGroup = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(
      <DiscoverTab
        searchQuery="design"
        searchResults={[{ ...groupResult, isJoined: true }]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={onJoinGroup}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByText('Design Guild'));

    expect(onJoinGroup).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/groups/group-1/channels/channel-1');
  });

  it('loads more discover results through the provided search action', () => {
    const onLoadMore = vi.fn();

    render(
      <DiscoverTab
        searchQuery="design"
        searchResults={[groupResult]}
        hasMore
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={onLoadMore}
        onJoinGroup={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('routes incoming user requests to the request center instead of sending again', () => {
    friendStoreState.pendingRequests = [
      {
        id: 'incoming-1',
        type: 'incoming',
        createdAt: '2026-07-09T00:00:00.000Z',
        user: { id: 'user-1', username: 'alice', displayName: 'Alice Example', avatarUrl: null },
      },
    ];

    render(
      <DiscoverTab
        searchQuery="alice"
        searchResults={[userResult]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(navigate).toHaveBeenCalledWith('/social/friends');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('routes backend incoming user status to the request center', () => {
    render(
      <DiscoverTab
        searchQuery="alice"
        searchResults={[{ ...userResult, friendshipStatus: 'pending_received' }]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(navigate).toHaveBeenCalledWith('/social/friends');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('keeps outgoing user requests as disabled Pending actions', () => {
    friendStoreState.sentRequests = [
      {
        id: 'sent-1',
        type: 'outgoing',
        createdAt: '2026-07-09T00:00:00.000Z',
        user: { id: 'user-1', username: 'alice', displayName: 'Alice Example', avatarUrl: null },
      },
    ];

    render(
      <DiscoverTab
        searchQuery="alice"
        searchResults={[userResult]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        joiningGroupId={null}
      />
    );

    expect(screen.getByRole('button', { name: 'Pending' })).toBeDisabled();
  });

  it('keeps backend outgoing user status as a disabled Pending action', () => {
    render(
      <DiscoverTab
        searchQuery="alice"
        searchResults={[{ ...userResult, friendRequestSent: true }]}
        hasMore={false}
        isLoadingMore={false}
        onSearchChange={vi.fn()}
        onLoadMore={vi.fn()}
        onJoinGroup={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        joiningGroupId={null}
      />
    );

    expect(screen.getByRole('button', { name: 'Pending' })).toBeDisabled();
  });
});
