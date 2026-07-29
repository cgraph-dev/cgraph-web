import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchForum, SearchGroup, SearchUser } from '@/modules/search/store';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { Social } from '../social';
import type { DiscoverTabProps } from '../types';

const {
  discoverTabState,
  friendStoreState,
  notificationStoreState,
  searchStoreState,
  groupStoreState,
} = vi.hoisted(() => ({
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

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

function renderSocial(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/social/:tab"
          element={
            <>
              <Social />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

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
    notificationStoreState.notifications = [];
    notificationStoreState.unreadCount = 0;
    searchStoreState.users = [];
    searchStoreState.groups = [];
    searchStoreState.forums = [];
    searchStoreState.isLoadingMore = false;
    searchStoreState.hasMore = false;
  });

  it.each([
    ['/social/friends', 'Friends', 'friends-tab'],
    ['/social/notifications', 'Notifications', 'notifications-tab'],
    ['/social/discover', 'Discover', 'discover-tab'],
  ])('mounts one owner for %s', (path, label, testId) => {
    renderSocial(path);

    expect(screen.getAllByTestId(testId)).toHaveLength(1);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  it('redirects unknown social tabs to Friends', async () => {
    renderSocial('/social/unknown');

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent(
        '/social/friends'
      )
    );
    expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
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

    renderSocial('/social/discover');

    expect(screen.getByTestId('result-blocked-user')).toHaveTextContent('blocked');
    expect(screen.getByTestId('result-incoming-user')).toHaveTextContent('pending_received');
    expect(screen.getByTestId('result-outgoing-user')).toHaveTextContent('pending_sent');
    expect(discoverTabState.latestProps?.searchResults).toMatchObject([
      { id: 'blocked-user', friendshipStatus: 'blocked' },
      { id: 'incoming-user', friendshipStatus: 'pending_received' },
      { id: 'outgoing-user', friendshipStatus: 'pending_sent' },
    ]);
  });
});
