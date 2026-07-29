import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bell, Search, Users } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { captureError } from '@/lib/error-tracking';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getGroupRoute } from '@/modules/groups/routing';
import { useGroupStore } from '@/modules/groups/store';
import { useSearchStore } from '@/modules/search/store';
import { ContactsPresenceList } from '@/modules/social/components/contacts-presence-list';
import { resolveFriendshipStatus } from '@/modules/social/friendship-status';
import { useFriendStore, useNotificationStore } from '@/modules/social/store';
import { DiscoverTab } from './discover-tab';
import { getDiscoverResultRoute } from './discover-routing';
import { FriendsTab } from './friends-tab';
import { NotificationsTab } from './notifications-tab';
import { getNotificationActionUrl } from './notification-routing';
import type { Notification, NotificationType, SearchResult, SocialTab } from './types';

interface SocialTabDefinition {
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

const SOCIAL_TABS: Readonly<Record<SocialTab, SocialTabDefinition>> = {
  friends: {
    label: 'Friends',
    description: 'Requests, contacts, and presence',
    icon: Users,
  },
  notifications: {
    label: 'Notifications',
    description: 'Messages, mentions, and activity',
    icon: Bell,
  },
  discover: {
    label: 'Discover',
    description: 'Find people and communities',
    icon: Search,
  },
};

const SOCIAL_TAB_ORDER: readonly SocialTab[] = ['friends', 'notifications', 'discover'];

function isSocialTab(value: string | undefined): value is SocialTab {
  return value === 'friends' || value === 'notifications' || value === 'discover';
}

function isNotificationType(value: string): value is NotificationType {
  return (
    value === 'friend_request' ||
    value === 'friend_accepted' ||
    value === 'message' ||
    value === 'message_request' ||
    value === 'group_invite' ||
    value === 'group_mention' ||
    value === 'channel_mention' ||
    value === 'forum_reply' ||
    value === 'forum_mention' ||
    value === 'post_reply' ||
    value === 'achievement' ||
    value === 'mention' ||
    value === 'level_up' ||
    value === 'streak_reminder' ||
    value === 'quest_completed' ||
    value === 'gift_received' ||
    value === 'event_reminder' ||
    value === 'event_invite' ||
    value === 'system'
  );
}

function toNotificationType(value: string): NotificationType {
  return isNotificationType(value) ? value : 'system';
}

export function Social() {
  const { tab } = useParams<{ tab?: string }>();

  if (!isSocialTab(tab)) return <Navigate to="/social/friends" replace />;

  return <SocialHub tab={tab} />;
}

function SocialHub({ tab }: { readonly tab: SocialTab }) {
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
    blockUser,
    clearError,
  } = useFriendStore();
  const {
    notifications: storeNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
  } = useNotificationStore();
  const {
    users: searchUsers,
    groups: searchGroups,
    forums: searchForums,
    isLoadingMore: isSearchLoadingMore,
    hasMore: hasMoreSearchResults,
    search: performSearch,
    loadMore: loadMoreSearchResults,
    setQuery: setSearchStoreQuery,
  } = useSearchStore();
  const { joinPublicGroup } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  useEffect(() => {
    void fetchFriends();
    void fetchPendingRequests();
    void fetchSentRequests();
    void fetchNotifications();
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchNotifications]);

  const notifications: Notification[] = useMemo(
    () =>
      storeNotifications.map((notification) => ({
        id: notification.id,
        type: toNotificationType(notification.type),
        title: notification.title,
        message: notification.body,
        timestamp: new Date(notification.createdAt),
        read: notification.isRead,
        actionUrl: getNotificationActionUrl(notification),
        avatarUrl: notification.sender?.avatarUrl ?? undefined,
      })),
    [storeNotifications]
  );

  const searchResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    for (const user of searchUsers) {
      results.push({
        id: user.id,
        type: 'user',
        name: user.display_name || user.username,
        description: `@${user.username}`,
        username: user.username,
        avatarUrl: user.avatar_url ?? undefined,
        canonicalUrl: user.canonical_url ?? undefined,
        friendshipStatus: resolveFriendshipStatus(
          {
            id: user.id,
            friendship_status: user.friendship_status,
            is_blocked: user.is_blocked,
            is_friend: user.is_friend,
            friend_request_received: user.friend_request_received,
            friend_request_sent: user.friend_request_sent,
          },
          {}
        ),
      });
    }

    for (const group of searchGroups) {
      results.push({
        id: group.id,
        type: 'group',
        name: group.name,
        description: group.description || '',
        slug: group.slug,
        defaultChannelId: group.default_channel_id ?? undefined,
        canonicalUrl: group.canonical_url ?? undefined,
        memberCount: group.member_count,
        isJoined: group.is_member,
      });
    }

    for (const forum of searchForums) {
      results.push({
        id: forum.id,
        type: 'forum',
        name: forum.name,
        description: forum.description || '',
        slug: forum.slug,
        canonicalUrl: forum.canonical_url ?? undefined,
        route: forum.slug ? `/forums/${forum.slug}` : undefined,
        memberCount: forum.post_count,
      });
    }

