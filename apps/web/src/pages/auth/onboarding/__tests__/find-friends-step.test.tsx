import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSearchResult } from '@/modules/social/hooks/useUserSearch';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { FindFriendsStep } from '../find-friends-step';

const mocks = vi.hoisted(() => ({
  currentUserId: 'self-user',
  results: [] as UserSearchResult[],
  searchError: null as string | null,
  friends: [] as Friend[],
  pendingRequests: [] as FriendRequest[],
  sentRequests: [] as FriendRequest[],
  friendError: null as string | null,
  sendRequest: vi.fn(),
  fetchFriends: vi.fn(),
  fetchPendingRequests: vi.fn(),
  fetchSentRequests: vi.fn(),
}));

vi.mock('@/modules/social/hooks/useUserSearch', () => ({
  useUserSearch: () => ({
    results: mocks.results,
    isLoading: false,
    error: mocks.searchError,
  }),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: () => ({
    friends: mocks.friends,
    pendingRequests: mocks.pendingRequests,
    sentRequests: mocks.sentRequests,
    error: mocks.friendError,
    sendRequest: mocks.sendRequest,
    fetchFriends: mocks.fetchFriends,
    fetchPendingRequests: mocks.fetchPendingRequests,
    fetchSentRequests: mocks.fetchSentRequests,
  }),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: mocks.currentUserId } }),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

const alice: UserSearchResult = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  username: 'alice',
  display_name: 'Alice Example',
  avatar_url: null,
  status: 'online',
};

function requestFrom(user: UserSearchResult): FriendRequest {
  return { user: { id: user.id } } as FriendRequest;
}

function friendFrom(user: UserSearchResult): Friend {
  return { id: user.id } as Friend;
}

describe('FindFriendsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUserId = 'self-user';
    mocks.results = [];
    mocks.searchError = null;
    mocks.friends = [];
    mocks.pendingRequests = [];
    mocks.sentRequests = [];
    mocks.friendError = null;
    mocks.sendRequest.mockResolvedValue(undefined);
    mocks.fetchFriends.mockResolvedValue(undefined);
    mocks.fetchPendingRequests.mockResolvedValue(undefined);
    mocks.fetchSentRequests.mockResolvedValue(undefined);
  });

  it('hydrates friendship state and sends a discovered UUID through the friend store', async () => {
    mocks.results = [alice];
    mocks.sendRequest.mockImplementationOnce(async () => {
      mocks.sentRequests = [requestFrom(alice)];
    });
    const user = userEvent.setup();

    render(<FindFriendsStep />);

    await waitFor(() => {
      expect(mocks.fetchFriends).toHaveBeenCalledTimes(1);
      expect(mocks.fetchPendingRequests).toHaveBeenCalledTimes(1);
      expect(mocks.fetchSentRequests).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Add Friend' }));

    expect(mocks.sendRequest).toHaveBeenCalledWith(alice.id);
    expect(screen.getByRole('button', { name: 'Request Sent' })).toBeDisabled();
  });

  it('shows a failed request and leaves the action available for retry', async () => {
    mocks.results = [alice];
    mocks.sendRequest.mockRejectedValueOnce(new Error('Please wait before trying again.'));
    const user = userEvent.setup();

    render(<FindFriendsStep />);
    await user.click(screen.getByRole('button', { name: 'Add Friend' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please wait before trying again.');
    expect(screen.getByRole('button', { name: 'Add Friend' })).toBeEnabled();
  });

  it('handles friendship hydration failure without an unhandled rejection', async () => {
    mocks.fetchFriends.mockRejectedValueOnce(new Error('Network unavailable'));

    render(<FindFriendsStep />);

    await waitFor(() => expect(mocks.fetchFriends).toHaveBeenCalledTimes(1));
    expect(screen.getByPlaceholderText('Search by username or name…')).toBeEnabled();
  });

  it('renders self, connected, incoming, outgoing, and blocked states without duplicate writes', () => {
    const self = { ...alice, id: 'self-user', username: 'self' };
    const connected = { ...alice, id: 'connected-user', username: 'connected' };
    const incoming = { ...alice, id: 'incoming-user', username: 'incoming' };
    const outgoing = { ...alice, id: 'outgoing-user', username: 'outgoing' };
    const blocked = {
      ...alice,
      id: 'blocked-user',
      username: 'blocked',
      friendship_status: 'friends',
      is_blocked: true,
    } satisfies UserSearchResult;
    mocks.results = [self, connected, incoming, outgoing, blocked];
    mocks.friends = [friendFrom(connected)];
    mocks.pendingRequests = [requestFrom(incoming)];
    mocks.sentRequests = [requestFrom(outgoing)];

    render(<FindFriendsStep />);

    expect(screen.getByRole('button', { name: 'You' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Connected' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Request Received' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Request Sent' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Blocked' })).toBeDisabled();
    expect(mocks.sendRequest).not.toHaveBeenCalled();
  });
});
