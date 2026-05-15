/** @module user-profile-card tests */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProfileCardUser } from '../../profile-card/types';
import { http } from '@/lib/api-client';
import UserProfileCard from '../user-profile-card';

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
  useFriendStore: () => ({
    sendRequest: vi.fn(),
  }),
}));

vi.mock('../new-profile-card', () => ({
  NewProfileCard: ({ user }: { user: ProfileCardUser }) => (
    <div data-testid="new-profile-card">
      <span>{user.displayName}</span>
      <span>{user.avatarBorderId}</span>
      <span>{user.equipped_nameplate}</span>
    </div>
  ),
}));

const mockedGet = vi.mocked(http.get);

describe('UserProfileCard', () => {
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
          equipped_nameplate_id: 'plate_aurora',
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
    expect(screen.getByTestId('new-profile-card')).toHaveTextContent('plate_aurora');
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
});
