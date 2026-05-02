/**
 * Creator monetization endpoints.
 *
 * Phase 48-01: Extended with tier CRUD, checkout, subscriber management,
 * payout scheduling, refund handling, and content gating endpoints.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  CreatorStatusSchema,
  CreatorBalanceSchema,
  PayoutRequestSchema,
  AnalyticsOverviewSchema,
  OnboardResponseSchema,
  PremiumThreadSchema,
  CreatorTierSchema,
  RevenueBreakdownEntrySchema,
  SubscriberGrowthEntrySchema,
  CreatorApplicationSchema,
  CreatorPublicProfileSchema,
  CreatorSearchResultSchema,
  CheckoutSessionSchema,
  CreatorSubscriptionInfoSchema,
  CancelSubscriptionResultSchema,
  SubscriberEntrySchema,
  GiftSubscriptionResultSchema,
  PayoutEstimateSchema,
  ConnectOnboardingSchema,
  RefundResultSchema,
} from '../schemas/creator';
import type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  OnboardResponse,
  PremiumThread,
  CreatorTier,
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
} from '../schemas/creator';
export type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  OnboardResponse,
  PremiumThread,
  CreatorTier,
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
} from '../schemas/creator';

// ---------------------------------------------------------------------------
// Analytics schemas
// ---------------------------------------------------------------------------

const EarningsAnalyticsSchema = z
  .object({
    entries: z
      .array(
        z
          .object({
            date: z.string(),
            amount_cents: z.number().optional(),
            amountCents: z.number().optional(),
          })
          .passthrough()
      )
      .optional(),
    earningsOverTime: z
      .array(z.object({ month: z.string(), netCents: z.number() }).passthrough())
      .optional(),
    topForums: z
      .array(
        z
          .object({
            forumId: z.string(),
            name: z.string(),
            subscribers: z.number(),
            mrrCents: z.number().optional(),
          })
          .passthrough()
      )
      .optional(),
    total_cents: z.number().optional(),
    totalCents: z.number().optional(),
    period: z.string().optional(),
  })
  .passthrough();

export type EarningsAnalytics = z.infer<typeof EarningsAnalyticsSchema>;
export type EarningsData = EarningsAnalytics;

const SubscriberAnalyticsSchema = z
  .object({
    entries: z.array(SubscriberGrowthEntrySchema).optional(),
    growth: z.array(SubscriberGrowthEntrySchema).optional(),
    total: z.number().optional(),
    period: z.string().optional(),
  })
  .passthrough();

export type SubscriberAnalytics = z.infer<typeof SubscriberAnalyticsSchema>;
export type SubscriberGrowthData = SubscriberAnalytics;

const ContentAnalyticsSchema = z
  .object({
    top_content: z.array(z.object({}).passthrough()).optional(),
    topContent: z.array(z.object({}).passthrough()).optional(),
    period: z.string().optional(),
  })
  .passthrough();

export type ContentAnalytics = z.infer<typeof ContentAnalyticsSchema>;
export type ContentAnalyticsEnhanced = ContentAnalytics;

const RevenueAnalyticsSchema = z
  .object({
    entries: z.array(RevenueBreakdownEntrySchema).optional(),
    breakdown: z.array(RevenueBreakdownEntrySchema).optional(),
    period: z.string().optional(),
  })
  .passthrough();

export type RevenueAnalytics = z.infer<typeof RevenueAnalyticsSchema>;
export type RevenueBreakdownData = RevenueAnalytics;

const ForumSubscriptionResultSchema = z
  .object({ id: z.string().optional(), status: z.string().optional() })
  .passthrough();
export type ForumSubscriptionResult = z.infer<typeof ForumSubscriptionResultSchema>;

const MonetizationSettingsSchema = z.object({}).passthrough();
export type MonetizationSettings = z.infer<typeof MonetizationSettingsSchema>;

const PayoutListSchema = z.array(PayoutRequestSchema);
const PremiumThreadListSchema = z.array(PremiumThreadSchema);
const TierListSchema = z.array(CreatorTierSchema);
const SubscriberListSchema = z.array(SubscriberEntrySchema);

const EmptySchema = z
  .object({})
  .passthrough()
  .transform((): Record<string, never> => ({}));
const DeleteTierSchema = z.object({ id: z.string(), is_active: z.literal(false) });

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Create Creator Endpoints. */
export function createCreatorEndpoints(http: AxiosInstance) {
  return {
    // --- Connect Onboarding ---
    async onboard(): Promise<ApiResult<OnboardResponse>> {
      return apiCall(() => http.post('/api/v1/creator/onboard'), OnboardResponseSchema);
    },
    async getStatus(): Promise<ApiResult<CreatorStatus>> {
      return apiCall(() => http.get('/api/v1/creator/status'), CreatorStatusSchema);
    },
    async refreshOnboard(): Promise<ApiResult<OnboardResponse>> {
      return apiCall(() => http.post('/api/v1/creator/onboard/refresh'), OnboardResponseSchema);
    },
    async getConnectOnboarding(): Promise<ApiResult<ConnectOnboarding>> {
      return apiCall(() => http.get('/api/v1/creator/connect/onboarding'), ConnectOnboardingSchema);
    },

    // --- Balance & Payouts ---
    async getBalance(): Promise<ApiResult<CreatorBalance>> {
      return apiCall(() => http.get('/api/v1/creator/balance'), CreatorBalanceSchema);
    },
    async requestPayout(amount?: number): Promise<ApiResult<PayoutRequest>> {
      return apiCall(
        () => http.post('/api/v1/creator/payouts/request', { amount }),
        PayoutRequestSchema
      );
    },
    async listPayouts(cursor?: string): Promise<ApiResult<PayoutRequest[]>> {
      return apiCall(
        () => http.get('/api/v1/creator/payouts', { params: { after: cursor } }),
        PayoutListSchema
      );
    },
    async getPayoutEstimate(): Promise<ApiResult<PayoutEstimate>> {
      return apiCall(() => http.get('/api/v1/creator/payouts/estimate'), PayoutEstimateSchema);
    },

    // --- Tier CRUD ---
    async listTiers(): Promise<ApiResult<CreatorTier[]>> {
      return apiCall(() => http.get('/api/v1/creator/tiers'), TierListSchema);
    },
    async createTier(attrs: {
      readonly name: string;
      readonly description?: string;
      readonly price_cents: number;
      readonly currency?: string;
      readonly perks?: string[];
      readonly max_subscribers?: number;
      readonly forum_id?: string;
    }): Promise<ApiResult<CreatorTier>> {
      return apiCall(() => http.post('/api/v1/creator/tiers', attrs), CreatorTierSchema);
    },
    async updateTier(
      tierId: string,
      attrs: {
        readonly name?: string;
        readonly description?: string;
        readonly perks?: string[];
        readonly max_subscribers?: number;
      }
    ): Promise<ApiResult<CreatorTier>> {
      return apiCall(() => http.put(`/api/v1/creator/tiers/${tierId}`, attrs), CreatorTierSchema);
    },
    async deleteTier(tierId: string): Promise<ApiResult<{ id: string; is_active: false }>> {
      return apiCall(() => http.delete(`/api/v1/creator/tiers/${tierId}`), DeleteTierSchema);
    },
    async reorderTiers(
      tierIds: string[]
    ): Promise<ApiResult<Array<{ id: string; sort_order: number }>>> {
      return apiCall(
        () => http.put('/api/v1/creator/tiers/reorder', { tier_ids: tierIds }),
        z.array(z.object({ id: z.string(), sort_order: z.number() }))
      );
    },
    async listPublicTiers(username: string): Promise<ApiResult<CreatorTier[]>> {
      return apiCall(
        () => http.get(`/api/v1/creators/${encodeURIComponent(username)}/tiers`),
        TierListSchema
      );
    },

    // --- Subscription Checkout ---
    async createCheckoutSession(
      creatorId: string,
      tierId: string
    ): Promise<ApiResult<CheckoutSession>> {
      return apiCall(
        () => http.post(`/api/v1/creator/${creatorId}/subscribe`, { tier_id: tierId }),
        CheckoutSessionSchema
      );
    },
    async cancelCreatorSubscription(
      creatorId: string
    ): Promise<ApiResult<CancelSubscriptionResult>> {
      return apiCall(
        () => http.post(`/api/v1/creator/${creatorId}/unsubscribe`),
        CancelSubscriptionResultSchema
      );
    },
    async getCreatorSubscription(creatorId: string): Promise<ApiResult<CreatorSubscriptionInfo>> {
      return apiCall(
        () => http.get(`/api/v1/creator/${creatorId}/subscription`),
        CreatorSubscriptionInfoSchema
      );
    },

    // --- Subscriber Management ---
    async listSubscribers(params?: {
      readonly tier_id?: string;
      readonly status?: string;
      readonly cursor?: string;
    }): Promise<ApiResult<SubscriberEntry[]>> {
      return apiCall(
        () => http.get('/api/v1/creator/subscribers', { params }),
        SubscriberListSchema
      );
    },
    async giftSubscription(attrs: {
      readonly user_id: string;
      readonly tier_id: string;
      readonly duration_days: number;
    }): Promise<ApiResult<GiftSubscriptionResult>> {
      return apiCall(
        () => http.post('/api/v1/creator/subscribers/gift', attrs),
        GiftSubscriptionResultSchema
      );
    },
    async revokeSubscription(subscriptionId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.delete(`/api/v1/creator/subscribers/${subscriptionId}`),
        EmptySchema
      );
    },

    // --- Refunds ---
    async requestRefund(
      subscriptionId: string,
      attrs: {
        readonly reason: 'unused' | 'not_as_described' | 'technical_issue' | 'other';
        readonly details?: string;
      }
    ): Promise<ApiResult<RefundResult>> {
      return apiCall(
        () => http.post(`/api/v1/subscriptions/${subscriptionId}/refund`, attrs),
        RefundResultSchema
      );
    },
    async issueCreatorRefund(
      subscriptionId: string,
      reason: string
    ): Promise<ApiResult<RefundResult>> {
      return apiCall(
        () => http.post(`/api/v1/creator/subscriptions/${subscriptionId}/refund`, { reason }),
        RefundResultSchema
      );
    },

    // --- Analytics ---
    async getAnalyticsOverview(params?: {
      readonly period?: string;
      readonly start?: string;
      readonly end?: string;
    }): Promise<ApiResult<AnalyticsOverview>> {
      return apiCall(
        () => http.get('/api/v1/creator/analytics/overview', { params }),
        AnalyticsOverviewSchema
      );
    },
    async getAnalyticsEarnings(params?: {
      readonly period?: string;
      readonly start?: string;
      readonly end?: string;
    }): Promise<ApiResult<EarningsAnalytics>> {
      return apiCall(
        () => http.get('/api/v1/creator/analytics/earnings', { params }),
        EarningsAnalyticsSchema
      );
    },
    async getAnalyticsSubscribers(params?: {
      readonly period?: string;
    }): Promise<ApiResult<SubscriberAnalytics>> {
      return apiCall(
        () => http.get('/api/v1/creator/analytics/subscribers', { params }),
        SubscriberAnalyticsSchema
      );
    },
    async getAnalyticsContent(params?: {
      readonly period?: string;
      readonly limit?: number;
    }): Promise<ApiResult<ContentAnalytics>> {
      return apiCall(
        () => http.get('/api/v1/creator/analytics/content', { params }),
        ContentAnalyticsSchema
      );
    },
    async getAnalyticsRevenue(params?: {
      readonly period?: string;
      readonly group_by?: string;
    }): Promise<ApiResult<RevenueAnalytics>> {
      return apiCall(
        () => http.get('/api/v1/creator/analytics/revenue', { params }),
        RevenueAnalyticsSchema
      );
    },

    // --- Forum Subscriptions (legacy) ---
    async subscribeForum(forumId: string): Promise<ApiResult<ForumSubscriptionResult>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/subscription`),
        ForumSubscriptionResultSchema
      );
    },
    async unsubscribeForum(forumId: string): Promise<ApiResult<Record<string, never>>> {
      return apiCall(() => http.delete(`/api/v1/forums/${forumId}/subscription`), EmptySchema);
    },
    async updateMonetization(
      forumId: string,
      settings: Record<string, unknown>
    ): Promise<ApiResult<MonetizationSettings>> {
      return apiCall(
        () => http.put(`/api/v1/forums/${forumId}/monetization`, settings),
        MonetizationSettingsSchema
      );
    },

    // --- Premium Threads ---
    async listPremiumThreads(): Promise<ApiResult<PremiumThread[]>> {
      return apiCall(() => http.get('/api/v1/creator/premium-threads'), PremiumThreadListSchema);
    },
    async createPremiumThread(attrs: {
      readonly threadId: string;
      readonly priceNodes: number;
      readonly subscriberOnly?: boolean;
      readonly previewLength?: number;
    }): Promise<ApiResult<PremiumThread>> {
      return apiCall(
        () => http.post('/api/v1/creator/premium-threads', attrs),
        PremiumThreadSchema
      );
    },
    async purchaseThreadAccess(threadId: string): Promise<ApiResult<PremiumThread>> {
      return apiCall(() => http.put(`/api/v1/threads/${threadId}/purchase`), PremiumThreadSchema);
    },

    // --- Applications ---
    async submitApplication(attrs: {
      readonly bio: string;
      readonly category: string;
      readonly portfolio_url?: string;
      readonly social_links?: Record<string, string>;
    }): Promise<ApiResult<CreatorApplication>> {
      return apiCall(() => http.post('/api/v1/creator/apply', attrs), CreatorApplicationSchema);
    },
    async getApplication(): Promise<ApiResult<CreatorApplication>> {
      return apiCall(() => http.get('/api/v1/creator/application'), CreatorApplicationSchema);
    },

    // --- Discovery ---
    async getCreatorProfile(username: string): Promise<ApiResult<CreatorPublicProfile>> {
      return apiCall(
        () => http.get(`/api/v1/creators/${encodeURIComponent(username)}`),
        CreatorPublicProfileSchema
      );
    },
    async searchCreators(params: {
      readonly q: string;
      readonly category?: string;
      readonly verified_only?: boolean;
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<CreatorSearchResult[]>> {
      return apiCall(
        () => http.get('/api/v1/creators/search', { params }),
        z.array(CreatorSearchResultSchema)
      );
    },
    async getFeaturedCreators(params?: {
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<CreatorSearchResult[]>> {
      return apiCall(
        () => http.get('/api/v1/creators/featured', { params }),
        z.array(CreatorSearchResultSchema)
      );
    },
    async getTrendingCreators(params?: {
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<CreatorSearchResult[]>> {
      return apiCall(
        () => http.get('/api/v1/creators/trending', { params }),
        z.array(CreatorSearchResultSchema)
      );
    },
    async getCreatorsByCategory(
      category: string,
      params?: { readonly cursor?: string; readonly limit?: number }
    ): Promise<ApiResult<CreatorSearchResult[]>> {
      return apiCall(
        () => http.get(`/api/v1/creators/category/${encodeURIComponent(category)}`, { params }),
        z.array(CreatorSearchResultSchema)
      );
    },
  };
}
