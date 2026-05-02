/**
 * Nodes (virtual currency) endpoints.
 *
 * Endpoints under /api/v1/nodes.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  WalletSchema,
  TransactionSchema,
  BundleSchema,
  CheckoutResponseSchema,
  GiftResultSchema,
} from '../schemas/nodes';
import type { Wallet, Transaction, Bundle, CheckoutResponse, GiftResult } from '../schemas/nodes';
export type { Wallet, Transaction, Bundle, CheckoutResponse, GiftResult } from '../schemas/nodes';

// ---------------------------------------------------------------------------
// Array schemas
// ---------------------------------------------------------------------------

const TransactionListSchema = z.array(TransactionSchema);
const BundleListSchema = z.array(BundleSchema);

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates nodes (virtual currency) endpoints bound to the provided Axios instance. */
export function createNodesEndpoints(http: AxiosInstance) {
  return {
    /** Get the current user's wallet. */
    async getWallet(): Promise<ApiResult<Wallet>> {
      return apiCall(() => http.get('/api/v1/nodes/wallet'), WalletSchema);
    },

    /** List transactions with optional filters. */
    async getTransactions(params?: {
      readonly type?: string;
      readonly limit?: number;
      readonly cursor?: string;
    }): Promise<ApiResult<Transaction[]>> {
      return apiCall(
        () => http.get('/api/v1/nodes/transactions', { params }),
        TransactionListSchema
      );
    },

    /** List available node bundles for purchase. */
    async getBundles(): Promise<ApiResult<Bundle[]>> {
      return apiCall(() => http.get('/api/v1/nodes/bundles'), BundleListSchema);
    },

    /** Create a Stripe checkout session for a bundle. */
    async createCheckout(bundleId: string): Promise<ApiResult<CheckoutResponse>> {
      return apiCall(
        () => http.post('/api/v1/nodes/checkout', { bundle_id: bundleId }),
        CheckoutResponseSchema
      );
    },

    /** Send a tip to another user. */
    async sendTip(
      recipientId: string,
      amount: number,
      context?: Record<string, unknown>
    ): Promise<ApiResult<Transaction>> {
      return apiCall(
        () => http.post('/api/v1/nodes/tip', { recipient_id: recipientId, amount, context }),
        TransactionSchema
      );
    },

    /** Unlock premium content by paying nodes. */
    async unlockContent(threadId: string): Promise<ApiResult<Transaction>> {
      return apiCall(
        () => http.post('/api/v1/nodes/unlock', { thread_id: threadId }),
        TransactionSchema
      );
    },

    /** Send a gift of nodes to another user. */
    async sendGift(
      recipientId: string,
      amount: number,
      message?: string
    ): Promise<ApiResult<GiftResult>> {
      return apiCall(
        () => http.post('/api/v1/nodes/gift', { recipient_id: recipientId, amount, message }),
        GiftResultSchema
      );
    },
  };
}
