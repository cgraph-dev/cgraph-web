import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('releaseControlsStore');

const CACHE_TTL_MS = 5 * 60 * 1000;
const FLAGS_API_URL = '/api/v1/feature-flags';
const ASSIGNMENTS_API_URL = '/api/v1/experiments/assignments';
const EVENTS_API_URL = '/api/v1/experiments/events';

export type FlagType = 'boolean' | 'percentage' | 'variant' | 'targeted';

export interface FeatureFlag {
  readonly name: string;
  readonly type: FlagType;
  readonly enabled: boolean;
  readonly percentage?: number;
  readonly variant?: string;
  readonly variants?: string[];
  readonly description?: string;
  readonly updated_at?: string;
}

export interface FlagHistoryEntry {
  readonly action: string;
  readonly changed_by: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: string;
}

export interface ExperimentAssignment {
  readonly variant: string;
  readonly experimentId?: string;
}

interface FeatureFlagState {
  flags: Record<string, FeatureFlag>;
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

interface FeatureFlagActions {
  fetchFlags: () => Promise<void>;
  refreshFlags: () => Promise<void>;
  isEnabled: (flagName: string) => boolean;
  getVariant: (flagName: string) => string | undefined;
  clearCache: () => void;
}

interface ExperimentState {
  assignments: Record<string, ExperimentAssignment>;
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

interface ExperimentActions {
  fetchAssignments: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
  getVariant: (experimentName: string) => string;
  trackEvent: (experimentId: string, eventName: string, metadata?: Record<string, unknown>) => void;
  clearCache: () => void;
}

export type FeatureFlagStore = FeatureFlagState & FeatureFlagActions;
export type ExperimentStore = ExperimentState & ExperimentActions;

interface ReleaseControlsState {
  flags: Record<string, FeatureFlag>;
  featureLastFetched: number;
  featureLoading: boolean;
  featureError: string | null;
  assignments: Record<string, ExperimentAssignment>;
  experimentLastFetched: number;
  experimentLoading: boolean;
  experimentError: string | null;
}

interface ReleaseControlsActions {
  fetchFlags: () => Promise<void>;
  refreshFlags: () => Promise<void>;
  isFeatureEnabled: (flagName: string) => boolean;
  getFeatureVariant: (flagName: string) => string | undefined;
  clearFeatureCache: () => void;
  fetchAssignments: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
  getExperimentVariant: (experimentName: string) => string;
  trackExperimentEvent: (
    experimentId: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ) => void;
  clearExperimentCache: () => void;
}

export type ReleaseControlsStore = ReleaseControlsState & ReleaseControlsActions;

function isExperimentAssignment(value: unknown): value is ExperimentAssignment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'variant' in value &&
    typeof value.variant === 'string'
  );
}

