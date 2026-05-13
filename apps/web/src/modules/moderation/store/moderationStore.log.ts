/**
 * Moderation Store — Log Actions
 *
 * Moderation log fetching and action logging.
 */

import { http } from '@/lib/api-client';
import { ensureArray, str, asOptionalString, asRecordOrUndef, asEnum } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import type { ModerationLogEntry, ModerationState } from './moderationStore.types';

const TARGET_TYPES = new Set<ModerationLogEntry['targetType']>([
  'thread',
  'post',
  'comment',
  'user',
  'forum',
]);

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;

const logger = createLogger('ModerationStore:Log');

/**
 */
/**
 * Creates a new log actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createLogActions(set: Set) {
  return {
    fetchModerationLog: async (
      filters: {
        moderatorId?: string;
        action?: string;
        targetType?: string;
        cursor?: string;
      } = {}
    ) => {
      set({ isLoadingLog: true });
      try {
        const params: Record<string, string> = {};
        if (filters.moderatorId) params.moderator_id = filters.moderatorId;
        if (filters.action) params.action = filters.action;
        if (filters.targetType) params.target_type = filters.targetType;
        if (filters.cursor) params.cursor = filters.cursor;

        const response = await http.get('/api/v1/admin/moderation/log', { params });
        const entries = ensureArray<Record<string, unknown>>(response.data, 'entries').map((e) => ({
          id: str(e, 'id'),
          action: str(e, 'action'),
          targetType: asEnum(e.target_type, TARGET_TYPES, 'thread'),
          targetId: str(e, 'target_id'),
          targetTitle: asOptionalString(e.target_title),
          moderatorId: str(e, 'moderator_id'),
          moderatorUsername: str(e, 'moderator_username'),
          reason: asOptionalString(e.reason),
          details: asRecordOrUndef(e.details),
          createdAt: str(e, 'created_at') || str(e, 'inserted_at'),
        }));
        set({ moderationLog: entries, isLoadingLog: false });
      } catch (error) {
        logger.error(' Failed to fetch moderation log:', error);
        set({ isLoadingLog: false });
        throw error;
      }
    },

    logModAction: async (
      action: string,
      targetType: string,
      targetId: string,
      reason?: string,
      details?: Record<string, unknown>
    ) => {
      try {
        await http.post('/api/v1/admin/moderation/log', {
          action,
          target_type: targetType,
          target_id: targetId,
          reason,
          details,
        });
      } catch (error) {
        // Don't throw - logging failures shouldn't break the main action
        logger.error(' Failed to log moderation action:', error);
      }
    },
  };
}
