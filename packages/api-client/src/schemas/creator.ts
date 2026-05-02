/**
 * Creator monetization schemas.
 *
 * Phase 48-01: Extended with subscription tier, checkout, subscriber management,
 * revenue split, payout, and refund schemas.
 */
import { z } from 'zod';

export const CreatorStatusSchema = z.object({
  is_creator: z.boolean().optional(),
  isCreator: z.boolean().optional(),
  onboarding_complete: z.boolean().optional(),
  onboardingComplete: z.boolean().optional(),
  creator_status: z.enum(['none', 'pending', 'active', 'suspended']).optional(),
  creatorStatus: z.enum(['none', 'pending', 'active', 'suspended']).optional(),
  stripe_account_id: z.string().optional(),
  stripeAccountId: z.string().optional(),
  onboarded_at: z.string().nullable().optional(),
  onboardedAt: z.string().nullable().optional(),
});

export type CreatorStatus = z.infer<typeof CreatorStatusSchema>;

export const CreatorBalanceSchema = z.object({
  available: z.number().optional(),
  pending: z.number().optional(),
  currency: z.string().optional(),
  total_earned_cents: z.number().optional(),
  totalEarnedCents: z.number().optional(),
  total_paid_out_cents: z.number().optional(),
  totalPaidOutCents: z.number().optional(),
  available_balance_cents: z.number().optional(),
  availableBalanceCents: z.number().optional(),
});

export type CreatorBalance = z.infer<typeof CreatorBalanceSchema>;

export const PayoutRequestSchema = z.object({
  id: z.string(),
  amount: z.number().optional(),
  amount_cents: z.number().optional(),
  amountCents: z.number().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  currency: z.string().optional(),
  requested_at: z.string().optional(),
  requestedAt: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),
  earnings_count: z.number().optional(),
  stripe_transfer_id: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
});

export type PayoutRequest = z.infer<typeof PayoutRequestSchema>;

export const AnalyticsOverviewSchema = z.object({
  subscriber_count: z.number().optional(),
  subscriberCount: z.number().optional(),
  mrr_cents: z.number().optional(),
  mrrCents: z.number().optional(),
  churn_rate: z.number().optional(),
  churnRate: z.number().optional(),
  platform_fee_percent: z.number().optional(),
  platformFeePercent: z.number().optional(),
  revenue_30d_cents: z.number().optional(),
  revenue30dCents: z.number().optional(),
  total_subscribers: z.number().optional(),
  totalSubscribers: z.number().optional(),
  avg_revenue_per_subscriber_cents: z.number().optional(),
  avgRevenuePerSubscriberCents: z.number().optional(),
  pending_balance_cents: z.number().optional(),
  pendingBalanceCents: z.number().optional(),
});

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const OnboardResponseSchema = z.object({
  url: z.string().optional(),
  onboarding_url: z.string().optional(),
});

export type OnboardResponse = z.infer<typeof OnboardResponseSchema>;

export const PremiumThreadSchema = z.object({
  id: z.string(),
  thread_id: z.string().optional(),
  threadId: z.string().optional(),
  creator_id: z.string().optional(),
  creatorId: z.string().optional(),
  price_nodes: z.number().optional(),
  priceNodes: z.number().optional(),
  subscriber_only: z.boolean().optional(),
  subscriberOnly: z.boolean().optional(),
  preview_length: z.number().optional(),
  previewLength: z.number().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  updated_at: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PremiumThread = z.infer<typeof PremiumThreadSchema>;

export const CreatorTierSchema = z.object({
  id: z.string(),
  creator_id: z.string().optional(),
  creatorId: z.string().optional(),
  forum_id: z.string().optional(),
  forumId: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price_cents: z.number().optional(),
  priceCents: z.number().optional(),
  price_monthly_nodes: z.number().optional(),
  priceMonthlyNodes: z.number().optional(),
  currency: z.string().optional(),
  perks: z.array(z.string()).optional(),
  benefits: z.record(z.boolean()).optional(),
  stripe_price_id: z.string().nullable().optional(),
  max_subscribers: z.number().nullable().optional(),
  maxSubscribers: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  active: z.boolean().optional(),
  sort_order: z.number().optional(),
  subscriber_count: z.number().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  updated_at: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CreatorTier = z.infer<typeof CreatorTierSchema>;

// ---------------------------------------------------------------------------
// Checkout & Subscription
// ---------------------------------------------------------------------------

export const CheckoutSessionSchema = z.object({
  checkout_url: z.string(),
  session_id: z.string(),
});

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;

export const CreatorSubscriptionInfoSchema = z.object({
  id: z.string().optional(),
  tier_id: z.string().nullable().optional(),
  tier_name: z.string().nullable().optional(),
  status: z.string().optional(),
  current_period_start: z.string().nullable().optional(),
  current_period_end: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
}).nullable();

export type CreatorSubscriptionInfo = z.infer<typeof CreatorSubscriptionInfoSchema>;

export const CancelSubscriptionResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  cancelled_at: z.string().nullable().optional(),
  current_period_end: z.string().nullable().optional(),
});

export type CancelSubscriptionResult = z.infer<typeof CancelSubscriptionResultSchema>;

// ---------------------------------------------------------------------------
// Subscriber Management
// ---------------------------------------------------------------------------

export const SubscriberEntrySchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    avatar_url: z.string().nullable().optional(),
  }),
  tier: z.object({
    id: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
  }),
  status: z.string(),
  subscribed_at: z.string().optional(),
  current_period_end: z.string().nullable().optional(),
});

