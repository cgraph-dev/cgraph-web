/** @module user-profile-card tests */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ProfileCardUser } from '../../profile-card/types';
import { http } from '@/lib/api-client';
import UserProfileCard from '../user-profile-card';

const { friendStoreState } = vi.hoisted(() => ({
  friendStoreState: {
    friends: [] as { id: string }[],
    pendingRequests: [] as { user: { id: string } }[],
    sentRequests: [] as { user: { id: string } }[],
    sendRequest: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock('../hooks', () => ({
  useProfileCardNavigation: () => ({
    handleViewProfile: vi.fn(),
    handleMessage: vi.fn(),
  }),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: () => friendStoreState,
}));

vi.mock('../new-profile-card', () => ({
  NewProfileCard: ({
    user,
    friendshipStatus,
    isFriendActionPending,
    onAddFriend,
  }: {
    user: ProfileCardUser;
    friendshipStatus?: string;
    isFriendActionPending?: boolean;
    onAddFriend?: () => void;
  }) => (
    <div
      data-testid="new-profile-card"
      data-friendship-status={friendshipStatus}
      data-friend-action-pending={String(Boolean(isFriendActionPending))}
    >
      <span>{user.displayName}</span>
      <span>{user.avatarBorderId}</span>
      <span>{user.equipped_nameplate}</span>
      <button type="button" onClick={onAddFriend}>
        Card add friend
      </button>
    </div>
  ),
}));

const mockedGet = vi.mocked(http.get);

describe('UserProfileCard', () => {
  beforeEach(() => {
    friendStoreState.friends = [];
    friendStoreState.pendingRequests = [];
    friendStoreState.sentRequests = [];
    friendStoreState.sendRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates a userId-only card from the backend profile endpoint', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-1',
          username: 'serveruser',
          display_name: 'Server User',
          avatar_url: '/server.png',
          avatar_border_id: 'border_cyberpunk_common_01',
          equipped_nameplate_id: 'plate_gilded_sapphire_loop_01',
          level: 7,
          xp: 420,
          xp_to_next_level: 1000,
          pulse: 99,
        },
      },
    });

    render(
      <UserProfileCard userId="user-1" trigger="click">
        <button type="button">Open profile</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open profile' }));

    expect(await screen.findByText('Server User')).toBeInTheDocument();
    expect(screen.getByTestId('new-profile-card')).toHaveTextContent('border_cyberpunk_common_01');
    expect(screen.getByTestId('new-profile-card')).toHaveTextContent('plate_gilded_sapphire_loop_01');
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/v1/users/user-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('uses provided profile data without fetching placeholder data', async () => {
    const user: ProfileCardUser = {
      id: 'user-2',
      username: 'provided',
      displayName: 'Provided User',
      avatarUrl: '/provided.png',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      pulse: 0,
      streak: 0,
      isOnline: false,
    };

    render(
      <UserProfileCard userId="user-2" user={user} trigger="click">
        <button type="button">Open provided</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open provided' }));

    expect(await screen.findByText('Provided User')).toBeInTheDocument();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('passes backend friendship status through to profile-card actions', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-3',
          username: 'accepted',
          display_name: 'Accepted User',
          friendship_status: 'friends',
          avatar_url: null,
        },
      },
    });

    render(
      <UserProfileCard userId="user-3" trigger="click">
        <button type="button">Open accepted</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open accepted' }));

    expect(await screen.findByTestId('new-profile-card')).toHaveAttribute(
      'data-friendship-status',
      'friends'
    );
  });

  it('normalizes backend incoming request flags for profile-card actions', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-6',
          username: 'incoming',
          display_name: 'Incoming User',
          friend_request_received: true,
          avatar_url: null,
        },
      },
    });

    render(
      <UserProfileCard userId="user-6" trigger="click">
        <button type="button">Open incoming</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open incoming' }));

    expect(await screen.findByTestId('new-profile-card')).toHaveAttribute(
      'data-friendship-status',
      'pending_received'
    );
  });

  it('normalizes backend outgoing request flags for profile-card actions', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-7',
          username: 'outgoing',
          display_name: 'Outgoing User',
          friend_request_sent: true,
          avatar_url: null,
        },
      },
    });

    render(
      <UserProfileCard userId="user-7" trigger="click">
        <button type="button">Open outgoing</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open outgoing' }));

    expect(await screen.findByTestId('new-profile-card')).toHaveAttribute(
      'data-friendship-status',
      'pending_sent'
    );
  });

  it('keeps blocked profile-card state above stale local friend rows', async () => {
    friendStoreState.friends = [{ id: 'user-8' }];
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-8',
          username: 'blocked',
          display_name: 'Blocked User',
          is_blocked: true,
          avatar_url: null,
        },
      },
    });

    render(
      <UserProfileCard userId="user-8" trigger="click">
        <button type="button">Open blocked</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open blocked' }));

    expect(await screen.findByTestId('new-profile-card')).toHaveAttribute(
      'data-friendship-status',
      'blocked'
    );
  });

  it('lets the friend store override profile-card actions after local request updates', async () => {
    friendStoreState.pendingRequests = [{ user: { id: 'user-4' } }];
    const user: ProfileCardUser = {
      id: 'user-4',
      username: 'pending',
      displayName: 'Pending User',
      avatarUrl: '',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      pulse: 0,
      streak: 0,
      isOnline: false,
    };

    render(
      <UserProfileCard userId="user-4" user={user} trigger="click">
        <button type="button">Open pending</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open pending' }));

    expect(await screen.findByTestId('new-profile-card')).toHaveAttribute(
      'data-friendship-status',
      'pending_received'
    );
  });

  it('does not send duplicate add-friend requests from the profile card', async () => {
    let resolveRequest: (() => void) | undefined;
    friendStoreState.sendRequest.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRequest = resolve))
    );
    const user: ProfileCardUser = {
      id: 'user-5',
      username: 'neutral',
      displayName: 'Neutral User',
      avatarUrl: '',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      pulse: 0,
      streak: 0,
      isOnline: false,
    };

    render(
      <UserProfileCard userId="user-5" user={user} trigger="click">
        <button type="button">Open neutral</button>
      </UserProfileCard>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open neutral' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Card add friend' }));
    fireEvent.click(screen.getByRole('button', { name: 'Card add friend' }));

    expect(friendStoreState.sendRequest).toHaveBeenCalledTimes(1);
    expect(friendStoreState.sendRequest).toHaveBeenCalledWith('user-5');

    await act(async () => {
      resolveRequest?.();
      await Promise.resolve();
    });
  });
});
