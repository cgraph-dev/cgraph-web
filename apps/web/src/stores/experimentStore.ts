/**
 * Experiment Store
 *
 * Zustand store for managing A/B test experiment assignments.
 * Fetches assignments from the backend and provides event tracking.
 *
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('experimentStore');
interface ExperimentAssignment {
  readonly variant: string;
  readonly experimentId?: string;
}

function isExperimentAssignment(value: unknown): value is ExperimentAssignment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'variant' in value &&
    typeof value.variant === 'string'
  );
}

interface ExperimentState {
  /** Assignments keyed by experiment name */
  assignments: Record<string, ExperimentAssignment>;
  /** Timestamp of last fetch */
  lastFetched: number;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message, if any */
  error: string | null;
}

interface ExperimentActions {
  /** Fetch experiment assignments from backend with 5-minute cache */
  fetchAssignments: () => Promise<void>;
  /** Force-refresh assignments ignoring cache */
  refreshAssignments: () => Promise<void>;
  /** Get the variant for an experiment */
  getVariant: (experimentName: string) => string;
  /** Track an experiment event */
  trackEvent: (experimentId: string, eventName: string, metadata?: Record<string, unknown>) => void;
  /** Clear assignment cache */
  clearCache: () => void;
}

type ExperimentStore = ExperimentState & ExperimentActions;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ASSIGNMENTS_API_URL = '/api/v1/experiments/assignments';
const EVENTS_API_URL = '/api/v1/experiments/events';

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  assignments: {},
  lastFetched: 0,
  loading: false,
  error: null,
  fetchAssignments: async () => {
    const now = Date.now();
    const { lastFetched, loading } = get();

    if (loading || now - lastFetched < CACHE_TTL_MS) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(ASSIGNMENTS_API_URL, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      const raw = data.data?.assignments ?? {};

      // Normalize: backend returns {name: variant_string}
      // Convert to {name: {variant, experimentId?}}
      const assignments: Record<string, ExperimentAssignment> = {};
      for (const [name, value] of Object.entries(raw)) {
        if (typeof value === 'string') {
          assignments[name] = { variant: value };
        } else if (isExperimentAssignment(value)) {
          assignments[name] = value;
        }
      }

      set({ assignments, lastFetched: Date.now(), loading: false });
      logger.debug(`Fetched ${Object.keys(assignments).length} experiment assignments`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to fetch experiment assignments:', message);
      set({ loading: false, error: message });
    }
  },

  refreshAssignments: async () => {
    set({ lastFetched: 0 });
    await get().fetchAssignments();
  },

  getVariant: (experimentName: string) => {
    return get().assignments[experimentName]?.variant ?? 'control';
  },

  trackEvent: (experimentId: string, eventName: string, metadata?: Record<string, unknown>) => {
    // Fire-and-forget: don't block the UI for analytics
    fetch(EVENTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        experiment_id: experimentId,
        event_name: eventName,
        metadata: metadata ?? {},
      }),
    }).catch((error) => {
      logger.warn('Failed to track experiment event:', error);
    });
  },

  clearCache: () => {
    set({ assignments: {}, lastFetched: 0 });
  },
}));
