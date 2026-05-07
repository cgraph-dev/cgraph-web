/**
 * Creator Store — Implementation
 *
 * Zustand store for creator monetization state.
 * Handles status, balance, payouts, and analytics.
 * Persists creator status to avoid flicker on page load.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { createLogger } from '@/lib/logger';
import { creatorService } from '../services/creatorService';
import type {
  CreatorState,
  PayoutRequest,
  PremiumThread,
  CreatorTier,
  CreatorApplication,
  CreatorSearchResult,
  SubscriberEntry,
} from './creatorStore.types';

function toCreatorStatus(value: string | undefined): CreatorState['creatorStatus'] {
  if (value === 'pending' || value === 'active' || value === 'suspended') {
    return value;
  }
  return 'none';
}

const logger = createLogger('CreatorStore');

// Re-export types
export type {
  CreatorState,
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalytics,
  RevenueBreakdownData,
  SubscriberGrowthData,
  ContentAnalyticsEnhanced,
} from './creatorStore.types';

const emptyPayouts: PayoutRequest[] = [];
const emptyPremiumThreads: PremiumThread[] = [];
const emptyTiers: CreatorTier[] = [];
const emptyCreators: CreatorSearchResult[] = [];
const emptySubscribers: SubscriberEntry[] = [];

const initialState: Omit<
  CreatorState,
  | 'fetchStatus'
  | 'fetchBalance'
  | 'requestPayout'
  | 'fetchPayouts'
  | 'fetchAnalyticsOverview'
  | 'fetchAnalyticsEarnings'
  | 'fetchAnalyticsSubscribers'
  | 'fetchAnalyticsContent'
  | 'fetchAnalyticsRevenue'
  | 'fetchSubscriberGrowth'
  | 'fetchContentAnalyticsEnhanced'
  | 'fetchPremiumThreads'
  | 'fetchTiers'
  | 'onboard'
  | 'refreshOnboard'
  | 'createTier'
  | 'updateTier'
  | 'deleteTier'
  | 'reorderTiers'
  | 'createCheckoutSession'
  | 'cancelCreatorSubscription'
  | 'fetchCreatorSubscription'
  | 'fetchSubscribers'
  | 'giftSubscription'
  | 'revokeSubscription'
  | 'fetchPayoutEstimate'
  | 'fetchConnectOnboarding'
  | 'requestRefund'
  | 'issueCreatorRefund'
  | 'submitApplication'
  | 'fetchApplication'
  | 'fetchFeaturedCreators'
  | 'fetchTrendingCreators'
  | 'searchCreators'
  | 'fetchCreatorProfile'
  | 'reset'
> = {
  isCreator: false,
  onboardingComplete: false,
  creatorStatus: 'none',
  stripeAccountId: null,
  balance: null,
  payouts: emptyPayouts,
  analyticsOverview: null,
  earningsData: null,
  subscriberAnalytics: null,
  contentAnalytics: null,
  revenueBreakdown: null,
  subscriberGrowth: null,
  contentAnalyticsEnhanced: null,
  isLoading: false,
  isLoadingBalance: false,
  isLoadingPayouts: false,
  isLoadingAnalytics: false,
  error: null,
  premiumThreads: emptyPremiumThreads,
  tiers: emptyTiers,
  isLoadingPremium: false,
  application: null,
  isLoadingApplication: false,
  applicationError: null,
  featuredCreators: emptyCreators,
  trendingCreators: emptyCreators,
  searchResults: emptyCreators,
  creatorProfile: null,
  isLoadingDiscovery: false,
  subscribers: emptySubscribers,
  isLoadingSubscribers: false,
  currentSubscription: null,
  payoutEstimate: null,
};

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set) => ({
      ...initialState,

      fetchStatus: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.getStatus();
          set({
            isCreator: data.creatorStatus === 'active' || data.creator_status === 'active',
            onboardingComplete: data.onboardingComplete ?? data.onboarding_complete ?? false,
            creatorStatus: toCreatorStatus(data.creatorStatus ?? data.creator_status),
            stripeAccountId: data.stripeAccountId ?? data.stripe_account_id ?? null,
            isLoading: false,
          });
        } catch (error) {
          logger.error('Failed to fetch creator status', error);
          set({ isLoading: false, error: 'Failed to fetch creator status' });
        }
      },

      fetchBalance: async () => {
        set({ isLoadingBalance: true });
        try {
          const data = await creatorService.getBalance();
          set({ balance: data, isLoadingBalance: false });
        } catch (error) {
          logger.error('Failed to fetch creator balance', error);
          set({ isLoadingBalance: false });
        }
      },

      requestPayout: async (amount?: number): Promise<PayoutRequest | null> => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.requestPayout(amount);
          // Refresh balance and payouts after payout request
          creatorService
            .getBalance()
            .then((b) => set({ balance: b }))
            .catch((err) => logger.warn('Failed to refresh balance after payout', err));
          creatorService
            .listPayouts()
            .then((p) => set({ payouts: Array.isArray(p) ? p : [] }))
            .catch((err) => logger.warn('Failed to refresh payouts after payout', err));
          set({ isLoading: false });
          return data;
        } catch (error) {
          logger.error('Failed to request payout', error);
          set({ isLoading: false, error: 'Failed to request payout' });
          return null;
        }
      },

      fetchPayouts: async (cursor: string | null = null) => {
        set({ isLoadingPayouts: true });
        try {
          const data = await creatorService.listPayouts(cursor);
          set({ payouts: Array.isArray(data) ? data : [], isLoadingPayouts: false });
        } catch (error) {
          logger.error('Failed to fetch payouts', error);
          set({ isLoadingPayouts: false });
        }
      },

      fetchAnalyticsOverview: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsOverview(params);
          set({
            analyticsOverview: data,
            isLoadingAnalytics: false,
          });
        } catch (error) {
          logger.warn('Failed to fetch analytics overview', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsEarnings: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsEarnings(params);
          set({ earningsData: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch analytics earnings', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsSubscribers: async () => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsSubscribers();
          set({ subscriberAnalytics: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch subscriber analytics', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsContent: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsContent(params);
          set({ contentAnalytics: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch content analytics', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsRevenue: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsRevenue(params);
          set({ revenueBreakdown: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch revenue breakdown', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchSubscriberGrowth: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsSubscriberGrowth(params);
          set({ subscriberGrowth: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch subscriber growth', error);
          set({ isLoadingAnalytics: false });
        }
      },

      fetchContentAnalyticsEnhanced: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsContent(params);
          set({ contentAnalyticsEnhanced: data, isLoadingAnalytics: false });
        } catch (error) {
          logger.warn('Failed to fetch enhanced content analytics', error);
          set({ isLoadingAnalytics: false });
        }
      },

      onboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.onboard();
          set({ isLoading: false });
          const url = data.onboarding_url ?? data.url ?? '';
          return url ? { url } : null;
        } catch (error) {
          logger.error('Failed to start onboarding', error);
          set({ isLoading: false, error: 'Failed to start onboarding' });
          return null;
        }
      },

      refreshOnboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.refreshOnboard();
          set({ isLoading: false });
          const url = data.onboarding_url ?? data.url ?? '';
          return url ? { url } : null;
        } catch (error) {
          logger.error('Failed to refresh onboarding link', error);
          set({ isLoading: false, error: 'Failed to refresh onboarding link' });
          return null;
        }
      },

      fetchPremiumThreads: async () => {
        set({ isLoadingPremium: true });
        try {
          const data = await creatorService.listPremiumThreads();
          set({ premiumThreads: Array.isArray(data) ? data : [], isLoadingPremium: false });
        } catch (error) {
          logger.error('Failed to fetch premium threads', error);
          set({ isLoadingPremium: false });
        }
      },

      fetchTiers: async () => {
        try {
          const data = await creatorService.listTiers();
          set({ tiers: Array.isArray(data) ? data : [] });
        } catch (error) {
          // Tier fetch failures are non-critical — cached data remains
          logger.warn('Failed to fetch tiers, using cached data', error);
        }
      },

      // -----------------------------------------------------------------
      // Tier Management (Phase 48-01)
      // -----------------------------------------------------------------

      createTier: async (attrs) => {
        try {
          const data = await creatorService.createTier(attrs);
          // Refresh tiers list
          creatorService
            .listTiers()
            .then((t) => set({ tiers: Array.isArray(t) ? t : [] }))
            .catch((err) => logger.warn('Failed to refresh tiers after create', err));
          return data;
        } catch (error) {
          logger.error('Failed to create tier', error);
          return null;
        }
      },

      updateTier: async (tierId, attrs) => {
        try {
          const data = await creatorService.updateTier(tierId, attrs);
          // Refresh tiers list
          creatorService
            .listTiers()
            .then((t) => set({ tiers: Array.isArray(t) ? t : [] }))
            .catch((err) => logger.warn('Failed to refresh tiers after update', err));
          return data;
        } catch (error) {
          logger.error('Failed to update tier', error);
          return null;
        }
      },

      deleteTier: async (tierId) => {
        try {
          await creatorService.deleteTier(tierId);
          // Refresh tiers list
          creatorService
            .listTiers()
            .then((t) => set({ tiers: Array.isArray(t) ? t : [] }))
            .catch((err) => logger.warn('Failed to refresh tiers after delete', err));
          return true;
        } catch (error) {
          logger.error('Failed to delete tier', error);
          return false;
        }
      },

      reorderTiers: async (tierIds) => {
        try {
          await creatorService.reorderTiers(tierIds);
          // Refresh tiers list
          creatorService
            .listTiers()
            .then((t) => set({ tiers: Array.isArray(t) ? t : [] }))
            .catch((err) => logger.warn('Failed to refresh tiers after reorder', err));
          return true;
        } catch (error) {
          logger.error('Failed to reorder tiers', error);
          return false;
        }
      },

      // -----------------------------------------------------------------
      // Subscription Checkout (Phase 48-01)
      // -----------------------------------------------------------------

      createCheckoutSession: async (creatorId, tierId) => {
        try {
          return await creatorService.createCheckoutSession(creatorId, tierId);
        } catch (error) {
          logger.error('Failed to create checkout session', error);
          return null;
        }
      },

      cancelCreatorSubscription: async (creatorId) => {
        try {
          const data = await creatorService.cancelCreatorSubscription(creatorId);
          set({ currentSubscription: null });
          return data;
        } catch (error) {
          logger.error('Failed to cancel subscription', error);
          return null;
        }
      },

      fetchCreatorSubscription: async (creatorId) => {
        try {
          const data = await creatorService.getCreatorSubscription(creatorId);
          set({ currentSubscription: data ?? null });
        } catch (error) {
          logger.error('Failed to fetch subscription', error);
          set({ currentSubscription: null });
        }
      },

      // -----------------------------------------------------------------
      // Subscriber Management (Phase 48-01)
      // -----------------------------------------------------------------

      fetchSubscribers: async (params) => {
        set({ isLoadingSubscribers: true });
        try {
          const data = await creatorService.listSubscribers(params);
          set({ subscribers: Array.isArray(data) ? data : [], isLoadingSubscribers: false });
        } catch (error) {
          logger.error('Failed to fetch subscribers', error);
          set({ isLoadingSubscribers: false });
        }
      },

      giftSubscription: async (attrs) => {
        try {
          const data = await creatorService.giftSubscription(attrs);
          // Refresh subscribers
          creatorService
            .listSubscribers()
            .then((s) => set({ subscribers: Array.isArray(s) ? s : [] }))
            .catch((err) => logger.warn('Failed to refresh subscribers after gift', err));
          return data;
        } catch (error) {
          logger.error('Failed to gift subscription', error);
          return null;
        }
      },

      revokeSubscription: async (subscriptionId) => {
        try {
          await creatorService.revokeSubscription(subscriptionId);
          // Refresh subscribers
          creatorService
            .listSubscribers()
            .then((s) => set({ subscribers: Array.isArray(s) ? s : [] }))
            .catch((err) => logger.warn('Failed to refresh subscribers after revoke', err));
          return true;
        } catch (error) {
          logger.error('Failed to revoke subscription', error);
          return false;
        }
      },

      // -----------------------------------------------------------------
      // Payouts (Phase 48-01)
      // -----------------------------------------------------------------

      fetchPayoutEstimate: async () => {
        try {
          const data = await creatorService.getPayoutEstimate();
          set({ payoutEstimate: data });
        } catch (error) {
          logger.error('Failed to fetch payout estimate', error);
        }
      },

      fetchConnectOnboarding: async () => {
        try {
          return await creatorService.getConnectOnboarding();
        } catch (error) {
          logger.error('Failed to fetch connect onboarding', error);
          return null;
        }
      },

      // -----------------------------------------------------------------
      // Refunds (Phase 48-01)
      // -----------------------------------------------------------------

      requestRefund: async (subscriptionId, attrs) => {
        try {
          return await creatorService.requestRefund(subscriptionId, attrs);
        } catch (error) {
          logger.error('Failed to request refund', error);
          return null;
        }
      },

      issueCreatorRefund: async (subscriptionId, reason) => {
        try {
          return await creatorService.issueCreatorRefund(subscriptionId, reason);
        } catch (error) {
          logger.error('Failed to issue creator refund', error);
          return null;
        }
      },

      // -----------------------------------------------------------------
      // Creator Applications
      // -----------------------------------------------------------------

      submitApplication: async (attrs): Promise<CreatorApplication | null> => {
        set({ isLoadingApplication: true, applicationError: null });
        try {
          const data = await creatorService.submitApplication(attrs);
          set({ application: data, isLoadingApplication: false });
          return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to submit application';
          logger.error('Failed to submit creator application', error);
          set({ isLoadingApplication: false, applicationError: message });
          return null;
        }
      },

      fetchApplication: async () => {
        set({ isLoadingApplication: true, applicationError: null });
        try {
          const data = await creatorService.getApplication();
          set({ application: data, isLoadingApplication: false });
        } catch (error) {
          logger.error('Failed to fetch creator application', error);
          set({ isLoadingApplication: false, application: null });
        }
      },

      // -----------------------------------------------------------------
      // Creator Discovery
      // -----------------------------------------------------------------

      fetchFeaturedCreators: async () => {
        set({ isLoadingDiscovery: true });
        try {
          const data = await creatorService.getFeaturedCreators({ limit: 20 });
          set({ featuredCreators: Array.isArray(data) ? data : [], isLoadingDiscovery: false });
        } catch (error) {
          logger.error('Failed to fetch featured creators', error);
          set({ isLoadingDiscovery: false });
        }
      },

      fetchTrendingCreators: async () => {
        set({ isLoadingDiscovery: true });
        try {
          const data = await creatorService.getTrendingCreators({ limit: 20 });
          set({ trendingCreators: Array.isArray(data) ? data : [], isLoadingDiscovery: false });
        } catch (error) {
          logger.error('Failed to fetch trending creators', error);
          set({ isLoadingDiscovery: false });
        }
      },

      searchCreators: async (params) => {
        set({ isLoadingDiscovery: true });
        try {
          const data = await creatorService.searchCreators(params);
          set({ searchResults: Array.isArray(data) ? data : [], isLoadingDiscovery: false });
        } catch (error) {
          logger.error('Failed to search creators', error);
          set({ isLoadingDiscovery: false, searchResults: [] });
        }
      },

      fetchCreatorProfile: async (username: string) => {
        set({ isLoadingDiscovery: true, creatorProfile: null });
        try {
          const data = await creatorService.getCreatorProfile(username);
          set({ creatorProfile: data, isLoadingDiscovery: false });
        } catch (error) {
          logger.error('Failed to fetch creator profile', error);
          set({ isLoadingDiscovery: false });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.creatorStore,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        isCreator: state.isCreator,
        onboardingComplete: state.onboardingComplete,
        creatorStatus: state.creatorStatus,
      }),
    }
  )
);
