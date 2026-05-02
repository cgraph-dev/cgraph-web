/**
 * useCreator Hook
 *
 * Thin wrapper around the creator store for status, onboarding,
 * and creator identity checks.
 *
 */

;
import { safeRedirect } from '@/lib/security';
import { useCreatorStore } from '../store';

/** Hook for creator. */
export function useCreator() {
  const isCreator = useCreatorStore((s) => s.isCreator);
  const onboardingComplete = useCreatorStore((s) => s.onboardingComplete);
  const creatorStatus = useCreatorStore((s) => s.creatorStatus);
  const stripeAccountId = useCreatorStore((s) => s.stripeAccountId);
  const isLoading = useCreatorStore((s) => s.isLoading);
  const error = useCreatorStore((s) => s.error);

  const fetchStatus = useCreatorStore((s) => s.fetchStatus);
  const onboard = useCreatorStore((s) => s.onboard);
  const refreshOnboard = useCreatorStore((s) => s.refreshOnboard);

  const startOnboarding = async () => {
    const result = await onboard();
    if (result?.url) {
      safeRedirect(result.url);
    }
    return result;
  };

  const continueOnboarding = async () => {
    const result = await refreshOnboard();
    if (result?.url) {
      safeRedirect(result.url);
    }
    return result;
  };

  return {
    isCreator,
    onboardingComplete,
    creatorStatus,
    stripeAccountId,
    isLoading,
    error,
    fetchStatus,
    startOnboarding,
    continueOnboarding,
  };
}
