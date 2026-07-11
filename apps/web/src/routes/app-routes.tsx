/**
 * Application Route Tree
 *
 * Composes route groups from modular sub-files for maintainability.
 * Each route group (dev, public, auth, forums, settings, me) is defined
 * in its own file under ./route-groups/.
 *
 */

import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { ProtectedRoute, AdminRoute } from './guards';
import { AuthRoutes, ForumRoutes, SettingsRoutes, MeRoutes } from './route-groups';
import {
  // Core
  Messages,
  Conversation,
  Onboarding,
  // Groups
  Groups,
  GroupChannel,
  GroupCallChannel,
  GroupAnnouncementChannel,
  GroupForumChannel,
  GroupSettingsPage,
  GroupInviteLanding,
  ExploreGroups,
  // Explore (unified)
  ExplorePage,
  // Broadcasts
  BroadcastsPage,
  BroadcastDetail,
  // Vault
  VaultPage,
  // Spaces
  SpacesPage,
  // Profile & Community
  UserProfile,
  // Calls
  CallScreen,
  CallHistory,
  // Creator
  CreatorDashboard,
  CreatorEarnings,
  CreatorPayouts,
  CreatorAnalytics,
  CreatorTierManagement,
  CreatorSubscribers,
  // Hubs
  Social,
  // Members
  MemberList,
  WhosOnline,
  // Pulse
  PulseLeaderboard,
  // Social
  FollowingPage,
  // Admin
  AdminDashboard,
  // Static
  NotFound,
} from './lazyPages';

/**
 * Redirect helper for /settings/:section -> /me/settings/:section
 */
function SettingsSectionRedirect(): React.ReactNode {
  const { section } = useParams<{ section: string }>();
  return <Navigate to={`/me/settings/${section ?? 'account'}`} replace />;
}

/**
 * Redirect helper for /customize/:category -> /me/appearance/:category
 */
function CustomizeCategoryRedirect(): React.ReactNode {
  const { category } = useParams<{ category: string }>();
  const legacyCategoryMap: Record<string, string> = {
    chat: 'bubbles',
    effects: 'themes',
  };
  const targetCategory = category ? (legacyCategoryMap[category] ?? category) : 'identity';
  return <Navigate to={`/me/appearance/${targetCategory}`} replace />;
}

/**
 * Redirect helper for /conversations/:conversationId -> /messages/:conversationId.
 */
function LegacyConversationRedirect(): React.ReactNode {
  const { conversationId } = useParams<{ conversationId?: string }>();
  return <Navigate to={conversationId ? `/messages/${conversationId}` : '/messages'} replace />;
}

