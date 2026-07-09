import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchGroup, SearchForum, SearchUser } from '@/modules/search/store';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { Social } from '../social';
import type { DiscoverTabProps } from '../types';

const {
  navigate,
  discoverTabState,
  friendStoreState,
  notificationStoreState,
  searchStoreState,
  groupStoreState,
} = vi.hoisted(() => ({
  navigate: vi.fn(),
  discoverTabState: {
    latestProps: null as DiscoverTabProps | null,
  },
  friendStoreState: {
    friends: [] as Friend[],
    pendingRequests: [] as FriendRequest[],
    sentRequests: [] as FriendRequest[],
    isLoading: false,
    error: null as string | null,
    fetchFriends: vi.fn(() => Promise.resolve()),
    fetchPendingRequests: vi.fn(() => Promise.resolve()),
    fetchSentRequests: vi.fn(() => Promise.resolve()),
    acceptRequest: vi.fn(() => Promise.resolve()),
    declineRequest: vi.fn(() => Promise.resolve()),
    cancelRequest: vi.fn(() => Promise.resolve()),
    removeFriend: vi.fn(() => Promise.resolve()),
    blockUser: vi.fn(() => Promise.resolve()),
    clearError: vi.fn(),
  },
  notificationStoreState: {
    notifications: [],
    unreadCount: 0,
    fetchNotifications: vi.fn(() => Promise.resolve()),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
  searchStoreState: {
    users: [] as SearchUser[],
    groups: [] as SearchGroup[],
    forums: [] as SearchForum[],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    search: vi.fn(() => Promise.resolve()),
    loadMore: vi.fn(() => Promise.resolve()),
    setQuery: vi.fn(),
  },
  groupStoreState: {
    joinPublicGroup: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => ({ tab: 'discover' }),
  };
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
        layoutId: _layoutId,
        ...domProps
      } = rest;
      return <div {...domProps}>{children}</div>;
    },
    h1: ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const { initial: _initial, animate: _animate, transition: _transition, ...domProps } = rest;
      return <h1 {...domProps}>{children}</h1>;
    },
    span: ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const { initial: _initial, animate: _animate, transition: _transition, ...domProps } = rest;
      return <span {...domProps}>{children}</span>;
    },
  },
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: () => friendStoreState,
  useNotificationStore: () => notificationStoreState,
}));

vi.mock('@/modules/search/store', () => ({
  useSearchStore: () => searchStoreState,
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: () => groupStoreState,
}));

vi.mock('@/modules/social/components/contacts-presence-list', () => ({
  ContactsPresenceList: () => <div data-testid="contacts-presence-list" />,
}));

vi.mock('../friends-tab', () => ({
  FriendsTab: () => <div data-testid="friends-tab" />,
}));

vi.mock('../notifications-tab', () => ({
  NotificationsTab: () => <div data-testid="notifications-tab" />,
}));

vi.mock('../discover-tab', () => ({
  DiscoverTab: (props: DiscoverTabProps) => {
    discoverTabState.latestProps = props;
    return (
      <div data-testid="discover-tab">
        {props.searchResults.map((result) => (
          <span key={result.id} data-testid={`result-${result.id}`}>
            {result.friendshipStatus ?? 'none'}
          </span>
        ))}
      </div>
    );
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/error-tracking', () => ({
  captureError: vi.fn(),
}));

function searchUser(overrides: Partial<SearchUser>): SearchUser {
  return {
    id: 'user-1',
    username: 'alice',
    display_name: 'Alice Example',
    avatar_url: null,
    status: 'offline',
    ...overrides,
  };
}

describe('Social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    discoverTabState.latestProps = null;
    friendStoreState.friends = [];
    friendStoreState.pendingRequests = [];
    friendStoreState.sentRequests = [];
    friendStoreState.error = null;
    searchStoreState.users = [];
    searchStoreState.groups = [];
    searchStoreState.forums = [];
    searchStoreState.isLoadingMore = false;
    searchStoreState.hasMore = false;
  });

  it('passes resolved backend relationship state into discover user results', () => {
    searchStoreState.users = [
      searchUser({
        id: 'blocked-user',
        username: 'blocked',
        friendship_status: 'friends',
        is_friend: true,
        is_blocked: true,
      }),
      searchUser({
        id: 'incoming-user',
        username: 'incoming',
        friend_request_received: true,
      }),
      searchUser({
        id: 'outgoing-user',
        username: 'outgoing',
        friend_request_sent: true,
      }),
    ];

    render(<Social />);

    expect(screen.getByTestId('discover-tab')).toBeInTheDocument();
    expect(screen.getByTestId('result-blocked-user')).toHaveTextContent('blocked');
    expect(screen.getByTestId('result-incoming-user')).toHaveTextContent('pending_received');
    expect(screen.getByTestId('result-outgoing-user')).toHaveTextContent('pending_sent');
    expect(discoverTabState.latestProps?.searchResults).toMatchObject([
      { id: 'blocked-user', friendshipStatus: 'blocked', isBlocked: true },
      { id: 'incoming-user', friendshipStatus: 'pending_received', friendRequestReceived: true },
      { id: 'outgoing-user', friendshipStatus: 'pending_sent', friendRequestSent: true },
    ]);
  });
});
