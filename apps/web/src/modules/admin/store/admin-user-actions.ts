/**
 * Admin User Actions
 *
 * User fetch, filter, selection, moderation (ban/suspend/warn/unban),
 * role changes, and batch actions.
 *
 */

import { createLogger } from '@/lib/logger';
import { ensureArray } from '@/lib/api-utils';
import type { AdminStore, AdminUser, UserStatus } from './adminStore.types';

const logger = createLogger('AdminUsers');

/** Guardrail so an oversized response doesn't balloon client memory. */
const MAX_ADMIN_USERS = 500;

const USER_STATUS = {
  active: 'active',
  banned: 'banned',
  suspended: 'suspended',
  pending_review: 'pending_review',
} as const satisfies Record<string, UserStatus>;

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;
type Get = () => AdminStore;

/**
 * Creates a new user actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createUserActions(set: Set, get: Get) {
  return {
    fetchUsers: async (_cursor: string | null = null, _limit = 50) => {
      set({ isLoading: true, error: null });
      try {
        const { api: http } = await import('@/lib/api');
        const params: Record<string, unknown> = { limit: _limit };
        if (_cursor) params.cursor = _cursor;
        const response = await http.get('/api/v1/admin/users', { params });
        const users = ensureArray<AdminUser>(response.data, 'data');
        const normalized = users.slice(0, MAX_ADMIN_USERS).map((user) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastActive: new Date(user.lastActive),
        }));
        set({
          users: normalized,
          isLoading: false,
        });
      } catch (error) {
        logger.error('Failed to load users', error);
        set({
          error: 'Failed to load users',
          isLoading: false,
        });
      }
    },

    setUserFilters: (filters: Parameters<AdminStore['setUserFilters']>[0]) =>
      set((state) => ({
        userFilters: { ...state.userFilters, ...filters },
      })),

    selectUser: (id: string) =>
      set((state) => ({
        selectedUserIds: state.selectedUserIds.includes(id)
          ? state.selectedUserIds
          : [...state.selectedUserIds, id].slice(-100),
      })),

    deselectUser: (id: string) =>
      set((state) => ({
        selectedUserIds: state.selectedUserIds.filter((uid) => uid !== id),
      })),

    selectAllUsers: () =>
      set((state) => ({
        selectedUserIds: state.users.map((user) => user.id),
      })),

    clearUserSelection: () => set({ selectedUserIds: [] }),

    banUser: async (id: string, reason: string, duration?: number) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/users/${id}/ban`, { reason, duration });
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, status: USER_STATUS.banned } : user
          ),
        }));
      } catch (error) {
        logger.error(`Failed to ban user: ${id}`, error);
        set({ error: 'Failed to ban user' });
      }
    },

    suspendUser: async (id: string, reason: string, duration: number) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/users/${id}/suspend`, { reason, duration });
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, status: USER_STATUS.suspended } : user
          ),
        }));
      } catch (error) {
        logger.error(`Failed to suspend user: ${id}`, error);
        set({ error: 'Failed to suspend user' });
      }
    },

    warnUser: async (id: string, reason: string) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/users/${id}/warn`, { reason });
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, warningCount: user.warningCount + 1 } : user
          ),
        }));
      } catch (error) {
        logger.error(`Failed to warn user: ${id}`, error);
        set({ error: 'Failed to warn user' });
      }
    },

    unbanUser: async (id: string) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/users/${id}/unban`);
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, status: USER_STATUS.active } : user
          ),
        }));
      } catch (error) {
        logger.error(`Failed to unban user: ${id}`, error);
        set({ error: 'Failed to unban user' });
      }
    },

    changeUserRole: async (id: string, role: AdminUser['role']) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.patch(`/api/v1/admin/users/${id}/role`, { role });
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, role } : user)),
        }));
      } catch (error) {
        logger.error(`Failed to change user role: ${id}`, error);
        set({ error: 'Failed to change user role' });
      }
    },

    // Batch Actions
    batchAction: async (action: string, userIds: string[], params?: Record<string, unknown>) => {
      set({ isLoading: true });
      try {
        const { api: http } = await import('@/lib/api');
        await http.post('/api/v1/admin/batch', { action, user_ids: userIds, ...params });

        // Refresh users after batch action
        await get().fetchUsers();
        set({ selectedUserIds: [], isLoading: false });
      } catch (error) {
        logger.error(`Failed to execute batch ${action}`, error);
        set({ isLoading: false, error: `Failed to execute batch ${action}` });
      }
    },
  };
}
