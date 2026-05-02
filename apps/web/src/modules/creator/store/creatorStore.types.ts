/**
 * Creator Store — Type Definitions
 *
 * All interfaces and types used by the creator monetization store.
 */

import type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalyticsEnhanced,
  PremiumThread,
  CreatorTier,
  RevenueBreakdownData,
  SubscriberGrowthData,
  CreatorApplication,
  CreatorPublicProfile,
  CreatorSearchResult,
  CheckoutSession,
  CreatorSubscriptionInfo,
  CancelSubscriptionResult,
  SubscriberEntry,
  GiftSubscriptionResult,
  PayoutEstimate,
  ConnectOnboarding,
  RefundResult,
} from '@cgraph/api-client';

// Re-export schema types for convenience
export type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalyticsEnhanced,
  PremiumThread,
  CreatorTier,
  RevenueBreakdownData,
  SubscriberGrowthData,
  CreatorApplication,
  CreatorPublicProfile,
  CreatorSearchResult,
  CheckoutSession,
  CreatorSubscriptionInfo,
  CancelSubscriptionResult,
  SubscriberEntry,
  GiftSubscriptionResult,
  PayoutEstimate,
  ConnectOnboarding,
  RefundResult,
};

/** ContentAnalytics is a lighter local type used by legacy callers. */
export interface ContentAnalytics {
  totalPosts: number;
  topPosts: { id: string; title: string; views: number; engagement: number }[];
}

export interface CreatorState {
  // Status
  isCreator: boolean;
  onboardingComplete: boolean;
  creatorStatus: 'none' | 'pending' | 'active' | 'suspended';
  stripeAccountId: string | null;

  // Balance
  balance: CreatorBalance | null;

  // Payouts
  payouts: PayoutRequest[];

  // Analytics
  analyticsOverview: AnalyticsOverview | null;
  earningsData: EarningsData | null;
  subscriberAnalytics: SubscriberAnalytics | null;
  contentAnalytics: ContentAnalyticsEnhanced | null;
  revenueBreakdown: RevenueBreakdownData | null;
  subscriberGrowth: SubscriberGrowthData | null;
  contentAnalyticsEnhanced: ContentAnalyticsEnhanced | null;

  // Premium
  premiumThreads: PremiumThread[];
  tiers: CreatorTier[];
  isLoadingPremium: boolean;

  // Application
  application: CreatorApplication | null;
  isLoadingApplication: boolean;
  applicationError: string | null;

  // Discovery
  featuredCreators: CreatorSearchResult[];
  trendingCreators: CreatorSearchResult[];
  searchResults: CreatorSearchResult[];
  creatorProfile: CreatorPublicProfile | null;
  isLoadingDiscovery: boolean;

  // Subscribers (Phase 48-01)
  subscribers: SubscriberEntry[];
  isLoadingSubscribers: boolean;

  // Subscription checkout (Phase 48-01)
  currentSubscription: CreatorSubscriptionInfo | null;

  // Payout estimate (Phase 48-01)
  payoutEstimate: PayoutEstimate | null;

  // Loading
  isLoading: boolean;
  isLoadingBalance: boolean;
  isLoadingPayouts: boolean;
  isLoadingAnalytics: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  requestPayout: (amount?: number) => Promise<PayoutRequest | null>;
  fetchPayouts: (cursor?: string | null) => Promise<void>;
  fetchAnalyticsOverview: (params?: { period?: string }) => Promise<void>;
  fetchAnalyticsEarnings: (params?: { period?: string }) => Promise<void>;
  fetchAnalyticsSubscribers: () => Promise<void>;
  fetchAnalyticsContent: (params?: { period?: string }) => Promise<void>;
  fetchAnalyticsRevenue: (params?: { period?: string; groupBy?: string }) => Promise<void>;
  fetchSubscriberGrowth: (params?: { period?: string }) => Promise<void>;
  fetchContentAnalyticsEnhanced: (params?: { period?: string }) => Promise<void>;
  fetchPremiumThreads: () => Promise<void>;
  fetchTiers: () => Promise<void>;
  onboard: () => Promise<{ url: string } | null>;
  refreshOnboard: () => Promise<{ url: string } | null>;

  // Tier management actions (Phase 48-01)
  createTier: (attrs: {
    forumId: string;
    name: string;
    priceMonthlyNodes: number;
    benefits?: Record<string, boolean>;
    maxSubscribers?: number;
  }) => Promise<CreatorTier | null>;
  updateTier: (tierId: string, attrs: {
    name?: string;
    description?: string;
    perks?: string[];
    max_subscribers?: number;
  }) => Promise<CreatorTier | null>;
  deleteTier: (tierId: string) => Promise<boolean>;
  reorderTiers: (tierIds: string[]) => Promise<boolean>;

  // Subscription checkout actions (Phase 48-01)
  createCheckoutSession: (creatorId: string, tierId: string) => Promise<CheckoutSession | null>;
  cancelCreatorSubscription: (creatorId: string) => Promise<CancelSubscriptionResult | null>;
  fetchCreatorSubscription: (creatorId: string) => Promise<void>;

  // Subscriber management actions (Phase 48-01)
  fetchSubscribers: (params?: { tier_id?: string; status?: string; cursor?: string }) => Promise<void>;
  giftSubscription: (attrs: { user_id: string; tier_id: string; duration_days: number }) => Promise<GiftSubscriptionResult | null>;
  revokeSubscription: (subscriptionId: string) => Promise<boolean>;

  // Payout actions (Phase 48-01)
  fetchPayoutEstimate: () => Promise<void>;
  fetchConnectOnboarding: () => Promise<ConnectOnboarding | null>;

  // Refund actions (Phase 48-01)
  requestRefund: (
    subscriptionId: string,
    attrs: {
      reason: 'unused' | 'not_as_described' | 'technical_issue' | 'other';
      details?: string;
    }
  ) => Promise<RefundResult | null>;
  issueCreatorRefund: (subscriptionId: string, reason: string) => Promise<RefundResult | null>;

  // Application actions
  submitApplication: (attrs: {
    bio: string;
    category: string;
    portfolio_url?: string;
    social_links?: Record<string, string>;
  }) => Promise<CreatorApplication | null>;
  fetchApplication: () => Promise<void>;

  // Discovery actions
  fetchFeaturedCreators: () => Promise<void>;
  fetchTrendingCreators: () => Promise<void>;
  searchCreators: (params: {
    q: string;
    category?: string;
    verified_only?: boolean;
  }) => Promise<void>;
  fetchCreatorProfile: (username: string) => Promise<void>;

  reset: () => void;
}
