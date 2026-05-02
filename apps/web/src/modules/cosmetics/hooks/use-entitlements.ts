/**
 * useEntitlements — hook for entitlement state and fast SKU lookups.
 *
 * Wraps the cosmetics store entitlement actions. Provides a `Set<string>`
 * of entitled SKU IDs for O(1) membership tests in component lists.
 * Auto-fetches on mount when the store is empty.
 *
 */

import { useEffect } from 'react';
import { useCosmeticsStore } from '../store/cosmetics-store';

// Hook

/** Hook providing cosmetic entitlements with auto-fetch on mount. */
export function useEntitlements() {
  const entitlements = useCosmeticsStore((s) => s.entitlements);
  const isLoading = useCosmeticsStore((s) => s.isLoadingEntitlements);
  const error = useCosmeticsStore((s) => s.error);
  const fetchEntitlements = useCosmeticsStore((s) => s.fetchEntitlements);
  const storeIsEntitled = useCosmeticsStore((s) => s.isEntitled);

  // Auto-fetch on mount when store is empty
  useEffect(() => {
    if (entitlements.length === 0) {
      void fetchEntitlements();
    }
  }, [entitlements.length, fetchEntitlements]);

  // Compute a Set of active entitled SKU IDs for fast lookups
  const entitledSkuIds = new Set<string>();
  for (const ent of entitlements) {
    if (ent.active) {
      entitledSkuIds.add(ent.sku.id);
    }
  }

  // Sync check first (Set.has), then async fallback via store
  function isEntitled(skuId: string): boolean {
      return entitledSkuIds.has(skuId);
    }

  // Async check for when we need a fresh server query
  async function checkEntitledAsync(skuId: string): Promise<boolean> {
      if (entitledSkuIds.has(skuId)) return true;
      return storeIsEntitled(skuId);
    }

  return {
    entitlements,
    entitledSkuIds,
    isEntitled,
    checkEntitledAsync,
    isLoading,
    error,
    fetchEntitlements,
  } as const;
}
