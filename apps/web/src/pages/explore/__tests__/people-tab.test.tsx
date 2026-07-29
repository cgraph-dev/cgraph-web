import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Friend, FriendRequest } from '@/modules/social/store';
import type { UserSearchResult, UseUserSearchReturn } from '@/modules/social/hooks/useUserSearch';
import { PeopleTab } from '../tabs/people-tab';

const { navigate, friendStoreState, searchState } = vi.hoisted(() => ({
  navigate: vi.fn(),
  friendStoreState: {
    friends: [] as Friend[],
    sentRequests: [] as FriendRequest[],
    pendingRequests: [] as FriendRequest[],
    sendRequest: vi.fn(() => Promise.resolve()),
  },
  searchState: {
    results: [] as UserSearchResult[],
    isLoading: false,
    error: null as string | null,
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@/modules/social/hooks/useUserSearch', () => ({
  useUserSearch: (): UseUserSearchReturn => searchState,
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: () => friendStoreState,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'current-user' } }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn() },
}));

function userResult(overrides: Partial<UserSearchResult> = {}): UserSearchResult {
  return {
    id: 'user-1',
    username: 'alice',
    display_name: 'Alice Example',
    avatar_url: null,
    status: 'offline',
    ...overrides,
  };
}

function request(type: FriendRequest['type']): FriendRequest {
  return {
    id: `${type}-1`,
    type,
    createdAt: '2026-07-09T00:00:00.000Z',
    user: { id: 'user-1', username: 'alice', displayName: 'Alice Example', avatarUrl: null },
  };
}

function renderPeopleTab() {
  return render(
    <MemoryRouter>
      <PeopleTab />
    </MemoryRouter>
  );
}

describe('PeopleTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    friendStoreState.friends = [];
    friendStoreState.sentRequests = [];
    friendStoreState.pendingRequests = [];
    friendStoreState.sendRequest.mockResolvedValue(undefined);
    searchState.results = [];
    searchState.isLoading = false;
    searchState.error = null;
  });

  it('routes incoming search-result requests to the request center', () => {
    searchState.results = [userResult({ friend_request_received: true })];

    renderPeopleTab();

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(navigate).toHaveBeenCalledWith('/social/friends');
    expect(friendStoreState.sendRequest).not.toHaveBeenCalled();
  });

  it('keeps outgoing search-result requests disabled as Pending', () => {
    searchState.results = [userResult()];
    friendStoreState.sentRequests = [request('outgoing')];

    renderPeopleTab();

    expect(screen.getByRole('button', { name: 'Pending' })).toBeDisabled();
  });

  it('locks duplicate sends while the add request is in flight', async () => {
    let resolveRequest: (() => void) | undefined;
    searchState.results = [userResult()];
    friendStoreState.sendRequest.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRequest = resolve))
    );

    renderPeopleTab();

    const add = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(add);
    fireEvent.click(add);

    expect(friendStoreState.sendRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Sending' })).toBeDisabled();

    await act(async () => {
      resolveRequest?.();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument());
  });

  it('keeps profile navigation separate from the relationship action', () => {
    searchState.results = [userResult()];

    renderPeopleTab();

    expect(screen.getByRole('link', { name: 'View Alice Example profile' })).toHaveAttribute(
      'href',
      '/alice'
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('shows a visible failure when a friend request cannot be sent', async () => {
    searchState.results = [userResult()];
    friendStoreState.sendRequest.mockRejectedValueOnce(new Error('network unavailable'));

    renderPeopleTab();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not send a friend request to Alice Example.'
    );
  });
});
