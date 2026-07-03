import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Friend, FriendRequest } from '@/modules/social/store';
import { FriendsTab } from '../friends-tab';

const { navigate, friendStoreState } = vi.hoisted(() => ({
  navigate: vi.fn(),
  friendStoreState: {
    sendRequest: vi.fn(() => Promise.resolve()),
    error: null as string | null,
    clearError: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...domProps
      } = rest;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: (selector: (state: typeof friendStoreState) => unknown) => selector(friendStoreState),
}));

vi.mock('@/modules/social/components/user-profile-card', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="themed-avatar">{alt}</div>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({ getAvatarBorderId: () => null }));

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
      onAcceptRequest={vi.fn(() => Promise.resolve())}
      onDeclineRequest={vi.fn(() => Promise.resolve())}
      onCancelRequest={vi.fn(() => Promise.resolve())}
      onRemoveFriend={vi.fn(() => Promise.resolve())}
      onBlockUser={vi.fn(() => Promise.resolve())}
      onRetry={vi.fn()}
      {...overrides}
    />
  );
}

describe('FriendsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    friendStoreState.error = null;
    friendStoreState.sendRequest.mockResolvedValue(undefined);
  });

  it('renders one counted contact center and preserves friend actions', () => {
    const onRemoveFriend = vi.fn(() => Promise.resolve());
    renderFriendsTab({
      pendingRequests: [makeRequest()],
      sentRequests: [makeRequest({ id: 'sent-1', type: 'outgoing' })],
      onRemoveFriend,
    });

    expect(screen.getByText('1 friends, 1 incoming, 1 sent')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Friends and requests' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Message Alice Example' }));
    expect(navigate).toHaveBeenCalledWith('/messages?userId=friend-1');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alice Example from friends' }));
    expect(onRemoveFriend).toHaveBeenCalledWith('friendship-1');
  });

  it('keeps incoming and outgoing request commands explicit', () => {
    const onAcceptRequest = vi.fn(() => Promise.resolve());
    const onDeclineRequest = vi.fn(() => Promise.resolve());
    const onCancelRequest = vi.fn(() => Promise.resolve());
    renderFriendsTab({
      friends: [],
      pendingRequests: [makeRequest()],
      sentRequests: [
        makeRequest({
          id: 'sent-1',
          type: 'outgoing',
          user: { id: 'user-bob', username: 'bob', displayName: 'Bob Sent', avatarUrl: null },
        }),
      ],
      onAcceptRequest,
      onDeclineRequest,
      onCancelRequest,
    });

    const accept = screen.getByRole('button', { name: 'Accept friend request from Alice Pending' });
    const decline = screen.getByRole('button', { name: 'Decline friend request from Alice Pending' });
    const cancel = screen.getByRole('button', { name: 'Cancel friend request to Bob Sent' });
    expect(accept).toHaveClass('h-11', 'w-11');
    expect(decline).toHaveClass('h-11', 'w-11');
    expect(cancel).toHaveClass('h-11', 'w-11');

    fireEvent.click(accept);
    fireEvent.click(decline);
    fireEvent.click(cancel);

    expect(onAcceptRequest).toHaveBeenCalledWith('request-1');
    expect(onDeclineRequest).toHaveBeenCalledWith('request-1');
    expect(onCancelRequest).toHaveBeenCalledWith('sent-1');
  });

  it('confirms block before mutating and keeps the dialog open on failure', async () => {
    const onBlockUser = vi
      .fn<(_: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('block failed'))
      .mockResolvedValueOnce(undefined);
    renderFriendsTab({ onBlockUser });

    fireEvent.click(screen.getByRole('button', { name: 'Block Alice Example' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    await waitFor(() => expect(onBlockUser).toHaveBeenCalledWith('friend-1'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('opens the add dialog and locks duplicate submissions while sending', async () => {
    let resolveRequest: (() => void) | undefined;
    friendStoreState.sendRequest.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRequest = resolve))
    );
    renderFriendsTab();

    fireEvent.click(screen.getByRole('button', { name: 'Add friend' }));
    fireEvent.change(screen.getByLabelText('Friend identifier'), { target: { value: '@bob' } });
    const submit = screen.getByRole('button', { name: 'Send request' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(friendStoreState.sendRequest).toHaveBeenCalledTimes(1);
    expect(friendStoreState.sendRequest).toHaveBeenCalledWith('bob');
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();

    resolveRequest?.();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the add dialog and identifier available after a failed request', async () => {
    friendStoreState.sendRequest.mockRejectedValueOnce(new Error('not found'));
    renderFriendsTab();

    fireEvent.click(screen.getByRole('button', { name: 'Add friend' }));
    const identifier = screen.getByLabelText('Friend identifier');
    fireEvent.change(identifier, { target: { value: '@missing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

    await waitFor(() => expect(friendStoreState.sendRequest).toHaveBeenCalledWith('missing'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(identifier).toHaveValue('@missing');
  });

  it('keeps long request identity text constrained away from actions', () => {
    const longName = 'Alice Pending With A Very Long Display Name That Must Not Move Actions';
    renderFriendsTab({
      friends: [],
      pendingRequests: [
        makeRequest({
          user: {
            id: 'long-user',
            username: 'alice_pending_with_a_very_long_username',
            displayName: longName,
            avatarUrl: null,
          },
        }),
      ],
    });

    const identity = screen.getAllByText(longName).find((element) => element.tagName === 'P');
    expect(identity).toBeDefined();
    if (!identity) throw new Error('Expected constrained identity text');
    expect(identity).toHaveClass('truncate');
    expect(identity.parentElement).toHaveClass('min-w-0', 'flex-1');
    expect(screen.getByRole('button', { name: `Accept friend request from ${longName}` })).toHaveClass(
      'h-11',
      'w-11'
    );
  });
});
