import { createLogger } from '@/lib/logger';
import { ensureArray } from '@/lib/api-utils';
import type { AdminStore, SystemSetting } from './adminStore.types';

const logger = createLogger('AdminSettings');

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;

/**
 * Creates a new settings actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createSettingsActions(set: Set) {
  return {
    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api: http } = await import('@/lib/api');
        const response = await http.get('/api/v1/admin/settings');

        const settings = ensureArray<SystemSetting>(response.data, 'data');
        set({ systemSettings: settings, isLoading: false });
      } catch (error) {
        logger.error('Failed to load system settings', error);
        set({
          error: 'Failed to load system settings',
          isLoading: false,
        });
      }
    },

    updateSetting: async (key: string, value: SystemSetting['value']) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.patch(`/api/v1/admin/settings/${key}`, { value });
        set((state) => ({
          systemSettings: state.systemSettings.map((setting) =>
            setting.key === key ? { ...setting, value } : setting
          ),
        }));
      } catch (error) {
        logger.error(`Failed to update setting: ${key}`, error);
        set({ error: 'Failed to update setting' });
      }
    },
  };
}
