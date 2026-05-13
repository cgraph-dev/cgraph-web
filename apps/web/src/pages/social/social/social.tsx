/**
 * Social Component
 * Main orchestrator for the Social Hub
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  UsersIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useFriendStore } from '@/modules/social/store';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { useNotificationStore } from '@/modules/social/store';
import { useSearchStore } from '@/modules/search/store';
import { FriendsTab } from './friends-tab';
import { NotificationsTab } from './notifications-tab';
import { DiscoverTab } from './discover-tab';
import { ContactsPresenceList } from '@/modules/social/components/contacts-presence-list';
import { getNotificationActionUrl } from './notification-routing';
import { getDiscoverResultRoute } from './discover-routing';
import type { SocialTab, Notification, NotificationType, SearchResult } from './types';
import { tweens } from '@/lib/animation-presets';

function isNotificationType(value: string): value is NotificationType {
  return (
    value === 'friend_request' ||
    value === 'message' ||
    value === 'forum_reply' ||
    value === 'achievement' ||
    value === 'mention'
  );
}

function toNotificationType(value: string): NotificationType {
  return isNotificationType(value) ? value : 'message';
}

interface SocialMainPaneProps {
  tab: SocialTab;
  friends: readonly Friend[];
  pendingRequests: readonly FriendRequest[];
  notifications: readonly Notification[];
  searchResults: readonly SearchResult[];
  onOpenRoute: (route: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
}

function SocialMainPane({
  tab,
  friends,
  pendingRequests,
  notifications,
  searchResults,
  onOpenRoute,
  onAcceptRequest,
  onDeclineRequest,
  onMarkNotificationRead,
}: SocialMainPaneProps) {
  if (tab === 'notifications') {
    const unread = notifications.filter((notification) => !notification.read);
    const visible = (unread.length > 0 ? unread : notifications).slice(0, 8);

    return (
      <div className="flex h-full flex-col px-10 py-8">
        <div className="mb-6 flex items-center gap-3">
          <BellIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-black tracking-tight text-white">Notifications</h2>
        </div>
        <div className="grid max-w-3xl gap-3">
          {visible.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                onMarkNotificationRead(notification.id);
                if (notification.actionUrl) onOpenRoute(notification.actionUrl);
              }}
              className="bg-[var(--token-card-bg)]/45 rounded-2xl border border-[var(--token-card-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--token-bg-secondary)]"
            >
              <span className="block text-sm font-bold text-white">{notification.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-white/45">
                {notification.message}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'discover') {
    return (
      <div className="flex h-full flex-col px-10 py-8">
        <div className="mb-6 flex items-center gap-3">
          <MagnifyingGlassIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-black tracking-tight text-white">Discover</h2>
        </div>
        <div className="grid max-w-3xl gap-3">
          {searchResults.slice(0, 10).map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => onOpenRoute(getDiscoverResultRoute(result))}
              className="bg-[var(--token-card-bg)]/45 flex items-center justify-between rounded-2xl border border-[var(--token-card-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--token-bg-secondary)]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">{result.name}</span>
                <span className="mt-1 block truncate text-xs text-white/40">
                  {result.description || result.type}
                </span>
              </span>
              <span className="bg-primary-500/10 ml-4 shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary-300">
                Open
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const onlineFriends = friends.filter((friend) => friend.status === 'online');

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="mb-6 flex items-center gap-3">
        <UsersIcon className="h-6 w-6 text-primary-400" />
        <h2 className="text-xl font-black tracking-tight text-white">Friends</h2>
      </div>

      <div className="mb-8 grid max-w-3xl grid-cols-3 gap-3">
        <div className="bg-[var(--token-card-bg)]/45 rounded-2xl border border-[var(--token-card-border)] p-4">
          <span className="block text-2xl font-black text-white">{friends.length}</span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-widest text-white/30">
            Friends
          </span>
        </div>
        <div className="bg-[var(--token-card-bg)]/45 rounded-2xl border border-[var(--token-card-border)] p-4">
          <span className="block text-2xl font-black text-white">{onlineFriends.length}</span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-widest text-white/30">
            Online
          </span>
        </div>
        <div className="bg-[var(--token-card-bg)]/45 rounded-2xl border border-[var(--token-card-border)] p-4">
          <span className="block text-2xl font-black text-white">{pendingRequests.length}</span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-widest text-white/30">
            Requests
          </span>
        </div>
      </div>

      <div className="grid max-w-3xl gap-3">
        {pendingRequests.slice(0, 6).map((request) => (
          <div
            key={request.id}
            className="bg-[var(--token-card-bg)]/45 flex items-center gap-3 rounded-2xl border border-[var(--token-card-border)] px-4 py-3"
          >
            <UserPlusIcon className="h-5 w-5 text-primary-400" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">
                {request.user.displayName || request.user.username}
              </span>
              <span className="block truncate text-xs text-white/35">@{request.user.username}</span>
            </span>
            <button
              type="button"
              onClick={() => onAcceptRequest(request.id)}
              className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onDeclineRequest(request.id)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white/50"
            >
              Decline
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Social Hub - Unified Social Interface
 *
 * Consolidates 3 major social features into one tab:
 * 1. Friends - Friend list, requests, online status
 * 2. Notifications - All app notifications in one place
 * 3. Discover - Global search for users, forums, groups
 *
 * This replaces the old /friends, /notifications, and /search routes.
 */
