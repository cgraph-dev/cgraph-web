/**
 * useCreatorDashboard Hook
 *
 * Wraps creator store for dashboard-specific data: balance,
 * analytics, payouts, and payout request actions.
 *
 */

;
import { useCreatorStore } from '../store';

/** Hook for creator dashboard. */
export function useCreatorDashboard() {
  const balance = useCreatorStore((s) => s.balance);
  const payouts = useCreatorStore((s) => s.payouts);
  const analyticsOverview = useCreatorStore((s) => s.analyticsOverview);
  const earningsData = useCreatorStore((s) => s.earningsData);
  const subscriberAnalytics = useCreatorStore((s) => s.subscriberAnalytics);
  const contentAnalytics = useCreatorStore((s) => s.contentAnalytics);
  const revenueBreakdown = useCreatorStore((s) => s.revenueBreakdown);
  const subscriberGrowth = useCreatorStore((s) => s.subscriberGrowth);
  const contentAnalyticsEnhanced = useCreatorStore((s) => s.contentAnalyticsEnhanced);
  const isLoadingBalance = useCreatorStore((s) => s.isLoadingBalance);
  const isLoadingPayouts = useCreatorStore((s) => s.isLoadingPayouts);
  const isLoadingAnalytics = useCreatorStore((s) => s.isLoadingAnalytics);
  const isLoading = useCreatorStore((s) => s.isLoading);
  const error = useCreatorStore((s) => s.error);

  const fetchBalance = useCreatorStore((s) => s.fetchBalance);
  const fetchPayouts = useCreatorStore((s) => s.fetchPayouts);
  const fetchAnalyticsOverview = useCreatorStore((s) => s.fetchAnalyticsOverview);
  const fetchAnalyticsEarnings = useCreatorStore((s) => s.fetchAnalyticsEarnings);
  const fetchAnalyticsSubscribers = useCreatorStore((s) => s.fetchAnalyticsSubscribers);
  const fetchAnalyticsContent = useCreatorStore((s) => s.fetchAnalyticsContent);
  const fetchAnalyticsRevenue = useCreatorStore((s) => s.fetchAnalyticsRevenue);
  const fetchSubscriberGrowth = useCreatorStore((s) => s.fetchSubscriberGrowth);
  const fetchContentAnalyticsEnhanced = useCreatorStore((s) => s.fetchContentAnalyticsEnhanced);
  const requestPayoutAction = useCreatorStore((s) => s.requestPayout);

  const requestPayout = async (amount?: number) => {
      return requestPayoutAction(amount);
    };

  const fetchAllAnalytics = async (params?: { period?: string }) => {
      await Promise.all([
        fetchAnalyticsOverview(params),
        fetchAnalyticsEarnings(params),
        fetchAnalyticsRevenue(params),
        fetchSubscriberGrowth(params),
        fetchContentAnalyticsEnhanced(params),
      ]);
    };

  return {
    // Data
    balance,
    payouts,
    analyticsOverview,
    earningsData,
    subscriberAnalytics,
    contentAnalytics,
    revenueBreakdown,
    subscriberGrowth,
    contentAnalyticsEnhanced,

    // Loading states
    isLoading,
    isLoadingBalance,
    isLoadingPayouts,
    isLoadingAnalytics,
    error,

    // Actions
    fetchBalance,
    fetchPayouts,
    fetchAnalyticsOverview,
    fetchAnalyticsEarnings,
    fetchAnalyticsSubscribers,
    fetchAnalyticsContent,
    fetchAnalyticsRevenue,
    fetchSubscriberGrowth,
    fetchContentAnalyticsEnhanced,
    fetchAllAnalytics,
    requestPayout,
  };
}
