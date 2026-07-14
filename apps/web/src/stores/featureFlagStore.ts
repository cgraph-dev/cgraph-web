/**
 * Feature Flag Store
 *
 * Zustand store for managing feature flags from the backend.
 * Polls the feature-flags endpoint with a 5-minute cache interval.
 * Used by both the useFeatureFlag hook and admin panel.
 *
 */

import { create } from 'zustand';
import { isRecord } from '@/lib/api-utils/response-extractors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('featureFlagStore');
/** Supported feature flag types */
export type FlagType = 'boolean' | 'percentage' | 'variant' | 'targeted';

/** A single feature flag */
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

/** Feature flag history entry */
export interface FlagHistoryEntry {
  readonly action: string;
  readonly changed_by: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: string;
}

type EvaluatedFeatureFlag = Pick<FeatureFlag, 'name' | 'enabled' | 'variant'>;

interface FeatureFlagState {
  /** All flags keyed by name */
  flags: Record<string, EvaluatedFeatureFlag>;
  /** Timestamp of last fetch */
  lastFetched: number;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message, if any */
  error: string | null;
}

interface FeatureFlagActions {
  /** Fetch flags from backend with 5-minute cache */
  fetchFlags: () => Promise<void>;
  /** Force-refresh flags ignoring cache */
  refreshFlags: () => Promise<void>;
  /** Check if a flag is enabled */
  isEnabled: (flagName: string) => boolean;
  /** Get a specific flag's variant */
  getVariant: (flagName: string) => string | undefined;
  /** Clear flag cache */
  clearCache: () => void;
}

type FeatureFlagStore = FeatureFlagState & FeatureFlagActions;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FLAGS_API_URL = '/api/v1/feature-flags';

function normalizeFlag(name: unknown, value: unknown): EvaluatedFeatureFlag | null {
  if (typeof name !== 'string' || !isRecord(value) || typeof value.enabled !== 'boolean') {
    return null;
  }

  return {
    name,
    enabled: value.enabled,
    ...(typeof value.variant === 'string' && { variant: value.variant }),
  };
}

function normalizeFlags(value: unknown): Record<string, EvaluatedFeatureFlag> {
  const entries = Array.isArray(value)
    ? value.map((flag) => [isRecord(flag) ? flag.name : undefined, flag] as const)
    : isRecord(value)
      ? Object.entries(value)
      : [];

  const flags: Record<string, EvaluatedFeatureFlag> = {};
  for (const [name, value] of entries) {
    const flag = normalizeFlag(name, value);
    if (flag) flags[flag.name] = flag;
  }

  return flags;
}

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  flags: {},
  lastFetched: 0,
  loading: false,
  error: null,
  fetchFlags: async () => {
    const now = Date.now();
    const { lastFetched, loading } = get();

    // Skip if fetched recently or already fetching
    if (loading || now - lastFetched < CACHE_TTL_MS) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(FLAGS_API_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.status}`);
      }

      const data: unknown = await response.json();
      let flagPayload: unknown = [];
      if (isRecord(data)) {
        if (isRecord(data.data) && 'flags' in data.data) {
          flagPayload = data.data.flags;
        } else if ('flags' in data) {
          flagPayload = data.flags;
        } else {
          flagPayload = data.data;
        }
      }
      const flagsMap = normalizeFlags(flagPayload);

      set({ flags: flagsMap, lastFetched: Date.now(), loading: false });
      logger.debug(`Fetched ${Object.keys(flagsMap).length} feature flags`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to fetch feature flags:', message);
      set({ loading: false, error: message });
    }
  },

  refreshFlags: async () => {
    set({ lastFetched: 0 });
    await get().fetchFlags();
  },

  isEnabled: (flagName: string) => {
    const flag = get().flags[flagName];
    return flag?.enabled ?? false;
  },

  getVariant: (flagName: string) => {
    return get().flags[flagName]?.variant;
  },

  clearCache: () => {
    set({ flags: {}, lastFetched: 0 });
  },
}));
