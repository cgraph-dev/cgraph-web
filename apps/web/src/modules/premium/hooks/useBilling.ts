/**
 * Billing hook — wraps billingService for use in page components.
 *
 * Pages cannot import services directly (ESLint no-restricted-imports).
 * This hook provides a stable interface for checkout, portal, and plan queries.
 *
 */

import type { PlanId } from '@/lib/stripe';
import { billingService } from '@/services/billing';
import { useCallback } from 'react';

/**
 * Hook for managing billing.
 */
export function useBilling() {
  const redirectToCheckout = useCallback(async (planId: PlanId, yearly = false) => {
    await billingService.redirectToCheckout(planId, yearly);
  }, []);

  const redirectToPortal = useCallback(async () => {
    await billingService.redirectToPortal();
  }, []);

  const getPlans = useCallback(async () => {
    return billingService.getPlans();
  }, []);

  return { redirectToCheckout, redirectToPortal, getPlans };
}
