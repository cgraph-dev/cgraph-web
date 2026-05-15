import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DiscoverTab } from '../discover-tab';
import type { SearchResult } from '../types';

const navigate = vi.fn();
const sendRequest = vi.fn();

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
    friends: [],
    sentRequests: [],
    pendingRequests: [],
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

describe('DiscoverTab', () => {
  beforeEach(() => {
    navigate.mockClear();
    sendRequest.mockClear();
  });

  it('joins unjoined group results without treating Open as a fake action', () => {
    const onJoinGroup = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(
      <DiscoverTab
        searchQuery="design"
        searchResults={[groupResult]}
        onSearchChange={vi.fn()}
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
        onSearchChange={vi.fn()}
        onJoinGroup={onJoinGroup}
        joiningGroupId={null}
      />
    );

    fireEvent.click(screen.getByText('Design Guild'));

    expect(onJoinGroup).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/groups/group-1/channels/channel-1');
  });
});
