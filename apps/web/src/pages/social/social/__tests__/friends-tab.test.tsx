import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Friend, FriendRequest } from '@/modules/social/store';
import { FriendsTab } from '../friends-tab';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => <div {...rest}>{children}</div>,
    button: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <button {...rest}>{children}</button>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/modules/social/components/user-profile-card', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="themed-avatar">{alt}</div>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    medium: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_UP: {},
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: () => null,
}));

function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    id: 'friend-1',
    username: 'alice',
    displayName: 'Alice Example',
    avatarUrl: null,
    status: 'online',
    statusMessage: null,
    friendshipId: 'friendship-1',
    createdAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
}

function makeRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: 'request-1',
    type: 'incoming',
    createdAt: '2026-07-03T00:00:00.000Z',
    user: {
      id: 'request-user-1',
      username: 'pendingalice',
      displayName: 'Alice Pending',
      avatarUrl: null,
    },
    ...overrides,
  };
}

function renderFriendsTab(overrides: Partial<React.ComponentProps<typeof FriendsTab>> = {}) {
  return render(
    <FriendsTab
      friends={[makeFriend()]}
      pendingRequests={[]}
      sentRequests={[]}
      searchQuery=""
      onSearchChange={vi.fn()}
      onAcceptRequest={vi.fn()}
      onDeclineRequest={vi.fn()}
      onCancelRequest={vi.fn()}
      onRemoveFriend={vi.fn()}
      {...overrides}
    />
  );
}

describe('FriendsTab', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('keeps accepted-friend actions stable and discoverable outside hover-only input', () => {
    const onRemoveFriend = vi.fn();
    renderFriendsTab({ onRemoveFriend });

    const messageButton = screen.getByRole('button', { name: 'Message Alice Example' });
    expect(messageButton).toHaveClass(
      'h-11',
      'w-11',
      'opacity-100',
      'sm:opacity-0',
      'sm:group-focus-within:opacity-100',
      'sm:group-hover:opacity-100',
      'focus-visible:ring-2'
    );

    fireEvent.click(messageButton);
    expect(navigate).toHaveBeenCalledWith('/messages?userId=friend-1');

    const removeButton = screen.getByRole('button', {
      name: 'Remove Alice Example from friends',
    });
    expect(removeButton).toHaveClass(
      'h-11',
      'w-11',
      'opacity-100',
      'sm:opacity-0',
      'sm:group-focus-within:opacity-100',
      'sm:group-hover:opacity-100',
      'focus-visible:ring-2'
    );

    fireEvent.click(removeButton);
    expect(onRemoveFriend).toHaveBeenCalledWith('friendship-1');
  });

  it('keeps friend-request actions stable and preserves their callbacks', () => {
    const onAcceptRequest = vi.fn();
    const onDeclineRequest = vi.fn();
    const onCancelRequest = vi.fn();

    renderFriendsTab({
      friends: [],
      pendingRequests: [makeRequest()],
      sentRequests: [
        makeRequest({
          id: 'sent-request-1',
          type: 'outgoing',
          user: {
            id: 'request-user-2',
            username: 'sentbob',
            displayName: 'Bob Sent',
            avatarUrl: null,
          },
        }),
      ],
      onAcceptRequest,
      onDeclineRequest,
      onCancelRequest,
    });

    const acceptButton = screen.getByRole('button', {
      name: 'Accept friend request from Alice Pending',
    });
    expect(acceptButton).toHaveClass('h-11', 'w-11', 'focus-visible:ring-2');

    const declineButton = screen.getByRole('button', {
      name: 'Decline friend request from Alice Pending',
    });
    expect(declineButton).toHaveClass('h-11', 'w-11', 'focus-visible:ring-2');

    const cancelButton = screen.getByRole('button', {
      name: 'Cancel friend request to Bob Sent',
    });
    expect(cancelButton).toHaveClass('h-11', 'w-11', 'focus-visible:ring-2');

    fireEvent.click(acceptButton);
    fireEvent.click(declineButton);
    fireEvent.click(cancelButton);

    expect(onAcceptRequest).toHaveBeenCalledWith('request-1');
    expect(onDeclineRequest).toHaveBeenCalledWith('request-1');
    expect(onCancelRequest).toHaveBeenCalledWith('sent-request-1');
  });
});
