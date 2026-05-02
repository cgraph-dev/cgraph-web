/**
 * @deprecated Use `apiClient.nodes` from `@/lib/api-client` instead.
 * This file will be removed in a future migration.
 *
 * Nodes API service.
 *
 * All endpoints under /api/v1/nodes.
 */
// DEPRECATED: Use apiClient.nodes from @/lib/api-client instead
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { Wallet, Transaction, Bundle, CheckoutResponse, GiftResult } from '@cgraph/api-client';
import type { ApiError, ApiResult } from '@cgraph/api-client';

export type { Wallet, Transaction, Bundle, CheckoutResponse, GiftResult };

/**
 * Error wrapper for legacy nodes API calls.
 */
export class NodesApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(action: string, error: ApiError['error'], status: ApiError['status']) {
    super(error.message);
    this.name = 'NodesApiError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
    logger.error(action, error);
  }
}

function unwrapNodesResult<T>(action: string, result: ApiResult<T>): T {
  if (!result.ok) {
    throw new NodesApiError(action, result.error, result.status);
  }

  return result.data;
}

export const nodesApi = {
  /** Get the current user's wallet balance and stats. */
  async getWallet(): Promise<Wallet> {
    const result = await apiClient.nodes.getWallet();
    return unwrapNodesResult('Failed to load wallet', result);
  },

  /** Get transaction history with optional type filter. */
  async getTransactions(params?: {
    type?: string;
    limit?: number;
    cursor?: string;
  }): Promise<Transaction[]> {
    const result = await apiClient.nodes.getTransactions(params);
    return unwrapNodesResult('Failed to load transactions', result);
  },

  /** Get available node bundles for purchase. */
  async getBundles(): Promise<Bundle[]> {
    const result = await apiClient.nodes.getBundles();
    return unwrapNodesResult('Failed to load bundles', result);
  },

  /** Create a Stripe Checkout session for a bundle purchase. */
  async createCheckout(bundleId: string): Promise<CheckoutResponse> {
    const result = await apiClient.nodes.createCheckout(bundleId);
    const checkout = unwrapNodesResult('Failed to create checkout session', result);
    if (!checkout.checkout_url && !checkout.url) {
      throw new NodesApiError(
        'Invalid checkout response',
        {
          code: 'invalid_checkout_response',
          message: 'Checkout response did not include a redirect URL',
        },
        0
      );
    }

    return checkout;
  },

  /** Send a tip to another user. */
  async sendTip(recipientId: string, amount: number): Promise<Transaction> {
    const result = await apiClient.nodes.sendTip(recipientId, amount);
    return unwrapNodesResult('Failed to send tip', result);
  },

  /** Unlock gated content (thread). */
  async unlockContent(threadId: string): Promise<Transaction> {
    const result = await apiClient.nodes.unlockContent(threadId);
    return unwrapNodesResult('Failed to unlock content', result);
  },

  /** Send a node gift to a friend. */
  async sendGift(recipientId: string, amount: number, message?: string): Promise<GiftResult> {
    const result = await apiClient.nodes.sendGift(recipientId, amount, message);
    return unwrapNodesResult('Failed to send gift', result);
  },
};
