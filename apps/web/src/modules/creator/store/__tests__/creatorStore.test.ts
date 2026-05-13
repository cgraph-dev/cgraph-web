/**
 * Creator Store Unit Tests
 *
 * Tests for the Zustand creator monetization store.
 * Covers initial state, status fetching, balance, payouts,
 * analytics, onboarding, premium threads, tiers, and reset.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { useCreatorStore } from '@/modules/creator/store';
const { mockCreatorService } = vi.hoisted(() => ({
  mockCreatorService: {
    getStatus: vi.fn(),
    getBalance: vi.fn(),
    requestPayout: vi.fn(),
    listPayouts: vi.fn(),
    getAnalyticsOverview: vi.fn(),
    getAnalyticsEarnings: vi.fn(),
    getAnalyticsSubscribers: vi.fn(),
    getAnalyticsContent: vi.fn(),
    onboard: vi.fn(),
    refreshOnboard: vi.fn(),
    listPremiumThreads: vi.fn(),
    listTiers: vi.fn(),
    createPremiumThread: vi.fn(),
    createTier: vi.fn(),
  },
}));

vi.mock('@/modules/creator/services/creatorService', () => ({
  creatorService: mockCreatorService,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@/lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));
function makeBalance() {
  return {
    available: 150.0,
    pending: 25.0,
    currency: 'USD',
    totalEarnedCents: 50000,
    totalPaidOutCents: 35000,
    availableBalanceCents: 15000,
  };
}

function makePayout(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payout-1',
    amount: 100,
    amountCents: 10000,
    status: 'completed' as const,
    currency: 'USD',
    requestedAt: '2026-01-15T12:00:00Z',
    completedAt: '2026-01-16T12:00:00Z',
    failureReason: null,
    createdAt: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

function makeAnalyticsOverview() {
  return {
    subscriberCount: 142,
    mrrCents: 28400,
    churnRate: 0.03,
    platformFeePercent: 10,
    revenue30dCents: 28400,
    totalSubscribers: 142,
    avgRevenuePerSubscriberCents: 200,
    pendingBalanceCents: 5000,
  };
}

function makeEarningsData() {
  return {
    earningsOverTime: [
      { month: '2026-01', netCents: 12000 },
      { month: '2026-02', netCents: 15500 },
    ],
    topForums: [{ forumId: 'f1', name: 'Tech Forum', subscribers: 80, mrrCents: 16000 }],
  };
}

function makeSubscriberAnalytics() {
  return {
    totalSubscribers: 142,
    newSubscribers: 18,
    churned: 4,
    netGrowth: 14,
  };
}

function makeContentAnalytics() {
  return {
    totalPosts: 56,
    topPosts: [{ id: 'p1', title: 'Top Post', views: 1200, engagement: 0.85 }],
  };
}

function makePremiumThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pt-1',
    threadId: 'thread-abc',
    creatorId: 'creator-1',
    priceNodes: 50,
    subscriberOnly: false,
    previewLength: 200,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeTier(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tier-1',
    creatorId: 'creator-1',
    forumId: 'forum-1',
    name: 'Gold',
    priceMonthlyNodes: 100,
    benefits: { exclusiveContent: true },
    maxSubscribers: null,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
const getInitialState = () => ({
  isCreator: false,
  onboardingComplete: false,
  creatorStatus: 'none' as const,
  stripeAccountId: null,
  balance: null,
  payouts: [],
  analyticsOverview: null,
  earningsData: null,
  subscriberAnalytics: null,
  contentAnalytics: null,
  isLoading: false,
  isLoadingBalance: false,
  isLoadingPayouts: false,
  isLoadingAnalytics: false,
  error: null,
  premiumThreads: [],
  tiers: [],
  isLoadingPremium: false,
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  useCreatorStore.setState(getInitialState());
});

// Tests

describe('creatorStore', () => {
  describe('initial state', () => {
    it('should have correct default values', () => {
      const s = useCreatorStore.getState();
      expect(s.isCreator).toBe(false);
      expect(s.onboardingComplete).toBe(false);
      expect(s.creatorStatus).toBe('none');
      expect(s.stripeAccountId).toBeNull();
      expect(s.balance).toBeNull();
      expect(s.payouts).toEqual([]);
      expect(s.analyticsOverview).toBeNull();
      expect(s.earningsData).toBeNull();
      expect(s.subscriberAnalytics).toBeNull();
      expect(s.contentAnalytics).toBeNull();
      expect(s.premiumThreads).toEqual([]);
      expect(s.tiers).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.isLoadingBalance).toBe(false);
      expect(s.isLoadingPayouts).toBe(false);
      expect(s.isLoadingAnalytics).toBe(false);
      expect(s.isLoadingPremium).toBe(false);
      expect(s.error).toBeNull();
    });

    it('should expose all expected actions', () => {
      const s = useCreatorStore.getState();
      expect(typeof s.fetchStatus).toBe('function');
      expect(typeof s.fetchBalance).toBe('function');
      expect(typeof s.requestPayout).toBe('function');
      expect(typeof s.fetchPayouts).toBe('function');
      expect(typeof s.fetchAnalyticsOverview).toBe('function');
      expect(typeof s.fetchAnalyticsEarnings).toBe('function');
      expect(typeof s.fetchAnalyticsSubscribers).toBe('function');
      expect(typeof s.fetchAnalyticsContent).toBe('function');
      expect(typeof s.fetchPremiumThreads).toBe('function');
      expect(typeof s.fetchTiers).toBe('function');
      expect(typeof s.onboard).toBe('function');
      expect(typeof s.refreshOnboard).toBe('function');
      expect(typeof s.reset).toBe('function');
    });
  });
  describe('fetchStatus', () => {
    it('should set creator status on success', async () => {
      mockCreatorService.getStatus.mockResolvedValueOnce({
        isCreator: true,
        onboardingComplete: true,
        creatorStatus: 'active',
        stripeAccountId: 'acct_123',
      });

      await useCreatorStore.getState().fetchStatus();

      const s = useCreatorStore.getState();
      expect(s.isCreator).toBe(true);
      expect(s.onboardingComplete).toBe(true);
      expect(s.creatorStatus).toBe('active');
      expect(s.stripeAccountId).toBe('acct_123');
      expect(s.isLoading).toBe(false);
      expect(s.error).toBeNull();
    });

    it('should set isCreator false for non-active statuses', async () => {
      mockCreatorService.getStatus.mockResolvedValueOnce({
        isCreator: false,
        onboardingComplete: false,
        creatorStatus: 'pending',
      });

      await useCreatorStore.getState().fetchStatus();

      const s = useCreatorStore.getState();
      expect(s.isCreator).toBe(false);
      expect(s.creatorStatus).toBe('pending');
    });

    it('should default creatorStatus to none when missing', async () => {
      mockCreatorService.getStatus.mockResolvedValueOnce({
        isCreator: false,
        onboardingComplete: false,
        creatorStatus: undefined,
      });

      await useCreatorStore.getState().fetchStatus();

      expect(useCreatorStore.getState().creatorStatus).toBe('none');
    });

    it('should handle errors gracefully', async () => {
      mockCreatorService.getStatus.mockRejectedValueOnce(new Error('Network error'));

      await useCreatorStore.getState().fetchStatus();

      const s = useCreatorStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.error).toBe('Failed to fetch creator status');
    });

    it('should set isLoading while fetching', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockCreatorService.getStatus.mockReturnValueOnce(pendingPromise);

      const fetchPromise = useCreatorStore.getState().fetchStatus();
      expect(useCreatorStore.getState().isLoading).toBe(true);

      resolvePromise!({
        isCreator: false,
        onboardingComplete: false,
        creatorStatus: 'none',
      });
      await fetchPromise;

      expect(useCreatorStore.getState().isLoading).toBe(false);
    });
  });
  describe('fetchBalance', () => {
    it('should set balance on success', async () => {
      const balance = makeBalance();
      mockCreatorService.getBalance.mockResolvedValueOnce(balance);

      await useCreatorStore.getState().fetchBalance();

      const s = useCreatorStore.getState();
      expect(s.balance).toEqual(balance);
      expect(s.isLoadingBalance).toBe(false);
    });

    it('should handle errors without setting error message', async () => {
      mockCreatorService.getBalance.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchBalance();

      const s = useCreatorStore.getState();
      expect(s.isLoadingBalance).toBe(false);
      expect(s.balance).toBeNull();
    });
  });
  describe('requestPayout', () => {
    it('should return payout data on success', async () => {
      const payout = makePayout();
      mockCreatorService.requestPayout.mockResolvedValueOnce(payout);
      mockCreatorService.getBalance.mockResolvedValueOnce(makeBalance());
      mockCreatorService.listPayouts.mockResolvedValueOnce([payout]);

      const result = await useCreatorStore.getState().requestPayout(100);

      expect(result).toEqual(payout);
      expect(mockCreatorService.requestPayout).toHaveBeenCalledWith(100);
      expect(useCreatorStore.getState().isLoading).toBe(false);
    });

    it('should call without amount parameter', async () => {
      const payout = makePayout();
      mockCreatorService.requestPayout.mockResolvedValueOnce(payout);
      mockCreatorService.getBalance.mockResolvedValueOnce(makeBalance());
      mockCreatorService.listPayouts.mockResolvedValueOnce([payout]);

      await useCreatorStore.getState().requestPayout();

      expect(mockCreatorService.requestPayout).toHaveBeenCalledWith(undefined);
    });

    it('should return null and set error on failure', async () => {
      mockCreatorService.requestPayout.mockRejectedValueOnce(new Error('Fail'));

      const result = await useCreatorStore.getState().requestPayout(50);

      expect(result).toBeNull();
      expect(useCreatorStore.getState().error).toBe('Failed to request payout');
      expect(useCreatorStore.getState().isLoading).toBe(false);
    });

    it('should refresh balance and payouts after successful payout', async () => {
      const payout = makePayout();
      const updatedBalance = makeBalance();
      mockCreatorService.requestPayout.mockResolvedValueOnce(payout);
      mockCreatorService.getBalance.mockResolvedValueOnce(updatedBalance);
      mockCreatorService.listPayouts.mockResolvedValueOnce([payout]);

      await useCreatorStore.getState().requestPayout(100);

      // Wait for background refreshes
      await vi.waitFor(() => {
        expect(mockCreatorService.getBalance).toHaveBeenCalled();
        expect(mockCreatorService.listPayouts).toHaveBeenCalled();
      });
    });
  });
  describe('fetchPayouts', () => {
    it('should set payouts on success', async () => {
      const payouts = [makePayout(), makePayout({ id: 'payout-2' })];
      mockCreatorService.listPayouts.mockResolvedValueOnce(payouts);

      await useCreatorStore.getState().fetchPayouts();

      const s = useCreatorStore.getState();
      expect(s.payouts).toEqual(payouts);
      expect(s.isLoadingPayouts).toBe(false);
    });

    it('should pass cursor parameter', async () => {
      mockCreatorService.listPayouts.mockResolvedValueOnce([]);

      await useCreatorStore.getState().fetchPayouts('cursor-3');

      expect(mockCreatorService.listPayouts).toHaveBeenCalledWith('cursor-3');
    });

    it('should default to no cursor', async () => {
      mockCreatorService.listPayouts.mockResolvedValueOnce([]);

      await useCreatorStore.getState().fetchPayouts();

      expect(mockCreatorService.listPayouts).toHaveBeenCalledWith(null);
    });

    it('should handle errors', async () => {
      mockCreatorService.listPayouts.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchPayouts();

      expect(useCreatorStore.getState().isLoadingPayouts).toBe(false);
    });
  });
  describe('fetchAnalyticsOverview', () => {
    it('should set analyticsOverview on success', async () => {
      const overview = makeAnalyticsOverview();
      mockCreatorService.getAnalyticsOverview.mockResolvedValueOnce(overview);

      await useCreatorStore.getState().fetchAnalyticsOverview({ period: '30d' });

      expect(useCreatorStore.getState().analyticsOverview).toEqual(overview);
      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });

    it('should pass params to service', async () => {
      mockCreatorService.getAnalyticsOverview.mockResolvedValueOnce(makeAnalyticsOverview());

      await useCreatorStore.getState().fetchAnalyticsOverview({ period: '7d' });

      expect(mockCreatorService.getAnalyticsOverview).toHaveBeenCalledWith({ period: '7d' });
    });

    it('should handle errors', async () => {
      mockCreatorService.getAnalyticsOverview.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchAnalyticsOverview();

      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });
  });

  describe('fetchAnalyticsEarnings', () => {
    it('should set earningsData on success', async () => {
      const earnings = makeEarningsData();
      mockCreatorService.getAnalyticsEarnings.mockResolvedValueOnce(earnings);

      await useCreatorStore.getState().fetchAnalyticsEarnings({ period: '30d' });

      expect(useCreatorStore.getState().earningsData).toEqual(earnings);
      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });

    it('should handle errors', async () => {
      mockCreatorService.getAnalyticsEarnings.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchAnalyticsEarnings();

      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });
  });

  describe('fetchAnalyticsSubscribers', () => {
    it('should set subscriberAnalytics on success', async () => {
      const subs = makeSubscriberAnalytics();
      mockCreatorService.getAnalyticsSubscribers.mockResolvedValueOnce(subs);

      await useCreatorStore.getState().fetchAnalyticsSubscribers();

      expect(useCreatorStore.getState().subscriberAnalytics).toEqual(subs);
      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });

    it('should handle errors', async () => {
      mockCreatorService.getAnalyticsSubscribers.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchAnalyticsSubscribers();

      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });
  });

  describe('fetchAnalyticsContent', () => {
    it('should set contentAnalytics on success', async () => {
      const content = makeContentAnalytics();
      mockCreatorService.getAnalyticsContent.mockResolvedValueOnce(content);

      await useCreatorStore.getState().fetchAnalyticsContent();

      expect(useCreatorStore.getState().contentAnalytics).toEqual(content);
      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });

    it('should handle errors', async () => {
      mockCreatorService.getAnalyticsContent.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchAnalyticsContent();

      expect(useCreatorStore.getState().isLoadingAnalytics).toBe(false);
    });
  });
  describe('onboard', () => {
    it('should return url from onboarding_url field', async () => {
      mockCreatorService.onboard.mockResolvedValueOnce({
        onboarding_url: 'https://stripe.com/onboard/123',
        url: '',
      });

      const result = await useCreatorStore.getState().onboard();

      expect(result).toEqual({ url: 'https://stripe.com/onboard/123' });
      expect(useCreatorStore.getState().isLoading).toBe(false);
    });

    it('should fall back to url field', async () => {
      mockCreatorService.onboard.mockResolvedValueOnce({
        onboarding_url: '',
        url: 'https://stripe.com/fallback',
      });

      const result = await useCreatorStore.getState().onboard();

      expect(result).toEqual({ url: 'https://stripe.com/fallback' });
    });

    it('should return null on error', async () => {
      mockCreatorService.onboard.mockRejectedValueOnce(new Error('Fail'));

      const result = await useCreatorStore.getState().onboard();

      expect(result).toBeNull();
      expect(useCreatorStore.getState().error).toBe('Failed to start onboarding');
      expect(useCreatorStore.getState().isLoading).toBe(false);
    });
  });

  describe('refreshOnboard', () => {
    it('should return url from onboarding_url field', async () => {
      mockCreatorService.refreshOnboard.mockResolvedValueOnce({
        onboarding_url: 'https://stripe.com/refresh/456',
        url: '',
      });

      const result = await useCreatorStore.getState().refreshOnboard();

      expect(result).toEqual({ url: 'https://stripe.com/refresh/456' });
      expect(useCreatorStore.getState().isLoading).toBe(false);
    });

    it('should return null on error', async () => {
      mockCreatorService.refreshOnboard.mockRejectedValueOnce(new Error('Fail'));

      const result = await useCreatorStore.getState().refreshOnboard();

      expect(result).toBeNull();
      expect(useCreatorStore.getState().error).toBe('Failed to refresh onboarding link');
    });
  });
  describe('fetchPremiumThreads', () => {
    it('should set premiumThreads on success', async () => {
      const threads = [
        makePremiumThread(),
        makePremiumThread({ id: 'pt-2', threadId: 'thread-def' }),
      ];
      mockCreatorService.listPremiumThreads.mockResolvedValueOnce(threads);

      await useCreatorStore.getState().fetchPremiumThreads();

      expect(useCreatorStore.getState().premiumThreads).toEqual(threads);
      expect(useCreatorStore.getState().isLoadingPremium).toBe(false);
    });

    it('should handle errors', async () => {
      mockCreatorService.listPremiumThreads.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchPremiumThreads();

      expect(useCreatorStore.getState().isLoadingPremium).toBe(false);
    });
  });
  describe('fetchTiers', () => {
    it('should set tiers on success', async () => {
      const tiers = [makeTier(), makeTier({ id: 'tier-2', name: 'Silver' })];
      mockCreatorService.listTiers.mockResolvedValueOnce(tiers);

      await useCreatorStore.getState().fetchTiers();

      expect(useCreatorStore.getState().tiers).toEqual(tiers);
    });

    it('should silently handle errors and keep cached data', async () => {
      const existingTiers = [makeTier()];
      useCreatorStore.setState({ tiers: existingTiers });
      mockCreatorService.listTiers.mockRejectedValueOnce(new Error('Fail'));

      await useCreatorStore.getState().fetchTiers();

      expect(useCreatorStore.getState().tiers).toEqual(existingTiers);
    });
  });
  describe('reset', () => {
    it('should restore all state to initial values', async () => {
      // Populate the store
      useCreatorStore.setState({
        isCreator: true,
        onboardingComplete: true,
        creatorStatus: 'active',
        stripeAccountId: 'acct_123',
        balance: makeBalance(),
        payouts: [makePayout()],
        analyticsOverview: makeAnalyticsOverview(),
        earningsData: makeEarningsData(),
        premiumThreads: [makePremiumThread()],
        tiers: [makeTier()],
        error: 'some error',
      });

      useCreatorStore.getState().reset();

      const s = useCreatorStore.getState();
      expect(s.isCreator).toBe(false);
      expect(s.onboardingComplete).toBe(false);
      expect(s.creatorStatus).toBe('none');
      expect(s.stripeAccountId).toBeNull();
      expect(s.balance).toBeNull();
      expect(s.payouts).toEqual([]);
      expect(s.analyticsOverview).toBeNull();
      expect(s.premiumThreads).toEqual([]);
      expect(s.tiers).toEqual([]);
      expect(s.error).toBeNull();
    });
  });
  describe('combined workflows', () => {
    it('should handle full creator lifecycle: status -> balance -> payout -> reset', async () => {
      // Fetch status
      mockCreatorService.getStatus.mockResolvedValueOnce({
        isCreator: true,
        onboardingComplete: true,
        creatorStatus: 'active',
        stripeAccountId: 'acct_xyz',
      });
      await useCreatorStore.getState().fetchStatus();
      expect(useCreatorStore.getState().isCreator).toBe(true);

      // Fetch balance
      mockCreatorService.getBalance.mockResolvedValueOnce(makeBalance());
      await useCreatorStore.getState().fetchBalance();
      expect(useCreatorStore.getState().balance).not.toBeNull();

      // Request payout
      const payout = makePayout();
      mockCreatorService.requestPayout.mockResolvedValueOnce(payout);
      mockCreatorService.getBalance.mockResolvedValueOnce(makeBalance());
      mockCreatorService.listPayouts.mockResolvedValueOnce([payout]);
      const result = await useCreatorStore.getState().requestPayout(100);
      expect(result).toEqual(payout);

      // Reset
      useCreatorStore.getState().reset();
      expect(useCreatorStore.getState().isCreator).toBe(false);
      expect(useCreatorStore.getState().balance).toBeNull();
    });
  });
});
