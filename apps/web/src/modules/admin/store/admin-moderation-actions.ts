/**
 * Admin Moderation Actions
 *
 * Moderation queue fetch, filter, review, and assign actions.
 *
 */

import { createLogger } from '@/lib/logger';
import { ensureArray } from '@/lib/api-utils';
import type { AdminStore, ModerationItem, ModerationStatus } from './adminStore.types';

const logger = createLogger('AdminModeration');

/**
 * Hard cap on how many moderation items the client keeps in memory. The
 * server paginates, so this is a guardrail against an accidental large
 * payload pushing the store past the GC-friendly zone.
 */
const MAX_MODERATION_QUEUE_ITEMS = 500;

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;

/**
 * Creates a new moderation actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createModerationActions(set: Set) {
  return {
    fetchModerationQueue: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api: http } = await import('@/lib/api');
        const response = await http.get('/api/v1/admin/moderation');
        const items = ensureArray<ModerationItem>(response.data, 'data');
        const normalized = items.slice(0, MAX_MODERATION_QUEUE_ITEMS).map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
        set({
          moderationQueue: normalized,
          isLoading: false,
        });
      } catch (error) {
        logger.error('Failed to load moderation queue', error);
        set({
          error: 'Failed to load moderation queue',
          isLoading: false,
        });
      }
    },

    setModerationFilters: (filters: Parameters<AdminStore['setModerationFilters']>[0]) =>
      set((state) => ({
        moderationFilters: { ...state.moderationFilters, ...filters },
      })),

    reviewModerationItem: async (
      id: string,
      action: 'approve' | 'reject' | 'escalate',
      notes?: string
    ) => {
      set({ isLoading: true });
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/moderation/${id}/review`, { action, notes });

        const newStatus: ModerationStatus =
          action === 'approve' ? 'resolved' : action === 'reject' ? 'dismissed' : 'escalated';

        set((state) => ({
          moderationQueue: state.moderationQueue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: newStatus,
                  updatedAt: new Date(),
                  notes: notes ? [...item.notes, notes] : item.notes,
                }
              : item
          ),
          isLoading: false,
        }));
      } catch (error) {
        logger.error('Failed to review moderation item', error);
        set({ isLoading: false, error: 'Failed to review moderation item' });
      }
    },

    assignModerationItem: async (id: string, assigneeId: string) => {
      try {
        const { api: http } = await import('@/lib/api');
        await http.post(`/api/v1/admin/moderation/${id}/assign`, { assignee_id: assigneeId });
        set((state) => ({
          moderationQueue: state.moderationQueue.map((item) =>
            item.id === id ? { ...item, assignedTo: assigneeId } : item
          ),
        }));
      } catch (error) {
        logger.error('Failed to assign moderation item', error);
        set({ error: 'Failed to assign moderation item' });
      }
    },
  };
}
