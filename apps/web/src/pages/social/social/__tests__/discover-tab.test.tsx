import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
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

const defaultProps: ComponentProps<typeof DiscoverTab> = {
  searchQuery: 'design',
  searchResults: [groupResult],
  hasMore: false,
  hasSearched: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  onSearchChange: vi.fn(),
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onJoinGroup: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  joiningGroupId: null,
};

function renderDiscover(overrides: Partial<ComponentProps<typeof DiscoverTab>> = {}) {
  return render(
    <MemoryRouter>
      <DiscoverTab {...defaultProps} {...overrides} />
    </MemoryRouter>
  );
}

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

    renderDiscover({ onJoinGroup });

    fireEvent.click(screen.getByRole('button', { name: 'Join Design Guild' }));

    expect(onJoinGroup).toHaveBeenCalledWith(groupResult);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps joined group results as route-open entries', () => {
    const onJoinGroup = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    renderDiscover({
      searchResults: [{ ...groupResult, isJoined: true }],
      onJoinGroup,
    });

    expect(screen.getByRole('link', { name: 'Open Design Guild' })).toHaveAttribute(
      'href',
      '/groups/group-1/channels/channel-1'
    );
    expect(onJoinGroup).not.toHaveBeenCalled();
  });

  it('loads more discover results through the provided search action', () => {
    const onLoadMore = vi.fn();

    renderDiscover({ hasMore: true, onLoadMore });

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

    renderDiscover({ searchQuery: 'alice', searchResults: [userResult] });

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(navigate).toHaveBeenCalledWith('/social/friends');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('routes backend incoming user status to the request center', () => {
    renderDiscover({
      searchQuery: 'alice',
      searchResults: [{ ...userResult, friendshipStatus: 'pending_received' }],
    });

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

    renderDiscover({ searchQuery: 'alice', searchResults: [userResult] });

    expect(screen.getByRole('button', { name: 'Pending' })).toBeDisabled();
  });

  it('keeps resolved outgoing user status as a disabled Pending action', () => {
    renderDiscover({
      searchQuery: 'alice',
      searchResults: [{ ...userResult, friendshipStatus: 'pending_sent' }],
    });

    expect(screen.getByRole('button', { name: 'Pending' })).toBeDisabled();
  });

  it('renders minimum-query guidance and forwards search changes', () => {
    const onSearchChange = vi.fn();

    renderDiscover({
      searchQuery: 'a',
      searchResults: [],
      hasSearched: false,
      onSearchChange,
    });

    expect(screen.getByText('Keep typing')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'alice' } });
    expect(onSearchChange).toHaveBeenCalledWith('alice');
  });

  it('shows stable skeleton rows while a search is loading', () => {
    renderDiscover({
      searchQuery: 'alice',
      searchResults: [],
      hasSearched: false,
      isLoading: true,
    });

    const loadingState = screen.getByRole('status', { name: 'Searching' });
    expect(loadingState.querySelectorAll('.cgraph-list-row')).toHaveLength(4);
  });

  it('shows search failures with an explicit retry action', () => {
    const onRetry = vi.fn();

    renderDiscover({
      searchQuery: 'alice',
      searchResults: [],
      error: 'Search is temporarily unavailable.',
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Search is temporarily unavailable.');
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows friend-request failures instead of swallowing them', async () => {
    sendRequest.mockRejectedValueOnce(new Error('offline'));

    renderDiscover({ searchQuery: 'alice', searchResults: [userResult] });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not send a friend request to Alice Example.'
      );
    });
  });
});
