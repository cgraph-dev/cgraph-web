/**
 * Billing hook — wraps apiClient.billing for use in page components.
 *
 * Pages cannot import services directly (ESLint no-restricted-imports).
 * This hook provides a stable interface for checkout, portal, and plan queries.
 *
 */

import { apiClient } from '@/lib/api-client';
import { safeRedirect } from '@/lib/security';
import type { PlanId } from '@/lib/stripe';

/**
 * Hook for managing billing.
 */
export function useBilling() {
  async function redirectToCheckout(planId: PlanId, yearly = false) {
    const result = await apiClient.billing.createCheckout(planId, yearly);
    if ('ok' in result && result.ok && result.data.url) safeRedirect(result.data.url);
  }

  async function redirectToPortal() {
    const result = await apiClient.billing.createPortal();
    if ('ok' in result && result.ok && result.data.url) safeRedirect(result.data.url);
  }

  async function getPlans() {
    const result = await apiClient.billing.getPlans();
    if ('ok' in result && result.ok) return result.data;
    return [];
  }

  return { redirectToCheckout, redirectToPortal, getPlans };
}
