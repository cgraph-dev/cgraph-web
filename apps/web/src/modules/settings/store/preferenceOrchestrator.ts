import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useCustomizationStore } from './customization/customizationStore';
import { useThemeStore } from '@/stores/theme/store';

export type PreferenceSyncStatus = 'fulfilled' | 'rejected' | 'skipped';

export interface PreferenceBootstrapResult {
  readonly settings: PreferenceSyncStatus;
  readonly customization: PreferenceSyncStatus;
  readonly theme: PreferenceSyncStatus;
}

export interface PreferenceBootstrapOptions {
  readonly userId?: string;
  readonly includeTheme?: boolean;
  readonly force?: boolean;
}

export interface PreferenceBootstrapReadinessInput {
  readonly isAuthenticated: boolean;
  readonly userId?: string;
  readonly includeTheme?: boolean;
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

const SKIPPED_THEME_RESULT: PreferenceSyncStatus = 'skipped';

function statusFrom(
  settled: PromiseSettledResult<void>,
  storeError: string | null
): PreferenceSyncStatus {
  return settled.status === 'rejected' || storeError ? 'rejected' : 'fulfilled';
}

function hasRejectedSurface(result: PreferenceBootstrapResult): boolean {
  return (
    result.settings === 'rejected' ||
    result.customization === 'rejected' ||
    result.theme === 'rejected'
  );
}

function canReuseBootstrap(
  state: PreferenceOrchestratorState,
  userId: string | null,
  shouldSyncTheme: boolean
): boolean {
  return Boolean(
    state.result &&
    state.lastBootstrappedUserId === userId &&
    state.result.settings === 'fulfilled' &&
    state.result.customization === 'fulfilled' &&
    (!shouldSyncTheme || state.result.theme === 'fulfilled')
  );
}

/** Returns whether route-owned preference surfaces are ready to render for the current user. */
export function isPreferenceBootstrapReady(input: PreferenceBootstrapReadinessInput): boolean {
  if (!input.isAuthenticated) return true;

  const userId = input.userId ?? null;
  const shouldSyncTheme = Boolean(input.includeTheme ?? input.userId);

  return Boolean(
    input.result &&
    input.lastBootstrappedUserId === userId &&
    input.result.settings === 'fulfilled' &&
    input.result.customization === 'fulfilled' &&
    (!shouldSyncTheme || input.result.theme === 'fulfilled')
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
    const shouldSyncTheme = Boolean(options.includeTheme ?? userId);
    const current = get();

    if (!options.force && canReuseBootstrap(current, userId, shouldSyncTheme) && current.result) {
      return current.result;
    }

    set({ isBootstrapping: true, error: null });

    const settingsPromise = useSettingsStore.getState().fetchSettings();
    const customizationPromise = useCustomizationStore
      .getState()
      .fetchCustomizations(userId ?? undefined);
    const themePromise = shouldSyncTheme
      ? useThemeStore.getState().syncWithBackend()
      : Promise.resolve();

    const [settingsSettled, customizationSettled, themeSettled] = await Promise.allSettled([
      settingsPromise,
      customizationPromise,
      themePromise,
    ]);

    const result: PreferenceBootstrapResult = {
      settings: statusFrom(settingsSettled, useSettingsStore.getState().error),
      customization: statusFrom(customizationSettled, useCustomizationStore.getState().error),
      theme: shouldSyncTheme
        ? statusFrom(themeSettled, useThemeStore.getState().error)
        : SKIPPED_THEME_RESULT,
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