export function Social() {
  const { tab = 'friends' } = useParams<{ tab: SocialTab }>();
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
    clearError,
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Wire real notification store
  const {
    notifications: storeNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
  } = useNotificationStore();

  // Wire real search store
  const {
    users: searchUsers,
    groups: searchGroups,
    forums: searchForums,
    isLoading: _isSearching,
    search: performSearch,
    setQuery: setSearchStoreQuery,
  } = useSearchStore();

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
    fetchNotifications();
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchNotifications]);

  // Adapt store notifications → UI Notification type
  const notifications: Notification[] = useMemo(
    () =>
      storeNotifications.map((n) => ({
        id: n.id,
        type: toNotificationType(n.type),
        title: n.title,
        message: n.body,
        timestamp: new Date(n.createdAt),
        read: n.isRead,
        actionUrl: getNotificationActionUrl(n),
        avatarUrl: n.sender?.avatarUrl ?? undefined,
      })),
    [storeNotifications]
  );

  // Adapt store search results → UI SearchResult type
  const searchResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];
    for (const user of searchUsers) {
      results.push({
        id: user.id,
        type: 'user',
        name: user.display_name || user.username,
        description: `@${user.username}`,
        avatarUrl: user.avatar_url ?? undefined,
      });
    }
    for (const group of searchGroups) {
      results.push({
        id: group.id,
        type: 'group',
        name: group.name,
        description: group.description || '',
        slug: group.slug,
        route: `/groups/${group.id}`,
        memberCount: group.member_count,
      });
    }
    for (const forum of searchForums) {
      results.push({
        id: forum.id,
        type: 'forum',
        name: forum.name,
        description: forum.description || '',
        slug: forum.slug,
        route: forum.slug ? `/forums/${forum.slug}` : undefined,
        memberCount: forum.post_count,
      });
    }
    return results;
  }, [searchUsers, searchGroups, searchForums]);

  // Filter friends by search
  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search via real search store
  function handleSearch(query: string) {
    setSearchQuery(query);
    setSearchStoreQuery(query);
    if (query.length >= 2) {
      performSearch(query);
    }
  }

  function handleMarkAsRead(notificationId: string) {
    markNotificationRead(notificationId);
  }

  function handleMarkAllAsRead() {
    markAllNotificationsRead();
  }

  const tabs: { id: SocialTab; label: string; icon: typeof UsersIcon; count: number }[] = [
    { id: 'friends', label: 'Friends', icon: UsersIcon, count: pendingRequests.length },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      count: unreadCount,
    },
    { id: 'discover', label: 'Discover', icon: MagnifyingGlassIcon, count: 0 },
  ];

  return (
    <div className="relative flex h-full w-full flex-1 overflow-hidden bg-transparent">
      {/* Sidebar - Navigation & Lists */}
      <aside className="bg-[var(--token-card-bg)]/40 relative z-10 flex w-[380px] shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl transition-all duration-300">
        {/* Sidebar Header */}
        <div className="flex-shrink-0 border-b border-[var(--token-border-muted)] px-6 py-8">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-black tracking-tighter text-transparent"
          >
            Social Hub
          </motion.h1>

          {/* Tabs - Sidebar Navigation */}
          <div className="mt-8 flex flex-col gap-1.5">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => navigate(`/social/${tabItem.id}`)}
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 font-bold transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'shadow-primary-500/5 text-white shadow-lg'
                      : 'text-white/30 hover:bg-[var(--token-bg-primary)] hover:text-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="socialActiveTab"
                      className="absolute inset-0 rounded-2xl border border-[var(--token-card-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      style={{
                        background:
                          'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 10%, transparent) 0%, rgba(59,130,246,0.08) 100%)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                    />
                  )}

                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-500 ${
                      isActive
                        ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
                        : 'border-transparent bg-[var(--token-bg-primary)] text-white/10 group-hover:bg-[var(--token-bg-secondary)]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="relative z-10 flex-1 text-left text-sm tracking-wide">
                    {tabItem.label}
                  </span>

                  {tabItem.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-5.5 shadow-primary-500/20 relative z-10 flex min-w-[22px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-black text-white shadow-lg ring-2 ring-dark-950"
                    >
                      {tabItem.count > 99 ? '99+' : tabItem.count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Content (Scrollable List) */}
        <div className="scrollbar-thin scrollbar-thumb-white/5 flex-1 overflow-y-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={tweens.standard}
            >
              {tab === 'friends' && (
                <FriendsTab
                  friends={filteredFriends}
                  pendingRequests={pendingRequests}
                  sentRequests={sentRequests}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onAcceptRequest={acceptRequest}
                  onDeclineRequest={declineRequest}
                  isLoading={isLoading}
                  error={error}
                  onRetry={() => {
                    clearError();
                    fetchFriends();
                    fetchPendingRequests();
                  }}
                />
              )}

              {tab === 'notifications' && (
                <NotificationsTab
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              )}

              {tab === 'discover' && (
                <DiscoverTab
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  onSearchChange={handleSearch}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <SocialMainPane
          tab={tab}
          friends={filteredFriends}
          pendingRequests={pendingRequests}
          notifications={notifications}
          searchResults={searchResults}
          onOpenRoute={navigate}
          onAcceptRequest={acceptRequest}
          onDeclineRequest={declineRequest}
          onMarkNotificationRead={handleMarkAsRead}
        />
      </main>

      {/* Right Sidebar - Presence */}
      <aside className="hidden w-80 shrink-0 border-l border-[var(--token-card-border)] bg-black/10 backdrop-blur-md xl:block">
        <div className="flex h-full flex-col">
          <div className="px-6 py-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">
              {' '}
              Global Active{' '}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3">
            <ContactsPresenceList
              onContactClick={(friend) => navigate(`/messages?userId=${friend.id}`)}
              className="space-y-1"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