export const useReleaseControlsStore = create<ReleaseControlsStore>((set, get) => ({
  flags: {},
  featureLastFetched: 0,
  featureLoading: false,
  featureError: null,
  assignments: {},
  experimentLastFetched: 0,
  experimentLoading: false,
  experimentError: null,

  fetchFlags: async () => {
    const now = Date.now();
    const { featureLastFetched, featureLoading } = get();
    if (featureLoading || now - featureLastFetched < CACHE_TTL_MS) return;

    set({ featureLoading: true, featureError: null });

    try {
      const response = await fetch(FLAGS_API_URL, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.status}`);
      }

      const data = await response.json();
      const flagArray = data.data?.flags ?? data.flags ?? data.data ?? [];
      const flags: Record<string, FeatureFlag> = {};
      for (const flag of flagArray) {
        flags[flag.name] = flag;
      }

      set({ flags, featureLastFetched: Date.now(), featureLoading: false });
      logger.debug(`Fetched ${Object.keys(flags).length} feature flags`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to fetch feature flags:', message);
      set({ featureLoading: false, featureError: message });
    }
  },

  refreshFlags: async () => {
    set({ featureLastFetched: 0 });
    await get().fetchFlags();
  },

  isFeatureEnabled: (flagName) => get().flags[flagName]?.enabled ?? false,
  getFeatureVariant: (flagName) => get().flags[flagName]?.variant,
  clearFeatureCache: () => set({ flags: {}, featureLastFetched: 0 }),

  fetchAssignments: async () => {
    const now = Date.now();
    const { experimentLastFetched, experimentLoading } = get();
    if (experimentLoading || now - experimentLastFetched < CACHE_TTL_MS) return;

    set({ experimentLoading: true, experimentError: null });

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
      const assignments: Record<string, ExperimentAssignment> = {};

      for (const [name, value] of Object.entries(raw)) {
        if (typeof value === 'string') {
          assignments[name] = { variant: value };
        } else if (isExperimentAssignment(value)) {
          assignments[name] = value;
        }
      }

      set({ assignments, experimentLastFetched: Date.now(), experimentLoading: false });
      logger.debug(`Fetched ${Object.keys(assignments).length} experiment assignments`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to fetch experiment assignments:', message);
      set({ experimentLoading: false, experimentError: message });
    }
  },

  refreshAssignments: async () => {
    set({ experimentLastFetched: 0 });
    await get().fetchAssignments();
  },

  getExperimentVariant: (experimentName) => get().assignments[experimentName]?.variant ?? 'control',

  trackExperimentEvent: (experimentId, eventName, metadata) => {
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

  clearExperimentCache: () => set({ assignments: {}, experimentLastFetched: 0 }),
}));

function featureSlice(state: ReleaseControlsStore): FeatureFlagStore {
  return {
    flags: state.flags,
    lastFetched: state.featureLastFetched,
    loading: state.featureLoading,
    error: state.featureError,
    fetchFlags: state.fetchFlags,
    refreshFlags: state.refreshFlags,
    isEnabled: state.isFeatureEnabled,
    getVariant: state.getFeatureVariant,
    clearCache: state.clearFeatureCache,
  };
}

function experimentSlice(state: ReleaseControlsStore): ExperimentStore {
  return {
    assignments: state.assignments,
    lastFetched: state.experimentLastFetched,
    loading: state.experimentLoading,
    error: state.experimentError,
    fetchAssignments: state.fetchAssignments,
    refreshAssignments: state.refreshAssignments,
    getVariant: state.getExperimentVariant,
    trackEvent: state.trackExperimentEvent,
    clearCache: state.clearExperimentCache,
  };
}

type SliceHook<TState> = {
  <TSelected>(selector: (state: TState) => TSelected): TSelected;
  getState: () => TState;
  setState: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void;
};

function applyFeatureSliceState(partial: Partial<FeatureFlagStore>): void {
  const patch: Partial<ReleaseControlsState> = {};
  if (partial.flags !== undefined) patch.flags = partial.flags;
  if (partial.lastFetched !== undefined) patch.featureLastFetched = partial.lastFetched;
  if (partial.loading !== undefined) patch.featureLoading = partial.loading;
  if (partial.error !== undefined) patch.featureError = partial.error;
  useReleaseControlsStore.setState(patch);
}

function applyExperimentSliceState(partial: Partial<ExperimentStore>): void {
  const patch: Partial<ReleaseControlsState> = {};
  if (partial.assignments !== undefined) patch.assignments = partial.assignments;
  if (partial.lastFetched !== undefined) patch.experimentLastFetched = partial.lastFetched;
  if (partial.loading !== undefined) patch.experimentLoading = partial.loading;
  if (partial.error !== undefined) patch.experimentError = partial.error;
  useReleaseControlsStore.setState(patch);
}

function createFeatureFlagHook(): SliceHook<FeatureFlagStore> {
  return Object.assign(
    <TSelected>(selector: (state: FeatureFlagStore) => TSelected) =>
      useReleaseControlsStore((state) => selector(featureSlice(state))),
    {
      getState: () => featureSlice(useReleaseControlsStore.getState()),
      setState: (
        partial: Partial<FeatureFlagStore> | ((state: FeatureFlagStore) => Partial<FeatureFlagStore>),
      ) => {
        const value =
          typeof partial === 'function'
            ? partial(featureSlice(useReleaseControlsStore.getState()))
            : partial;
        applyFeatureSliceState(value);
      },
    },
  );
}

function createExperimentHook(): SliceHook<ExperimentStore> {
  return Object.assign(
    <TSelected>(selector: (state: ExperimentStore) => TSelected) =>
      useReleaseControlsStore((state) => selector(experimentSlice(state))),
    {
      getState: () => experimentSlice(useReleaseControlsStore.getState()),
      setState: (
        partial: Partial<ExperimentStore> | ((state: ExperimentStore) => Partial<ExperimentStore>),
      ) => {
        const value =
          typeof partial === 'function'
            ? partial(experimentSlice(useReleaseControlsStore.getState()))
            : partial;
        applyExperimentSliceState(value);
      },
    },
  );
}

export const useFeatureFlagStore = createFeatureFlagHook();
export const useExperimentStore = createExperimentHook();
