/**
 * useCreatorDashboard Hook Unit Tests
 *
 * Tests for the creator dashboard hook that wraps the creator store
 * for dashboard-specific data access and actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const mockStoreState = {
  balance: null as Record<string, unknown> | null,
  payouts: [] as unknown[],
  analyticsOverview: null as Record<string, unknown> | null,
  earningsData: null as Record<string, unknown> | null,
  subscriberAnalytics: null as Record<string, unknown> | null,
  contentAnalytics: null as Record<string, unknown> | null,
  isLoadingBalance: false,
  isLoadingPayouts: false,
  isLoadingAnalytics: false,
  isLoading: false,
  error: null as string | null,
  fetchBalance: vi.fn(),
  fetchPayouts: vi.fn(),
  fetchAnalyticsOverview: vi.fn(),
  fetchAnalyticsEarnings: vi.fn(),
  fetchAnalyticsSubscribers: vi.fn(),
  fetchAnalyticsContent: vi.fn(),
  fetchAnalyticsRevenue: vi.fn(),
  fetchSubscriberGrowth: vi.fn(),
  fetchContentAnalyticsEnhanced: vi.fn(),
  requestPayout: vi.fn(),
};

vi.mock('@/modules/creator/store', () => ({
  useCreatorStore: vi.fn((selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState)
  ),
}));

import { useCreatorDashboard } from '../useCreatorDashboard';

// Tests

describe('useCreatorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.balance = null;
    mockStoreState.payouts = [];
    mockStoreState.analyticsOverview = null;
    mockStoreState.earningsData = null;
    mockStoreState.subscriberAnalytics = null;
    mockStoreState.contentAnalytics = null;
    mockStoreState.isLoadingBalance = false;
    mockStoreState.isLoadingPayouts = false;
    mockStoreState.isLoadingAnalytics = false;
    mockStoreState.isLoading = false;
    mockStoreState.error = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return all data fields from the store', () => {
    mockStoreState.balance = { available: 100, pending: 20, currency: 'USD' };
    mockStoreState.analyticsOverview = { subscriberCount: 42 };

    const { result } = renderHook(() => useCreatorDashboard());

    expect(result.current.balance).toEqual({ available: 100, pending: 20, currency: 'USD' });
    expect(result.current.analyticsOverview).toEqual({ subscriberCount: 42 });
    expect(result.current.payouts).toEqual([]);
    expect(result.current.earningsData).toBeNull();
    expect(result.current.subscriberAnalytics).toBeNull();
    expect(result.current.contentAnalytics).toBeNull();
  });

  it('should return loading states', () => {
    mockStoreState.isLoadingBalance = true;
    mockStoreState.isLoadingPayouts = true;
    mockStoreState.isLoadingAnalytics = true;
    mockStoreState.isLoading = true;

    const { result } = renderHook(() => useCreatorDashboard());

    expect(result.current.isLoadingBalance).toBe(true);
    expect(result.current.isLoadingPayouts).toBe(true);
    expect(result.current.isLoadingAnalytics).toBe(true);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return error from store', () => {
    mockStoreState.error = 'Something went wrong';

    const { result } = renderHook(() => useCreatorDashboard());

    expect(result.current.error).toBe('Something went wrong');
  });

  it('should expose store action functions', () => {
    const { result } = renderHook(() => useCreatorDashboard());

    expect(typeof result.current.fetchBalance).toBe('function');
    expect(typeof result.current.fetchPayouts).toBe('function');
    expect(typeof result.current.fetchAnalyticsOverview).toBe('function');
    expect(typeof result.current.fetchAnalyticsEarnings).toBe('function');
    expect(typeof result.current.fetchAnalyticsSubscribers).toBe('function');
    expect(typeof result.current.fetchAnalyticsContent).toBe('function');
    expect(typeof result.current.fetchAnalyticsRevenue).toBe('function');
    expect(typeof result.current.fetchSubscriberGrowth).toBe('function');
    expect(typeof result.current.fetchContentAnalyticsEnhanced).toBe('function');
    expect(typeof result.current.fetchAllAnalytics).toBe('function');
    expect(typeof result.current.requestPayout).toBe('function');
  });

  it('requestPayout should delegate to store action', async () => {
    const payoutResult = { id: 'payout-1', amount: 50 };
    mockStoreState.requestPayout.mockResolvedValueOnce(payoutResult);

    const { result } = renderHook(() => useCreatorDashboard());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.requestPayout(50);
    });

    expect(mockStoreState.requestPayout).toHaveBeenCalledWith(50);
    expect(returnValue).toEqual(payoutResult);
  });

  it('requestPayout should work without amount', async () => {
    mockStoreState.requestPayout.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCreatorDashboard());

    await act(async () => {
      await result.current.requestPayout();
    });

    expect(mockStoreState.requestPayout).toHaveBeenCalledWith(undefined);
  });

  it('fetchAllAnalytics should call overview and earnings in parallel', async () => {
    mockStoreState.fetchAnalyticsOverview.mockResolvedValueOnce(undefined);
    mockStoreState.fetchAnalyticsEarnings.mockResolvedValueOnce(undefined);
    mockStoreState.fetchAnalyticsRevenue.mockResolvedValueOnce(undefined);
    mockStoreState.fetchSubscriberGrowth.mockResolvedValueOnce(undefined);
    mockStoreState.fetchContentAnalyticsEnhanced.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCreatorDashboard());

    await act(async () => {
      await result.current.fetchAllAnalytics({ period: '30d' });
    });

    expect(mockStoreState.fetchAnalyticsOverview).toHaveBeenCalledWith({ period: '30d' });
    expect(mockStoreState.fetchAnalyticsEarnings).toHaveBeenCalledWith({ period: '30d' });
    expect(mockStoreState.fetchAnalyticsRevenue).toHaveBeenCalledWith({ period: '30d' });
    expect(mockStoreState.fetchSubscriberGrowth).toHaveBeenCalledWith({ period: '30d' });
    expect(mockStoreState.fetchContentAnalyticsEnhanced).toHaveBeenCalledWith({ period: '30d' });
  });

  it('fetchAllAnalytics should work without params', async () => {
    mockStoreState.fetchAnalyticsOverview.mockResolvedValueOnce(undefined);
    mockStoreState.fetchAnalyticsEarnings.mockResolvedValueOnce(undefined);
    mockStoreState.fetchAnalyticsRevenue.mockResolvedValueOnce(undefined);
    mockStoreState.fetchSubscriberGrowth.mockResolvedValueOnce(undefined);
    mockStoreState.fetchContentAnalyticsEnhanced.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCreatorDashboard());

    await act(async () => {
      await result.current.fetchAllAnalytics();
    });

    expect(mockStoreState.fetchAnalyticsOverview).toHaveBeenCalledWith(undefined);
    expect(mockStoreState.fetchAnalyticsEarnings).toHaveBeenCalledWith(undefined);
    expect(mockStoreState.fetchAnalyticsRevenue).toHaveBeenCalledWith(undefined);
    expect(mockStoreState.fetchSubscriberGrowth).toHaveBeenCalledWith(undefined);
    expect(mockStoreState.fetchContentAnalyticsEnhanced).toHaveBeenCalledWith(undefined);
  });
});
