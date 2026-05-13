/**
 * Moderation Store — Queue Actions
 *
 * Moderation queue management: fetch, approve, reject.
 */

import { http } from '@/lib/api-client';
import { ensureArray, isRecord } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import type { ModerationQueueItem, ModerationState } from './moderationStore.types';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;

const logger = createLogger('ModerationStore:Queue');

function toItemType(v: unknown): ModerationQueueItem['itemType'] {
  if (v === 'thread' || v === 'post' || v === 'comment' || v === 'user' || v === 'attachment')
    return v;
  return 'post';
}
function toReason(v: unknown): ModerationQueueItem['reason'] {
  if (
    v === 'new_user' ||
    v === 'flagged' ||
    v === 'auto_spam' ||
    v === 'reported' ||
    v === 'manual'
  )
    return v;
  return 'reported';
}
function toStatus(v: unknown): ModerationQueueItem['status'] {
  if (v === 'pending' || v === 'approved' || v === 'rejected') return v;
  return 'pending';
}
function toPriority(v: unknown): ModerationQueueItem['priority'] {
  if (v === 'low' || v === 'normal' || v === 'high' || v === 'critical') return v;
  return 'normal';
}

/**
 */
/**
 * Creates a new queue actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createQueueActions(set: Set) {
  return {
    fetchModerationQueue: async (
      filters: { status?: string; itemType?: string; priority?: string } = {}
    ) => {
      set({ isLoadingQueue: true });
      try {
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.itemType) params.item_type = filters.itemType;
        if (filters.priority) params.priority = filters.priority;

        const response = await http.get('/api/v1/admin/moderation/queue', { params });
        const items = ensureArray(response.data, 'items')
          .filter(isRecord)
          .map((item) => ({
            id: String(item.id),
            itemType: toItemType(item.item_type),
            itemId: String(item.item_id),
            authorId: String(item.author_id),
            authorUsername: String(item.author_username),
            forumId: typeof item.forum_id === 'string' ? item.forum_id : undefined,
            forumName: typeof item.forum_name === 'string' ? item.forum_name : undefined,
            title: typeof item.title === 'string' ? item.title : undefined,
            content: String(item.content),
            contentPreview:
              typeof item.content_preview === 'string'
                ? item.content_preview
                : String(item.content).slice(0, 200),
            reason: toReason(item.reason),
            status: toStatus(item.status),
            priority: toPriority(item.priority),
            reportCount: typeof item.report_count === 'number' ? item.report_count : 0,
            moderatedById:
              typeof item.moderated_by_id === 'string' ? item.moderated_by_id : undefined,
            moderatedAt: typeof item.moderated_at === 'string' ? item.moderated_at : undefined,
            moderationNotes:
              typeof item.moderation_notes === 'string' ? item.moderation_notes : undefined,
            createdAt: String(item.created_at || item.inserted_at),
          }));

        const counts = response.data.counts || {};
        set({
          queue: items,
          queueCounts: {
            pending:
              counts.pending ||
              items.filter((i: ModerationQueueItem) => i.status === 'pending').length,
            flagged: counts.flagged || 0,
            reported: counts.reported || 0,
          },
          isLoadingQueue: false,
        });
      } catch (error) {
        logger.error(' Failed to fetch queue:', error);
        set({ isLoadingQueue: false });
        throw error;
      }
    },

    approveQueueItem: async (itemId: string, notes?: string) => {
      try {
        await http.post(`/api/v1/admin/moderation/queue/${itemId}/approve`, { notes });
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === itemId ? { ...item, status: 'approved' as const } : item
          ),
          queueCounts: {
            ...state.queueCounts,
            pending: Math.max(0, state.queueCounts.pending - 1),
          },
        }));
      } catch (error) {
        logger.error(' Failed to approve item:', error);
        throw error;
      }
    },

    rejectQueueItem: async (itemId: string, reason: string, notes?: string) => {
      try {
        await http.post(`/api/v1/admin/moderation/queue/${itemId}/reject`, { reason, notes });
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === itemId ? { ...item, status: 'rejected' as const } : item
          ),
          queueCounts: {
            ...state.queueCounts,
            pending: Math.max(0, state.queueCounts.pending - 1),
          },
        }));
      } catch (error) {
        logger.error(' Failed to reject item:', error);
        throw error;
      }
    },
  };
}