    return results;
  }, [searchForums, searchGroups, searchUsers]);

  const filteredFriends = friends.filter((friend) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      friend.username.toLowerCase().includes(normalizedQuery) ||
      friend.displayName?.toLowerCase().includes(normalizedQuery)
    );
  });

  const activeTab = SOCIAL_TABS[tab];
  const ActiveIcon = activeTab.icon;

  function handleSearch(query: string) {
    setSearchQuery(query);
    setSearchStoreQuery(query);
    if (query.length >= 2) void performSearch(query);
  }

  function refreshFriendCenter() {
    clearError();
    void Promise.allSettled([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]);
  }

  async function handleJoinGroupResult(result: SearchResult) {
    if (result.type !== 'group' || result.isJoined || joiningGroupId === result.id) {
      navigate(getDiscoverResultRoute(result));
      return;
    }

    setJoiningGroupId(result.id);
    try {
      const joinedGroup = await joinPublicGroup(result.id);
      HapticFeedback.success();
      navigate(joinedGroup ? getGroupRoute(joinedGroup) : getDiscoverResultRoute(result));
    } catch (joinError: unknown) {
      HapticFeedback.error();
      captureError(
        joinError instanceof Error ? joinError : new Error('Failed to join social group'),
        {
          source: 'social_discover_join',
          groupId: result.id,
        }
      );
    } finally {
      setJoiningGroupId(null);
    }
  }

  return (
    <div className="cgraph-workspace flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="cgraph-pane z-10 shrink-0 border-b md:w-64 md:border-b-0 md:border-r">
        <div className="cgraph-pane-header hidden px-5 py-4 md:block">
          <h1 className="text-lg font-semibold text-[var(--token-text-primary)]">Social</h1>
          <p className="text-xs text-[var(--token-text-muted)]">People and activity</p>
        </div>

        <nav
          className="cgraph-segmented scrollbar-hide m-3 flex max-w-full overflow-x-auto md:m-4 md:grid"
          aria-label="Social"
        >
          {SOCIAL_TAB_ORDER.map((id) => {
            const { label, icon: Icon } = SOCIAL_TABS[id];
            const count =
              id === 'friends' ? pendingRequests.length : id === 'notifications' ? unreadCount : 0;

            return (
              <Link
                key={id}
                to={`/social/${id}`}
                aria-current={tab === id ? 'page' : undefined}
                className="cgraph-segmented-item flex min-w-max items-center gap-2 px-3 text-sm font-medium md:min-w-0"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {count > 0 ? (
                  <span className="min-w-5 rounded-full bg-[var(--token-feedback-error)] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-[var(--token-text-on-primary)]">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="cgraph-content">
          <header className="cgraph-page-header">
            <div className="flex min-w-0 items-start gap-3">
              <span className="cgraph-empty-icon shrink-0" aria-hidden="true">
                <ActiveIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-[var(--token-text-primary)]">
                  {activeTab.label}
                </h2>
                <p className="text-sm text-[var(--token-text-muted)]">
                  {activeTab.description}
                </p>
              </div>
            </div>
          </header>

          <div className="pt-5">
            {tab === 'friends' ? (
              <FriendsTab
                friends={filteredFriends}
                pendingRequests={[...pendingRequests]}
                sentRequests={[...sentRequests]}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAcceptRequest={acceptRequest}
                onDeclineRequest={declineRequest}
                onCancelRequest={cancelRequest}
                onRemoveFriend={removeFriend}
                onBlockUser={blockUser}
                isLoading={isLoading}
                error={error}
                onRetry={refreshFriendCenter}
              />
            ) : null}

            {tab === 'notifications' ? (
              <NotificationsTab
                notifications={notifications}
                onMarkAsRead={(notificationId) => void markNotificationRead(notificationId)}
                onMarkAllAsRead={() => void markAllNotificationsRead()}
              />
            ) : null}

            {tab === 'discover' ? (
              <DiscoverTab
                searchQuery={searchQuery}
                searchResults={searchResults}
                hasMore={hasMoreSearchResults}
                isLoadingMore={isSearchLoadingMore}
                onSearchChange={handleSearch}
                onLoadMore={() => void loadMoreSearchResults()}
                onJoinGroup={handleJoinGroupResult}
                joiningGroupId={joiningGroupId}
              />
            ) : null}
          </div>
        </div>
      </main>

      <aside className="cgraph-pane hidden w-72 shrink-0 flex-col border-l xl:flex">
        <div className="cgraph-pane-header px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--token-text-primary)]">Active now</h2>
          <p className="text-xs text-[var(--token-text-muted)]">Friends currently available</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <ContactsPresenceList
            onContactClick={(friend) => navigate(`/messages?userId=${friend.id}`)}
            className="space-y-1"
          />
        </div>
      </aside>
    </div>
  );
}
