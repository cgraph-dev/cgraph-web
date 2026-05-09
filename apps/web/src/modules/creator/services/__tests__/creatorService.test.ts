/**
 * Creator Service Unit Tests
 *
 * Tests for the creator monetization API service.
 * Covers all API call patterns, parameter passing, and response extraction.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

import { creatorService } from '../creatorService';
function wrapResponse<T>(data: T) {
  return { data: { data } };
}

// Tests

describe('creatorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const payoutFixture = (overrides: Record<string, unknown> = {}) => ({
    id: 'payout-1',
    amount: 100,
    amountCents: 10000,
    status: 'pending',
    currency: 'USD',
    requestedAt: '2026-01-15T12:00:00Z',
    completedAt: null,
    failureReason: null,
    createdAt: '2026-01-15T12:00:00Z',
    ...overrides,
  });

  describe('onboard', () => {
    it('should POST to /api/v1/creator/onboard and return data', async () => {
      const responseData = {
        url: 'https://stripe.com/onboard',
        onboarding_url: 'https://stripe.com/onboard',
      };
      mockApi.post.mockResolvedValueOnce(wrapResponse(responseData));

      const result = await creatorService.onboard();

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/onboard');
      expect(result).toEqual(responseData);
    });
  });

  describe('getStatus', () => {
    it('should GET /api/v1/creator/status and return status data', async () => {
      const statusData = {
        isCreator: true,
        onboardingComplete: true,
        creatorStatus: 'active' as const,
        stripeAccountId: 'acct_123',
        onboardedAt: '2026-01-01T00:00:00Z',
      };
      mockApi.get.mockResolvedValueOnce(wrapResponse(statusData));

      const result = await creatorService.getStatus();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/status');
      expect(result).toEqual(statusData);
    });
  });

  describe('refreshOnboard', () => {
    it('should POST to /api/v1/creator/onboard/refresh', async () => {
      const responseData = {
        url: 'https://stripe.com/refresh',
        onboarding_url: 'https://stripe.com/refresh',
      };
      mockApi.post.mockResolvedValueOnce(wrapResponse(responseData));

      const result = await creatorService.refreshOnboard();

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/onboard/refresh');
      expect(result).toEqual(responseData);
    });
  });
  describe('getBalance', () => {
    it('should GET /api/v1/creator/balance and return balance', async () => {
      const balanceData = {
        available: 150.0,
        pending: 25.0,
        currency: 'USD',
        totalEarnedCents: 50000,
        totalPaidOutCents: 35000,
        availableBalanceCents: 15000,
      };
      mockApi.get.mockResolvedValueOnce(wrapResponse(balanceData));

      const result = await creatorService.getBalance();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/balance');
      expect(result).toEqual(balanceData);
    });
  });
  describe('requestPayout', () => {
    it('should POST to /api/v1/creator/payout with amount', async () => {
      const payoutData = payoutFixture();
      mockApi.post.mockResolvedValueOnce(wrapResponse(payoutData));

      const result = await creatorService.requestPayout(100);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/payouts/request', {
        amount: 100,
      });
      expect(result).toEqual(payoutData);
    });

    it('should POST without amount when not provided', async () => {
      mockApi.post.mockResolvedValueOnce(wrapResponse(payoutFixture({ id: 'payout-2' })));

      await creatorService.requestPayout();

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/payouts/request', {
        amount: undefined,
      });
    });
  });

  describe('listPayouts', () => {
    it('should GET /api/v1/creator/payouts with cursor parameter', async () => {
      const payoutsData = [payoutFixture({ id: 'p1' }), payoutFixture({ id: 'p2' })];
      mockApi.get.mockResolvedValueOnce(wrapResponse(payoutsData));

      const result = await creatorService.listPayouts('cursor-abc');

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/payouts', {
        params: { after: 'cursor-abc' },
      });
      expect(result).toEqual(payoutsData);
    });

    it('should default to no cursor (first page)', async () => {
      mockApi.get.mockResolvedValueOnce(wrapResponse([]));

      await creatorService.listPayouts();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/payouts', {
        params: { after: undefined },
      });
    });
  });
  describe('getAnalyticsOverview', () => {
    it('should GET /api/v1/creator/analytics/overview with params', async () => {
      const overview = {
        subscriberCount: 142,
        mrrCents: 28400,
        churnRate: 0.03,
        platformFeePercent: 10,
      };
      mockApi.get.mockResolvedValueOnce(wrapResponse(overview));

      const result = await creatorService.getAnalyticsOverview({ period: '30d' });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/analytics/overview', {
        params: { period: '30d' },
      });
      expect(result).toEqual(overview);
    });

    it('should work without params', async () => {
      mockApi.get.mockResolvedValueOnce(wrapResponse({ subscriberCount: 0 }));

      await creatorService.getAnalyticsOverview();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/analytics/overview', {
        params: undefined,
      });
    });
  });

  describe('getAnalyticsEarnings', () => {
    it('should GET /api/v1/creator/analytics/earnings with params', async () => {
      const earnings = {
        earningsOverTime: [{ month: '2026-01', netCents: 12000 }],
        topForums: [],
      };
      mockApi.get.mockResolvedValueOnce(wrapResponse(earnings));

      const result = await creatorService.getAnalyticsEarnings({ period: '90d' });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/analytics/earnings', {
        params: { period: '90d' },
      });
      expect(result).toEqual(earnings);
    });
  });

  describe('getAnalyticsSubscribers', () => {
    it('should GET /api/v1/creator/analytics/subscribers', async () => {
      const subs = { totalSubscribers: 142, newSubscribers: 18, churned: 4, netGrowth: 14 };
      mockApi.get.mockResolvedValueOnce(wrapResponse(subs));

      const result = await creatorService.getAnalyticsSubscribers();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/analytics/subscribers', {
        params: undefined,
      });
      expect(result).toEqual(subs);
    });
  });

  describe('getAnalyticsContent', () => {
    it('should GET /api/v1/creator/analytics/content', async () => {
      const content = {
        totalPosts: 56,
        topPosts: [{ id: 'p1', title: 'Top', views: 1200, engagement: 0.85 }],
      };
      mockApi.get.mockResolvedValueOnce(wrapResponse(content));

      const result = await creatorService.getAnalyticsContent();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/analytics/content', {
        params: undefined,
      });
      expect(result).toEqual(content);
    });
  });
  describe('subscribe', () => {
    it('should POST to /api/v1/forums/:forumId/subscription', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { data: { id: 'sub-1' } } });

      const result = await creatorService.subscribe('forum-123');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/forums/forum-123/subscription');
      expect(result).toEqual({ id: 'sub-1' });
    });
  });

  describe('unsubscribe', () => {
    it('should DELETE /api/v1/forums/:forumId/subscription', async () => {
      mockApi.delete.mockResolvedValueOnce({ data: { data: { success: true } } });

      const result = await creatorService.unsubscribe('forum-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/forums/forum-123/subscription');
      expect(result).toEqual({});
    });
  });
  describe('updateMonetization', () => {
    it('should PUT to /api/v1/forums/:forumId/monetization with settings', async () => {
      const settings = { priceMonthlyNodes: 50, enabled: true };
      mockApi.put.mockResolvedValueOnce({ data: { data: { updated: true } } });

      const result = await creatorService.updateMonetization('forum-123', settings);

      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/forums/forum-123/monetization', settings);
      expect(result).toEqual({ updated: true });
    });
  });
  describe('listPremiumThreads', () => {
    it('should GET /api/v1/creator/premium-threads', async () => {
      const threads = [{ id: 'pt-1', threadId: 'thread-abc', priceNodes: 50 }];
      mockApi.get.mockResolvedValueOnce(wrapResponse(threads));

      const result = await creatorService.listPremiumThreads();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/premium-threads');
      expect(result).toEqual(threads);
    });
  });

  describe('createPremiumThread', () => {
    it('should POST to /api/v1/creator/premium-threads with attributes', async () => {
      const attrs = {
        threadId: 'thread-abc',
        priceNodes: 75,
        subscriberOnly: true,
        previewLength: 300,
      };
      const created = { id: 'pt-new', ...attrs };
      mockApi.post.mockResolvedValueOnce(wrapResponse(created));

      const result = await creatorService.createPremiumThread(attrs);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/premium-threads', attrs);
      expect(result).toEqual(created);
    });
  });
  describe('listTiers', () => {
    it('should GET /api/v1/creator/tiers', async () => {
      const tiers = [{ id: 'tier-1', name: 'Gold', priceMonthlyNodes: 100 }];
      mockApi.get.mockResolvedValueOnce(wrapResponse(tiers));

      const result = await creatorService.listTiers();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/creator/tiers');
      expect(result).toEqual(tiers);
    });
  });

  describe('createTier', () => {
    it('should POST to /api/v1/creator/tiers with attributes', async () => {
      const attrs = {
        forumId: 'forum-1',
        name: 'Platinum',
        priceMonthlyNodes: 200,
        benefits: { exclusiveContent: true, earlyAccess: true },
        maxSubscribers: 50,
      };
      const created = { id: 'tier-new', ...attrs };
      mockApi.post.mockResolvedValueOnce(wrapResponse(created));

      const result = await creatorService.createTier(attrs);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/creator/tiers', {
        forum_id: 'forum-1',
        max_subscribers: 50,
        name: 'Platinum',
        perks: ['exclusiveContent', 'earlyAccess'],
        price_cents: 200,
      });
      expect(result).toEqual(created);
    });
  });
  describe('purchaseThreadAccess', () => {
    it('should PUT to /api/v1/threads/:threadId/purchase', async () => {
      const purchased = { id: 'pt-1', threadId: 'thread-abc' };
      mockApi.put.mockResolvedValueOnce(wrapResponse(purchased));

      const result = await creatorService.purchaseThreadAccess('thread-abc');

      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/threads/thread-abc/purchase');
      expect(result).toEqual(purchased);
    });
  });
  describe('error propagation', () => {
    it('should propagate API errors from getStatus', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(creatorService.getStatus()).rejects.toThrow('401 Unauthorized');
    });

    it('should propagate API errors from requestPayout', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Insufficient balance'));

      await expect(creatorService.requestPayout(100)).rejects.toThrow('Insufficient balance');
    });

    it('should propagate API errors from getBalance', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Server error'));

      await expect(creatorService.getBalance()).rejects.toThrow('Server error');
    });
  });
});
