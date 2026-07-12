import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useCustomizationStore } from './customization/customizationStore';

export type PreferenceSyncStatus = 'fulfilled' | 'rejected' | 'skipped';

export interface PreferenceBootstrapResult {
  readonly settings: PreferenceSyncStatus;
  readonly customization: PreferenceSyncStatus;
}

export interface PreferenceBootstrapOptions {
  readonly userId?: string;
  readonly force?: boolean;
}

export interface PreferenceBootstrapReadinessInput {
  readonly isAuthenticated: boolean;
  readonly userId?: string;
  readonly lastBootstrappedUserId: string | null;
  readonly result: PreferenceBootstrapResult | null;
}

interface PreferenceOrchestratorState {
  readonly isBootstrapping: boolean;
  readonly lastBootstrappedAt: number | null;
  readonly lastBootstrappedUserId: string | null;
  readonly result: PreferenceBootstrapResult | null;
  readonly error: string | null;
  bootstrapPreferences: (
    options?: PreferenceBootstrapOptions
  ) => Promise<PreferenceBootstrapResult>;
  clearError: () => void;
  reset: () => void;
}

function statusFrom(
  settled: PromiseSettledResult<void>,
  storeError: string | null
): PreferenceSyncStatus {
  return settled.status === 'rejected' || storeError ? 'rejected' : 'fulfilled';
}

function hasRejectedSurface(result: PreferenceBootstrapResult): boolean {
  return result.settings === 'rejected' || result.customization === 'rejected';
}

function canReuseBootstrap(state: PreferenceOrchestratorState, userId: string | null): boolean {
  return Boolean(
    state.result &&
    state.lastBootstrappedUserId === userId &&
    state.result.settings === 'fulfilled' &&
    state.result.customization === 'fulfilled'
  );
}

/** Returns whether route-owned preference surfaces are ready to render for the current user. */
export function isPreferenceBootstrapReady(input: PreferenceBootstrapReadinessInput): boolean {
  if (!input.isAuthenticated) return true;

  const userId = input.userId ?? null;
  return Boolean(
    input.result &&
    input.lastBootstrappedUserId === userId &&
    input.result.settings === 'fulfilled' &&
    input.result.customization === 'fulfilled'
  );
}

export const usePreferenceOrchestrator = create<PreferenceOrchestratorState>()((set, get) => ({
  isBootstrapping: false,
  lastBootstrappedAt: null,
  lastBootstrappedUserId: null,
  result: null,
  error: null,

  bootstrapPreferences: async (options = {}) => {
    const userId = options.userId ?? null;
    const current = get();

    if (!options.force && canReuseBootstrap(current, userId) && current.result) {
      return current.result;
    }

    set({ isBootstrapping: true, error: null });

    const settingsPromise = useSettingsStore.getState().fetchSettings();
    const customizationPromise = useCustomizationStore
      .getState()
      .fetchCustomizations(userId ?? undefined);

    const [settingsSettled, customizationSettled] = await Promise.allSettled([
      settingsPromise,
      customizationPromise,
    ]);

    const result: PreferenceBootstrapResult = {
      settings: statusFrom(settingsSettled, useSettingsStore.getState().error),
      customization: statusFrom(customizationSettled, useCustomizationStore.getState().error),
    };

    set({
      isBootstrapping: false,
      lastBootstrappedAt: Date.now(),
      lastBootstrappedUserId: userId,
      result,
      error: hasRejectedSurface(result) ? 'One or more preference surfaces failed to sync' : null,
    });

    return result;
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      isBootstrapping: false,
      lastBootstrappedAt: null,
      lastBootstrappedUserId: null,
      result: null,
      error: null,
    }),
}));

/**
 * Bootstraps the authenticated user's preference surfaces from non-hook code.
 */
export function bootstrapUserPreferences(
  options?: PreferenceBootstrapOptions
): Promise<PreferenceBootstrapResult> {
  return usePreferenceOrchestrator.getState().bootstrapPreferences(options);
}
