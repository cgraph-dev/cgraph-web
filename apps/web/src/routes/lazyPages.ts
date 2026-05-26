/**
 * Lazy Page Imports
 *
 * Code-split page declarations for smaller initial bundle size.
 * Reduces initial JS from ~500KB to ~150KB via route-level splitting.
 *
 * Uses lazyRetry wrapper to auto-reload on stale chunk errors
 * (e.g. after a new deployment, old chunk hashes no longer exist).
 *
 */

import { lazy, type ComponentType } from 'react';

/**
 * Wraps a dynamic import with retry logic for chunk load failures.
 * On failure, reloads the page once to fetch fresh asset manifests.
 */
function lazyRetry(importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>) {
  return lazy(() =>
    importFn().catch((error: Error) => {
      // Only auto-reload once per session to avoid infinite reload loops
      const KEY = 'chunk_reload_ts';
      const lastReload = sessionStorage.getItem(KEY);
      const now = Date.now();

      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(KEY, String(now));
        window.location.reload();
      }

      throw error;
    })
  );
}

export const Login = lazyRetry(() => import('@/pages/auth/login'));
export const Register = lazyRetry(() => import('@/pages/auth/register'));
export const ForgotPassword = lazyRetry(() => import('@/pages/auth/forgot-password'));
export const OAuthCallback = lazyRetry(() => import('@/pages/auth/o-auth-callback'));
export const Onboarding = lazyRetry(() => import('@/pages/auth/onboarding'));
export const ResetPassword = lazyRetry(() => import('@/pages/auth/reset-password'));
export const VerifyEmail = lazyRetry(() => import('@/pages/auth/verify-email'));
export const QrLogin = lazyRetry(() => import('@/pages/auth/login/qr-login'));
export const PhoneRegister = lazyRetry(() => import('@/pages/auth/phone-register'));

export const Messages = lazyRetry(() => import('@/pages/messages/messages'));
export const Conversation = lazyRetry(() => import('@/pages/messages/conversation'));

export const Groups = lazyRetry(() => import('@/pages/groups/groups'));
export const GroupChannel = lazyRetry(() => import('@/pages/groups/group-channel'));
export const GroupCallChannel = lazyRetry(() => import('@/pages/groups/group-call-channel'));
export const GroupAnnouncementChannel = lazyRetry(
  () => import('@/pages/groups/group-announcement-channel')
);
export const GroupForumChannel = lazyRetry(() => import('@/pages/groups/group-forum-channel'));
export const GroupSettingsPage = lazyRetry(() => import('@/pages/groups/group-settings-page'));
export const GroupInviteLanding = lazyRetry(() => import('@/pages/groups/invite-landing'));
export const ExploreGroups = lazyRetry(() => import('@/pages/groups/explore-groups'));

export const ExplorePage = lazyRetry(() => import('@/pages/explore/explore-page'));

export const BroadcastsPage = lazyRetry(() => import('@/pages/broadcasts/broadcasts-page'));
export const BroadcastDetail = lazyRetry(() => import('@/pages/broadcasts/broadcast-detail'));
export const VaultPage = lazyRetry(() => import('@/pages/vault'));
export const SpacesPage = lazyRetry(() => import('@/pages/spaces'));

export const Forums = lazyRetry(() => import('@/pages/forums/forums'));
export const ForumPost = lazyRetry(() => import('@/pages/forums/forum-post'));
export const ForumLeaderboard = lazyRetry(() => import('@/pages/forums/forum-leaderboard'));
export const CreateForum = lazyRetry(() => import('@/pages/forums/create-forum'));
export const CreatePost = lazyRetry(() => import('@/pages/forums/create-post'));
export const ForumSettings = lazyRetry(() => import('@/pages/forums/forum-settings'));
export const ForumBoardView = lazyRetry(() => import('@/pages/forums/forum-board-view'));
export const ForumAdmin = lazyRetry(() => import('@/pages/forums/forum-admin'));
export const ModerationQueue = lazyRetry(() => import('@/pages/forums/moderation-queue'));
export const ForumSearchResults = lazyRetry(() => import('@/pages/forums/forum-search-results'));
export const BountyList = lazyRetry(() => import('@/pages/forums/bounties/bounty-list'));
export const BountyDetail = lazyRetry(() => import('@/pages/forums/bounties/bounty-detail'));
export const CreateBounty = lazyRetry(() => import('@/pages/forums/bounties/create-bounty-modal'));

export const CommissionBoardView = lazyRetry(
  () => import('@/pages/forums/commission-board/commission-board-view')
);
export const CommissionDetailPage = lazyRetry(
  () => import('@/pages/forums/commission-board/commission-detail-page')
);

export const FeedPage = lazyRetry(() => import('@/pages/feed/feed-page'));
export const DiscoverySettings = lazyRetry(
  () => import('@/pages/settings/discovery/discovery-settings')
);

export const Settings = lazyRetry(() => import('@/pages/settings/settings'));
export const InviteFriends = lazyRetry(() => import('@/pages/settings/invite-friends-page'));
export const AppThemeSettings = lazyRetry(() => import('@/pages/settings/app-theme-settings'));
export const UserProfile = lazyRetry(() => import('@/pages/profile/user-profile'));

export const E2EEVerification = lazyRetry(() => import('@/pages/security/e2-ee-verification'));
export const KeyVerification = lazyRetry(() => import('@/pages/security/key-verification'));

export const CallScreen = lazyRetry(() => import('@/pages/calls/call-screen'));
export const CallHistory = lazyRetry(() => import('@/pages/calls/call-history'));

export const PremiumPage = lazyRetry(() => import('@/pages/premium/premium-page'));

export const CosmeticsInventoryPage = lazyRetry(
  () => import('@/modules/cosmetics/pages/inventory-page')
);
export const CosmeticsShopPage = lazyRetry(() => import('@/modules/cosmetics/pages/shop-page'));

export const NodesWalletPage = lazyRetry(() => import('@/pages/nodes/nodes-wallet'));
export const NodesShopPage = lazyRetry(() => import('@/pages/nodes/nodes-shop'));

export const CreatorDashboard = lazyRetry(() => import('@/pages/creator/creator-dashboard'));
export const CreatorEarnings = lazyRetry(() => import('@/pages/creator/earnings-page'));
export const CreatorPayouts = lazyRetry(() => import('@/pages/creator/payout-page'));
export const CreatorAnalytics = lazyRetry(() => import('@/pages/creator/analytics-page'));
export const CreatorTierManagement = lazyRetry(
  () => import('@/modules/creator/pages/tier-management-page')
);
export const CreatorSubscribers = lazyRetry(
  () => import('@/modules/creator/components/subscriber-manager')
);
export const Customize = lazyRetry(() => import('@/pages/customize/customize'));
export const Social = lazyRetry(() => import('@/pages/social/social'));

export const MemberList = lazyRetry(() => import('@/pages/members/member-list'));
export const WhosOnline = lazyRetry(() => import('@/pages/members/whos-online'));

export const PulseLeaderboard = lazyRetry(() => import('@/pages/pulse/leaderboard'));

export const FollowingPage = lazyRetry(() => import('@/pages/social/following'));

export const MePage = lazyRetry(() => import('@/pages/me/me-page'));

export const AdminDashboard = lazyRetry(() => import('@/pages/admin/admin-dashboard'));

export const NotFound = lazyRetry(() => import('@/pages/not-found'));

// ARCHIVED: MatrixTest, EnhancedDemo moved to .archived/
export const ThemeApplicationTest = lazyRetry(
  () => import('@/__dev__/test/theme-application-test')
);
