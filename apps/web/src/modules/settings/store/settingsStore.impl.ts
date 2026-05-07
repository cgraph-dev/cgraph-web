/**
 * Settings store implementation.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';

// Re-export all types and constants from the types file
export * from './settingsStore.types';

import type { SettingsState } from './settingsStore.types';
import { DEFAULT_SETTINGS } from './settingsStore.types';
import { createSettingsActions } from './settings-actions';

/**
 * Settings Store - Manages user settings with backend sync
 *
 * Features:
 * - Automatic sync with backend on changes
 * - Optimistic updates with rollback on failure
 * - Local caching for offline support
 * - Type-safe settings with defaults
 *
 */

// Store Implementation

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncedAt: null,

      ...createSettingsActions(set, get),

      reset: () =>
        set({
          settings: DEFAULT_SETTINGS,
          isLoading: false,
          isSaving: false,
          error: null,
          lastSyncedAt: null,
        }),
    }),
    {
      name: STORAGE_KEYS.settingsStore,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
