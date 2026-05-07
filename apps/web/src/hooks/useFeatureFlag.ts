/**
 * Feature Flag Hook
 *
 * React hook for consuming feature flags in components.
 * Auto-fetches flags on mount with 5-minute cache via the store.
 *
 *
 * @example
 * const { enabled, variant, loading } = useFeatureFlag('dark_mode_v2');
 * if (enabled) {
 *   return <NewDarkMode variant={variant} />;
 * }
 */

import { useEffect } from 'react';
import { useFeatureFlagStore } from '@/modules/platform/store';
import { useAuthStore } from '@/modules/auth/store';

interface UseFeatureFlagResult {
  /** Whether the flag is enabled for this user */
  enabled: boolean;
  /** The variant assigned, if applicable */
  variant?: string;
  /** Whether flags are still being loaded */
  loading: boolean;
}

/**
 * Check if a feature flag is enabled.
 *
 * @param flagName - The feature flag name to check
 * @returns Object with enabled state, optional variant, and loading status
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const flags = useFeatureFlagStore((s) => s.flags);
  const loading = useFeatureFlagStore((s) => s.loading);
  const fetchFlags = useFeatureFlagStore((s) => s.fetchFlags);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Only fetch flags when user is authenticated — endpoint requires auth
    if (isAuthenticated) {
      fetchFlags();
    }
  }, [fetchFlags, isAuthenticated]);

  const flag = flags[flagName];

  return {
    enabled: flag?.enabled ?? false,
    variant: flag?.variant,
    loading: loading && Object.keys(flags).length === 0,
  };
}
