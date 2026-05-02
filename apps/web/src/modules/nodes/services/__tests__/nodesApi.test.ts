import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

import { NodesApiError, nodesApi } from '../nodesApi';
const makeWallet = (overrides?: Record<string, unknown>) => ({
  user_id: 'user-1',
  available_balance: 5000,
  pending_balance: 200,
  lifetime_earned: 10000,
  lifetime_spent: 4800,
  ...overrides,
});

const makeTransaction = (overrides?: Record<string, unknown>) => ({
  id: 'tx-1',
  amount: 100,
  type: 'tip_received',
  reference_id: null,
  reference_type: null,
  platform_cut: 20,
  net_amount: 80,
  metadata: null,
  inserted_at: '2026-03-01T12:00:00Z',
  ...overrides,
});

const makeBundle = (overrides?: Record<string, unknown>) => ({
  id: 'bundle-1',
  name: 'Starter Pack',
  nodes: 500,
  price: 4.99,
  bonus_percent: 0,
  popular: false,
  is_active: true,
  ...overrides,
});

describe('nodesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('getWallet', () => {
    it('fetches wallet and unwraps the data envelope', async () => {
      const wallet = makeWallet();
      mockApi.get.mockResolvedValue({ data: { data: wallet } });

      const result = await nodesApi.getWallet();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/nodes/wallet');
      expect(result).toEqual(wallet);
    });
  });
  describe('getTransactions', () => {
    it('fetches all transactions without params', async () => {
      const txns = [makeTransaction(), makeTransaction({ id: 'tx-2', amount: -50 })];
      mockApi.get.mockResolvedValue({ data: { data: txns } });

      const result = await nodesApi.getTransactions();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/nodes/transactions', {
        params: undefined,
      });
      expect(result).toHaveLength(2);
    });

    it('passes type filter as query param', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [] } });

      await nodesApi.getTransactions({ type: 'tip_sent' });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/nodes/transactions', {
        params: { type: 'tip_sent' },
      });
    });

    it('passes limit and cursor params', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [] } });

      await nodesApi.getTransactions({ type: 'purchase', limit: 10, cursor: 'cursor-abc' });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/nodes/transactions', {
        params: { type: 'purchase', limit: 10, cursor: 'cursor-abc' },
      });
    });
  });
  describe('getBundles', () => {
    it('fetches bundles and unwraps the data envelope', async () => {
      const bundles = [makeBundle(), makeBundle({ id: 'bundle-2', popular: true })];
      mockApi.get.mockResolvedValue({ data: { data: bundles } });

      const result = await nodesApi.getBundles();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/nodes/bundles');
      expect(result).toEqual(bundles);
    });
  });
  describe('createCheckout', () => {
    it('posts bundle_id and returns checkout response', async () => {
      const checkout = { success: true, checkout_url: 'https://checkout.stripe.com/session-1' };
      mockApi.post.mockResolvedValue({ data: checkout });

      const result = await nodesApi.createCheckout('bundle-3');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/nodes/checkout', {
        bundle_id: 'bundle-3',
      });
      expect(result).toEqual({ checkout_url: checkout.checkout_url });
    });

    it('throws when checkout succeeds without a redirect URL', async () => {
      mockApi.post.mockResolvedValue({ data: { data: { session_id: 'session-1' } } });

      await expect(nodesApi.createCheckout('bundle-3')).rejects.toMatchObject({
        code: 'invalid_checkout_response',
      });
    });
  });
  describe('sendTip', () => {
    it('posts tip with recipient_id and amount, unwraps response', async () => {
      const tx = makeTransaction({ type: 'tip_sent', amount: -50 });
      mockApi.post.mockResolvedValue({ data: { data: tx } });

      const result = await nodesApi.sendTip('recipient-1', 50);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/nodes/tip', {
        recipient_id: 'recipient-1',
        amount: 50,
        context: undefined,
      });
      expect(result).toEqual(tx);
    });

    it('throws a NodesApiError when the API rejects a tip', async () => {
      mockApi.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            error: {
              code: 'insufficient_balance',
              message: 'Insufficient node balance',
            },
          },
        },
      });

      const promise = nodesApi.sendTip('recipient-1', 50);

      await expect(promise).rejects.toMatchObject({
        name: 'NodesApiError',
        code: 'insufficient_balance',
        status: 422,
      });
      await expect(promise).rejects.toBeInstanceOf(NodesApiError);
    });
  });
  describe('unlockContent', () => {
    it('posts thread_id and unwraps transaction response', async () => {
      const tx = makeTransaction({ type: 'content_unlock', amount: -200 });
      mockApi.post.mockResolvedValue({ data: { data: tx } });

      const result = await nodesApi.unlockContent('thread-42');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/nodes/unlock', {
        thread_id: 'thread-42',
      });
      expect(result).toEqual(tx);
    });
  });
  // requestWithdrawal was removed from the API; test archived
});
