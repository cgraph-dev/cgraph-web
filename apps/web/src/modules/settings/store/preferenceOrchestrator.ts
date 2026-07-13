import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useCustomizationStore } from './customization/customizationStore';

export type PreferenceSyncStatus = 'pending' | 'fulfilled' | 'rejected' | 'skipped';

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

/** Returns whether the Settings route can render its durable settings owner for the current user. */
export function isPreferenceBootstrapReady(input: PreferenceBootstrapReadinessInput): boolean {
  if (!input.isAuthenticated) return true;

  const userId = input.userId ?? null;
  return Boolean(
    input.result &&
    input.lastBootstrappedUserId === userId &&
    input.result.settings === 'fulfilled'
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

    set({
      isBootstrapping: true,
      lastBootstrappedUserId: userId,
      result: { settings: 'pending', customization: 'pending' },
      error: null,
    });

    const settingsPromise = useSettingsStore.getState().fetchSettings();
    const customizationPromise = useCustomizationStore
      .getState()
      .fetchCustomizations(userId ?? undefined);

    const updateSurfaceStatus = (surface: keyof PreferenceBootstrapResult, status: PreferenceSyncStatus) => {
      set((state) => {
        if (state.lastBootstrappedUserId !== userId || !state.result) return state;

        const result = { ...state.result, [surface]: status };
        return {
          result,
          error: hasRejectedSurface(result) ? 'One or more preference surfaces failed to sync' : null,
        };
      });
    };

    void settingsPromise.then(
      () =>
        updateSurfaceStatus(
          'settings',
          statusFrom({ status: 'fulfilled', value: undefined }, useSettingsStore.getState().error)
        ),
      () => updateSurfaceStatus('settings', 'rejected')
    );
    void customizationPromise.then(
      () =>
        updateSurfaceStatus(
          'customization',
          statusFrom({ status: 'fulfilled', value: undefined }, useCustomizationStore.getState().error)
        ),
      () => updateSurfaceStatus('customization', 'rejected')
    );

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
