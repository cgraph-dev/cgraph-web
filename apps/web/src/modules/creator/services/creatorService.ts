/**
 * @deprecated Use `apiClient.creator` from `@/lib/api-client` instead.
 * This file will be removed in a future migration.
 *
 * Creator Monetization Service
 *
 * Thin adapter over `apiClient.creator` that handles ApiResult unwrapping and
 * provides strongly-typed return values to the creator store.
 */

import { apiClient, http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CreatorService');

// Re-export schema types so the store/types file does not need to import from
// the package directly (backwards-compatible).
export type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  OnboardResponse,
  PremiumThread,
  CreatorTier,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalyticsEnhanced,
  RevenueBreakdownData,
  SubscriberGrowthData,
} from '@cgraph/api-client';

export interface TopContentEntry {
  readonly threadId: string;
  readonly title: string;
  readonly revenue: number;
  readonly unlockCount: number;
  readonly priceNodes: number;
}

export interface SubscriberGrowthEntry {
  readonly date: string;
  readonly new: number;
  readonly churned: number;
  readonly net: number;
}

export interface ContentAnalytics {
  totalPosts: number;
  topPosts: { id: string; title: string; views: number; engagement: number }[];
}

export const creatorService = {
  /** Start Stripe Connect onboarding */
  async onboard() {
    const result = await apiClient.creator.onboard();
    if (!result.ok) {
      logger.error('Failed to start onboarding', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get current creator status */
  async getStatus() {
    const result = await apiClient.creator.getStatus();
    if (!result.ok) {
      logger.error('Failed to fetch creator status', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Generate a new onboarding link */
  async refreshOnboard() {
    const result = await apiClient.creator.refreshOnboard();
    if (!result.ok) {
      logger.error('Failed to refresh onboarding link', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get earnings balance */
  async getBalance() {
    const result = await apiClient.creator.getBalance();
    if (!result.ok) {
      logger.error('Failed to fetch creator balance', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Request a payout ($10 minimum) */
  async requestPayout(amount?: number) {
    const result = await apiClient.creator.requestPayout(amount);
    if (!result.ok) {
      logger.error('Failed to request payout', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** List past payouts (cursor-paginated) */
  async listPayouts(cursor: string | null = null) {
    const result = await apiClient.creator.listPayouts(cursor ?? undefined);
    if (!result.ok) {
      logger.error('Failed to fetch payouts', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get overview analytics */
  async getAnalyticsOverview(params?: { period?: string; start?: string; end?: string }) {
    const result = await apiClient.creator.getAnalyticsOverview(params);
    if (!result.ok) {
      logger.warn('Failed to fetch analytics overview', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get earnings analytics */
  async getAnalyticsEarnings(params?: { period?: string; start?: string; end?: string }) {
    const result = await apiClient.creator.getAnalyticsEarnings(params);
    if (!result.ok) {
      logger.warn('Failed to fetch analytics earnings', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get subscriber analytics */
  async getAnalyticsSubscribers(params?: { period?: string }) {
    const result = await apiClient.creator.getAnalyticsSubscribers(params);
    if (!result.ok) {
      logger.warn('Failed to fetch subscriber analytics', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get content analytics (enhanced with top content + engagement) */
  async getAnalyticsContent(params?: { period?: string; limit?: number }) {
    const result = await apiClient.creator.getAnalyticsContent(params);
    if (!result.ok) {
      logger.warn('Failed to fetch content analytics', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get revenue breakdown by type */
  async getAnalyticsRevenue(params?: { period?: string; groupBy?: string }) {
    const result = await apiClient.creator.getAnalyticsRevenue({
      period: params?.period,
      group_by: params?.groupBy,
    });
    if (!result.ok) {
      logger.warn('Failed to fetch revenue breakdown', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get subscriber growth data */
  async getAnalyticsSubscriberGrowth(params?: { period?: string }) {
    const result = await apiClient.creator.getAnalyticsSubscribers(params);
    if (!result.ok) {
      logger.warn('Failed to fetch subscriber growth', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Export analytics as CSV — triggers file download */
  // TODO: migrate to apiClient when blob/export endpoints are added
  async exportAnalyticsCsv(params?: { period?: string }) {
    const response = await http.get('/api/v1/creator/analytics/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  /** Subscribe to a paid forum */
  async subscribe(forumId: string) {
    const result = await apiClient.creator.subscribeForum(forumId);
    if (!result.ok) {
      logger.error('Failed to subscribe to forum', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Unsubscribe from a paid forum */
  async unsubscribe(forumId: string) {
    const result = await apiClient.creator.unsubscribeForum(forumId);
    if (!result.ok) {
      logger.error('Failed to unsubscribe from forum', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Update forum monetization settings */
  async updateMonetization(forumId: string, settings: Record<string, unknown>) {
    const result = await apiClient.creator.updateMonetization(forumId, settings);
    if (!result.ok) {
      logger.error('Failed to update monetization settings', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  async listPremiumThreads() {
    const result = await apiClient.creator.listPremiumThreads();
    if (!result.ok) {
      logger.error('Failed to fetch premium threads', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  async createPremiumThread(attrs: {
    threadId: string;
    priceNodes: number;
    subscriberOnly?: boolean;
    previewLength?: number;
  }) {
    const result = await apiClient.creator.createPremiumThread(attrs);
    if (!result.ok) {
      logger.error('Failed to create premium thread', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  async listTiers() {
    const result = await apiClient.creator.listTiers();
    if (!result.ok) {
      logger.error('Failed to fetch tiers', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  async createTier(attrs: {
    forumId: string;
    name: string;
    priceMonthlyNodes: number;
    benefits?: Record<string, boolean>;
    maxSubscribers?: number;
  }) {
    const result = await apiClient.creator.createTier({
      name: attrs.name,
      price_cents: attrs.priceMonthlyNodes,
      forum_id: attrs.forumId,
      perks: attrs.benefits
        ? Object.keys(attrs.benefits).filter((k) => attrs.benefits![k])
        : undefined,
      max_subscribers: attrs.maxSubscribers,
    });
    if (!result.ok) {
      logger.error('Failed to create tier', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  async purchaseThreadAccess(threadId: string) {
    const result = await apiClient.creator.purchaseThreadAccess(threadId);
    if (!result.ok) {
      logger.error('Failed to purchase thread access', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Creator Applications
  // -------------------------------------------------------------------------

  /** Submit a creator application */
  async submitApplication(attrs: {
    bio: string;
    category: string;
    portfolio_url?: string;
    social_links?: Record<string, string>;
  }) {
    const result = await apiClient.creator.submitApplication(attrs);
    if (!result.ok) {
      logger.error('Failed to submit creator application', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get the current user's creator application */
  async getApplication() {
    const result = await apiClient.creator.getApplication();
    if (!result.ok) {
      logger.error('Failed to fetch creator application', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Creator Profiles & Discovery
  // -------------------------------------------------------------------------

  /** Get a creator's public profile */
  async getCreatorProfile(username: string) {
    const result = await apiClient.creator.getCreatorProfile(username);
    if (!result.ok) {
      logger.error('Failed to fetch creator profile', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Search creators */
  async searchCreators(params: {
    q: string;
    category?: string;
    verified_only?: boolean;
    cursor?: string;
    limit?: number;
  }) {
    const result = await apiClient.creator.searchCreators(params);
    if (!result.ok) {
      logger.error('Failed to search creators', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** List featured creators */
  async getFeaturedCreators(params?: { cursor?: string; limit?: number }) {
    const result = await apiClient.creator.getFeaturedCreators(params);
    if (!result.ok) {
      logger.error('Failed to fetch featured creators', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** List trending creators */
  async getTrendingCreators(params?: { cursor?: string; limit?: number }) {
    const result = await apiClient.creator.getTrendingCreators(params);
    if (!result.ok) {
      logger.error('Failed to fetch trending creators', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** List creators by category */
  async getCreatorsByCategory(category: string, params?: { cursor?: string; limit?: number }) {
    const result = await apiClient.creator.getCreatorsByCategory(category, params);
    if (!result.ok) {
      logger.error('Failed to fetch creators by category', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Subscription Tiers (Phase 48-01)
  // -------------------------------------------------------------------------

  /** Update a subscription tier */
  async updateTier(
    tierId: string,
    attrs: { name?: string; description?: string; perks?: string[]; max_subscribers?: number }
  ) {
    const result = await apiClient.creator.updateTier(tierId, attrs);
    if (!result.ok) {
      logger.error('Failed to update tier', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Delete (deactivate) a subscription tier */
  async deleteTier(tierId: string) {
    const result = await apiClient.creator.deleteTier(tierId);
    if (!result.ok) {
      logger.error('Failed to delete tier', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Reorder subscription tiers */
  async reorderTiers(tierIds: string[]) {
    const result = await apiClient.creator.reorderTiers(tierIds);
    if (!result.ok) {
      logger.error('Failed to reorder tiers', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Subscription Checkout (Phase 48-01)
  // -------------------------------------------------------------------------

  /** Create a checkout session for subscribing to a creator */
  async createCheckoutSession(creatorId: string, tierId: string) {
    const result = await apiClient.creator.createCheckoutSession(creatorId, tierId);
    if (!result.ok) {
      logger.error('Failed to create checkout session', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Cancel a creator subscription */
  async cancelCreatorSubscription(creatorId: string) {
    const result = await apiClient.creator.cancelCreatorSubscription(creatorId);
    if (!result.ok) {
      logger.error('Failed to cancel subscription', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get subscription info for a creator */
  async getCreatorSubscription(creatorId: string) {
    const result = await apiClient.creator.getCreatorSubscription(creatorId);
    if (!result.ok) {
      logger.error('Failed to get subscription', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Subscriber Management (Phase 48-01)
  // -------------------------------------------------------------------------

  /** List subscribers */
  async listSubscribers(params?: { tier_id?: string; status?: string; cursor?: string }) {
    const result = await apiClient.creator.listSubscribers(params);
    if (!result.ok) {
      logger.error('Failed to list subscribers', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Gift a subscription */
  async giftSubscription(attrs: { user_id: string; tier_id: string; duration_days: number }) {
    const result = await apiClient.creator.giftSubscription(attrs);
    if (!result.ok) {
      logger.error('Failed to gift subscription', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Revoke a subscription */
  async revokeSubscription(subscriptionId: string) {
    const result = await apiClient.creator.revokeSubscription(subscriptionId);
    if (!result.ok) {
      logger.error('Failed to revoke subscription', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Payouts (Phase 48-01)
  // -------------------------------------------------------------------------

  /** Get payout estimate */
  async getPayoutEstimate() {
    const result = await apiClient.creator.getPayoutEstimate();
    if (!result.ok) {
      logger.error('Failed to get payout estimate', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Get Connect onboarding status */
  async getConnectOnboarding() {
    const result = await apiClient.creator.getConnectOnboarding();
    if (!result.ok) {
      logger.error('Failed to get connect onboarding', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Refunds (Phase 48-01)
  // -------------------------------------------------------------------------

  /** Request a refund */
  async requestRefund(
    subscriptionId: string,
    attrs: {
      reason: 'unused' | 'not_as_described' | 'technical_issue' | 'other';
      details?: string;
    }
  ) {
    const result = await apiClient.creator.requestRefund(subscriptionId, {
      reason: attrs.reason,
      details: attrs.details,
    });
    if (!result.ok) {
      logger.error('Failed to request refund', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /** Issue a creator refund */
  async issueCreatorRefund(subscriptionId: string, reason: string) {
    const result = await apiClient.creator.issueCreatorRefund(subscriptionId, reason);
    if (!result.ok) {
      logger.error('Failed to issue refund', result.error);
      throw new Error(result.error.message);
    }
    return result.data;
  },
};
