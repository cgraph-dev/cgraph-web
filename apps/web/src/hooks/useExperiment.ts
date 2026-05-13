/**
 * Experiment Hook
 *
 * React hook for A/B test variant assignment and event tracking.
 * Fetches the user's variant assignment on mount and provides a
 * `trackEvent` function for recording conversion metrics.
 *
 *
 * @example
 * const { variant, trackEvent } = useExperiment('onboarding_flow');
 * if (variant === 'treatment') {
 *   trackEvent('cta_clicked', { button: 'signup' });
 * }
 */

import { useEffect, useRef, useState } from 'react';
import { useExperimentStore } from '@/stores/experimentStore';

interface UseExperimentResult {
  /** The variant assigned to this user (e.g. "control", "treatment") */
  variant: string;
  /** Track a conversion or interaction event for this experiment */
  trackEvent: (event: string, metadata?: Record<string, unknown>) => void;
  /** Whether the assignment is still loading */
  loading: boolean;
}

/**
 * Get the current user's experiment variant and track events.
 *
 * @param experimentName - The experiment name to look up
 * @returns Object with variant, trackEvent function, and loading state
 */
export function useExperiment(experimentName: string): UseExperimentResult {
  const assignments = useExperimentStore((s) => s.assignments);
  const loading = useExperimentStore((s) => s.loading);
  const fetchAssignments = useExperimentStore((s) => s.fetchAssignments);
  const trackExperimentEvent = useExperimentStore((s) => s.trackEvent);
  const [experimentId, setExperimentId] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAssignments();
    }
  }, [fetchAssignments]);

  // Resolve experiment ID from assignments metadata
  useEffect(() => {
    const assignment = assignments[experimentName];
    if (assignment?.experimentId) {
      setExperimentId(assignment.experimentId);
    }
  }, [assignments, experimentName]);

  const variant = assignments[experimentName]?.variant ?? 'control';

  function trackEvent(event: string, metadata?: Record<string, unknown>): void {
    if (experimentId) {
      trackExperimentEvent(experimentId, event, metadata);
    }
  }

  return {
    variant,
    trackEvent,
    loading,
  };
}
