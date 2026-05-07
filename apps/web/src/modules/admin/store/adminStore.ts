import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { createLogger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import type { AdminStats, AdminState, AdminStore } from './adminStore.types';

const logger = createLogger('AdminStore');
import { createModerationActions } from './admin-moderation-actions';
import { createEventActions } from './admin-event-actions';
import { createUserActions } from './admin-user-actions';
import { createSettingsActions } from './admin-settings-actions';

export * from './adminStore.types';
const initialState: AdminState = {
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  isLoading: false,
  error: null,
  stats: null,
  statsLastUpdated: null,
  moderationQueue: [],
  moderationFilters: {
    status: 'all',
    riskLevel: 'all',
    type: 'all',
  },
  events: [],
  eventFilters: {
    status: 'all',
  },
  users: [],
  userFilters: {
    status: 'all',
    role: 'all',
  },
  selectedUserIds: [],
  systemSettings: [],
};
export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // UI Actions
        setActiveTab: (tab) => set({ activeTab: tab }),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setError: (error) => set({ error }),

        // Dashboard Actions
        fetchStats: async () => {
          set({ isLoading: true, error: null });
          try {
            const { api: http } = await import('@/lib/api');
            const response = await http.get<AdminStats>('/api/v1/admin/stats');
            set({
              stats: response.data, // type-cast: axios generic types the response
              statsLastUpdated: new Date(),
              isLoading: false,
            });
          } catch (error) {
            logger.error('Failed to load dashboard stats', error);
            set({
              error: 'Failed to load dashboard stats',
              isLoading: false,
            });
          }
        },

        refreshStats: async () => {
          await get().fetchStats();
        },

        // Composed action slices
        ...createModerationActions(set),
        ...createEventActions(set, get),
        ...createUserActions(set, get),
        ...createSettingsActions(set),
        reset: () =>
          set({
            ...initialState,
          }),
      }),
      {
        name: STORAGE_KEYS.adminStore,
        partialize: (state) => ({
          activeTab: state.activeTab,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'AdminStore' }
  )
);

export default useAdminStore;