/** Complete application route tree */
export function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth routes ───────────────────────────────────────────── */}
      {AuthRoutes()}

      {/* ── Protected app routes ──────────────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default: redirect to messages (same as Discord/Signal landing on DMs) */}
        <Route index element={<Navigate to="/messages" replace />} />

        {/* Legacy dashboard/conversation routes */}
        <Route path="dashboard" element={<Navigate to="/messages" replace />} />
        <Route path="conversations" element={<LegacyConversationRedirect />} />
        <Route path="conversations/:conversationId" element={<LegacyConversationRedirect />} />

        {/* Messages */}
        <Route path="messages" element={<Messages />}>
          <Route path=":conversationId" element={<Conversation />} />
        </Route>

        {/* Social Hub */}
        <Route path="social" element={<Navigate to="/social/friends" replace />} />
        <Route path="social/:tab" element={<Social />} />
        <Route path="friends" element={<Navigate to="/social/friends" replace />} />
        <Route path="notifications" element={<Navigate to="/social/notifications" replace />} />

        {/* Groups */}
        <Route path="groups" element={<Groups />}>
          <Route path=":groupId" element={null} />
          <Route path=":groupId/channels/:channelId" element={<GroupChannel />} />
          <Route path=":groupId/voice/:channelId" element={<GroupCallChannel />} />
          <Route path=":groupId/video/:channelId" element={<GroupCallChannel />} />
          <Route path=":groupId/announcements/:channelId" element={<GroupAnnouncementChannel />} />
          <Route path=":groupId/forums/:channelId" element={<GroupForumChannel />} />
          <Route path=":groupId/settings" element={<GroupSettingsPage />} />
        </Route>
        <Route path="groups/explore" element={<ExploreGroups />} />
        <Route path="invite/:code" element={<GroupInviteLanding />} />

        {/* Explore — unified discovery destination with tabs */}
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/:tab" element={<ExplorePage />} />

        {/* Legacy feed redirect → explore/feed tab */}
        <Route path="feed" element={<Navigate to="/explore/feed" replace />} />

        {/* Broadcasts */}
        <Route path="broadcasts" element={<BroadcastsPage />} />
        <Route path="broadcasts/:broadcastId" element={<BroadcastDetail />} />

        {/* Vault / Saved Messages */}
        <Route path="vault" element={<VaultPage />} />
        <Route path="vault/:conversationId" element={<VaultPage />} />

        {/* Spaces / Conversation folders */}
        <Route path="spaces" element={<SpacesPage />} />
        <Route path="spaces/:spaceId" element={<SpacesPage />} />

        {/* Forums */}
        {ForumRoutes()}

        {/* ── Me Hub ── */}
        {MeRoutes()}

        {/* Legacy Settings routes (kept for deep-link compatibility) */}
        {SettingsRoutes()}

        {/* Discovery Settings — redirect legacy path to me hub */}
        <Route
          path="settings/discovery"
          element={<Navigate to="/me/settings/discovery" replace />}
        />
        {/* Invite Friends (Phase 23) */}
        <Route path="settings/invite-friends" element={<Navigate to="/me/invites" replace />} />

        {/* Members */}
        <Route path="members" element={<MemberList />} />
        <Route path="members/online" element={<WhosOnline />} />

        {/* Pulse leaderboard (#24) */}
        <Route path="pulse" element={<PulseLeaderboard />} />
        <Route path="pulse/:forumSlug" element={<PulseLeaderboard />} />

        {/* Following (plan #23) */}
        <Route path="following" element={<FollowingPage />} />

        {/* Creator */}
        <Route path="creator" element={<CreatorDashboard />} />
        <Route path="creator/earnings" element={<CreatorEarnings />} />
        <Route path="creator/payouts" element={<CreatorPayouts />} />
        <Route path="creator/analytics" element={<CreatorAnalytics />} />
        <Route path="creator/tiers" element={<CreatorTierManagement />} />
        <Route path="creator/subscribers" element={<CreatorSubscribers />} />

        {/* ── Legacy Redirects ───────────────────────────────────── */}

        {/* Profile → Me hub */}
        <Route path="profile" element={<Navigate to="/me/profile" replace />} />

        {/* Nodes → Me wallet */}
        <Route path="nodes" element={<Navigate to="/me/wallet" replace />} />
        <Route path="nodes/shop" element={<Navigate to="/me/wallet/shop" replace />} />

        {/* Premium → Me subscription */}
        <Route path="premium" element={<Navigate to="/me/subscription" replace />} />
        <Route path="premium/coins" element={<Navigate to="/me/wallet/shop" replace />} />
        <Route path="premium/nodes" element={<Navigate to="/me/wallet/shop" replace />} />

        {/* Customize → Me appearance */}
        <Route path="customize" element={<Navigate to="/me/appearance/identity" replace />} />
        <Route path="customize/:category" element={<CustomizeCategoryRedirect />} />

        {/* Cosmetics → Me appearance */}
        <Route path="cosmetics" element={<Navigate to="/me/appearance/inventory" replace />} />
        <Route path="cosmetics/shop" element={<Navigate to="/me/appearance/shop" replace />} />

        {/* Customization Redirects */}
        <Route path="titles" element={<Navigate to="/me/appearance/identity" replace />} />

        {/* Removed gamification routes → current destinations */}
        <Route path="gamification/*" element={<Navigate to="/explore" replace />} />
        <Route path="leaderboard" element={<Navigate to="/pulse" replace />} />
        <Route path="achievements" element={<Navigate to="/me/appearance/identity" replace />} />
        <Route path="quests" element={<Navigate to="/explore" replace />} />

        {/* Search → Explore */}
        <Route path="search" element={<Navigate to="/explore" replace />} />

        {/* Settings catch-all → Me settings */}
        <Route
          path="settings/app-theme"
          element={<Navigate to="/me/settings/appearance" replace />}
        />
        <Route path="settings/:section" element={<SettingsSectionRedirect />} />

        {/* Calls */}
        <Route path="call/:recipientId/:callType" element={<CallScreen />} />
        <Route path="calls/history" element={<CallHistory />} />

        {/* Onboarding & User profile */}
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="user/:userId" element={<UserProfile />} />
        <Route path="u/:username" element={<UserProfile />} />
        <Route path="profile/:username" element={<UserProfile />} />

        {/* Admin */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Canonical public profile URLs: /:username */}
        <Route path=":username" element={<UserProfile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