export type SubscriberEntry = z.infer<typeof SubscriberEntrySchema>;

export const GiftSubscriptionResultSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  tier_id: z.string().optional(),
  status: z.string(),
  current_period_end: z.string().nullable().optional(),
});

export type GiftSubscriptionResult = z.infer<typeof GiftSubscriptionResultSchema>;

// ---------------------------------------------------------------------------
// Payout Estimate
// ---------------------------------------------------------------------------

export const PayoutEstimateSchema = z.object({
  cleared_balance_cents: z.number(),
  pending_balance_cents: z.number(),
  next_payout_date: z.string(),
  minimum_payout_cents: z.number(),
});

export type PayoutEstimate = z.infer<typeof PayoutEstimateSchema>;

// ---------------------------------------------------------------------------
// Connect Onboarding
// ---------------------------------------------------------------------------

export const ConnectOnboardingSchema = z.object({
  onboarding_url: z.string().nullable(),
  status: z.enum(['pending', 'complete']),
});

export type ConnectOnboarding = z.infer<typeof ConnectOnboardingSchema>;

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export const RefundResultSchema = z.object({
  id: z.string(),
  status: z.enum(['pending_review', 'approved', 'rejected', 'processing', 'failed']),
  refund_amount_cents: z.number(),
  auto_approved: z.boolean().optional(),
  refunded_at: z.string().nullable().optional(),
});

export type RefundResult = z.infer<typeof RefundResultSchema>;

// ---------------------------------------------------------------------------
// Revenue Breakdown
// ---------------------------------------------------------------------------

export const RevenueBreakdownEntrySchema = z.object({
  type: z.string(),
  period_label: z.string().optional(),
  periodLabel: z.string().optional(),
  total_amount: z.number().optional(),
  totalAmount: z.number().optional(),
  count: z.number(),
});

export type RevenueBreakdownEntry = z.infer<typeof RevenueBreakdownEntrySchema>;

export const SubscriberGrowthEntrySchema = z.object({
  date: z.string(),
  new: z.number(),
  churned: z.number(),
  net: z.number(),
});

export type SubscriberGrowthEntry = z.infer<typeof SubscriberGrowthEntrySchema>;

// ---------------------------------------------------------------------------
// Creator Applications
// ---------------------------------------------------------------------------

export const CreatorApplicationSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  bio: z.string(),
  category: z.string(),
  portfolio_url: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  social_links: z.record(z.string()).optional(),
  socialLinks: z.record(z.string()).optional(),
  rejection_reason: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  reviewed_by: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  insertedAt: z.string().optional(),
  updated_at: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CreatorApplication = z.infer<typeof CreatorApplicationSchema>;

// ---------------------------------------------------------------------------
// Creator Public Profiles
// ---------------------------------------------------------------------------

export const CreatorPublicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  is_verified: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  is_featured_creator: z.boolean().optional(),
  isFeaturedCreator: z.boolean().optional(),
  subscriber_count: z.number().optional(),
  subscriberCount: z.number().optional(),
  total_posts_created: z.number().optional(),
  totalPostsCreated: z.number().optional(),
  joined_at: z.string().optional(),
  joinedAt: z.string().optional(),
});

export type CreatorPublicProfile = z.infer<typeof CreatorPublicProfileSchema>;

// ---------------------------------------------------------------------------
// Creator Search Results
// ---------------------------------------------------------------------------

export const CreatorSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  is_verified: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  is_featured_creator: z.boolean().optional(),
  isFeaturedCreator: z.boolean().optional(),
  category: z.string().optional(),
  new_subscribers_7d: z.number().optional(),
  newSubscribers7d: z.number().optional(),
  inserted_at: z.string().optional(),
  insertedAt: z.string().optional(),
});

export type CreatorSearchResult = z.infer<typeof CreatorSearchResultSchema>;
