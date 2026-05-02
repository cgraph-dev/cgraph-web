/**
 * Billing endpoints.
 *
 * Endpoints under /api/v1/billing and /api/v1/premium.
 */
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import {
  BillingStatusSchema,
  PlanInfoSchema,
  BillingCheckoutSessionSchema,
  PortalSessionSchema,
  InvoiceRecordSchema,
  UpdatePlanResponseSchema,
  CancelSubscriptionResponseSchema,
} from '../schemas/billing';
import type {
  BillingStatus,
  PlanInfo,
  BillingCheckoutSession,
  PortalSession,
  InvoiceRecord,
  UpdatePlanResponse,
  CancelSubscriptionResponse,
} from '../schemas/billing';
import type { ApiResult } from '../schemas/api-result';

export type {
  BillingStatus,
  PlanInfo,
  BillingCheckoutSession,
  PortalSession,
  InvoiceRecord,
  UpdatePlanResponse,
  CancelSubscriptionResponse,
};

/**
 * Creates billing endpoints for subscription management and Stripe integration.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all billing-related endpoint methods
 */
export function createBillingEndpoints(http: AxiosInstance) {
  return {
    /** Get current billing status (tier, Stripe IDs, subscription state). */
    async getStatus(): Promise<ApiResult<BillingStatus>> {
      return apiCall(() => http.get('/api/v1/billing/status'), BillingStatusSchema);
    },

    /** Get available subscription plans. */
    async getPlans(): Promise<ApiResult<PlanInfo[]>> {
      return apiCall(() => http.get('/api/v1/billing/plans'), PlanInfoSchema.array());
    },

    /**
     * Create a Stripe checkout session.
     *
     * @param planId - The plan to subscribe to ('free' | 'premium' | 'enterprise')
     * @param yearly - Whether to use yearly billing (default: false)
     */
    async createCheckout(
      planId: BillingStatus['tier'],
      yearly = false
    ): Promise<ApiResult<BillingCheckoutSession>> {
      return apiCall(
        () => http.post('/api/v1/billing/checkout', { plan_id: planId, yearly }),
        BillingCheckoutSessionSchema
      );
    },

    /** Create a Stripe customer portal session for managing payment method, history, and cancellation. */
    async createPortal(): Promise<ApiResult<PortalSession>> {
      return apiCall(() => http.post('/api/v1/billing/portal'), PortalSessionSchema);
    },

    /**
     * Get invoice history.
     *
     * Returns ApiResult — errors are surfaced, not hidden.
     * The old billing service swallowed errors here by catching and returning [].
     * That pattern masked auth failures and backend errors as "no invoices".
     */
    async getInvoices(): Promise<ApiResult<InvoiceRecord[]>> {
      return apiCall(() => http.get('/api/v1/billing/invoices'), InvoiceRecordSchema.array());
    },

    /** Cancel the current subscription at period end. */
    async cancelSubscription(): Promise<ApiResult<CancelSubscriptionResponse>> {
      return apiCall(() => http.post('/api/v1/premium/cancel'), CancelSubscriptionResponseSchema);
    },

    /**
     * Upgrade or downgrade the current subscription plan.
     *
     * @param planId - The plan to switch to ('free' | 'premium' | 'enterprise')
     * @param yearly - Whether to use yearly billing (default: false)
     */
    async updatePlan(
      planId: BillingStatus['tier'],
      yearly = false
    ): Promise<ApiResult<UpdatePlanResponse>> {
      return apiCall(
        () => http.post('/api/v1/billing/update-plan', { plan_id: planId, yearly }),
        UpdatePlanResponseSchema
      );
    },
  };
}
