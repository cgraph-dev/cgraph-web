/**
 * Billing hook — wraps apiClient.billing for use in page components.
 *
 * Pages cannot import services directly (ESLint no-restricted-imports).
 * This hook provides a stable interface for checkout, portal, and plan queries.
 *
 */

import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { safeRedirect } from '@/lib/security';
import type { PlanId } from '@/lib/stripe';

/**
 * Hook for managing billing.
 */
export function useBilling() {
  const redirectToCheckout = useCallback(async (planId: PlanId, yearly = false) => {
    const result = await apiClient.billing.createCheckout(planId, yearly);
    if ('ok' in result && result.ok && result.data.url) safeRedirect(result.data.url);
  }, []);

  const redirectToPortal = useCallback(async () => {
    const result = await apiClient.billing.createPortal();
    if ('ok' in result && result.ok && result.data.url) safeRedirect(result.data.url);
  }, []);

  const getPlans = useCallback(async () => {
    const result = await apiClient.billing.getPlans();
    if ('ok' in result && result.ok) return result.data;
    return [];
  }, []);

  return useMemo(
    () => ({ redirectToCheckout, redirectToPortal, getPlans }),
    [getPlans, redirectToCheckout, redirectToPortal]
  );
}
