import { http } from '@/lib/api-client';
import { ensureArray, isRecord } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import type { AnnouncementFilters, AnnouncementState } from './announcementStore.types';
import { mapAnnouncementFromApi } from './announcement-mappers';

const logger = createLogger('AnnouncementStore:Fetch');

type Set = (
  partial: Partial<AnnouncementState> | ((state: AnnouncementState) => Partial<AnnouncementState>)
) => void;

/**
 * Creates all fetch-related actions for the announcement store.
 */
export function createFetchActions(set: Set) {
  return {
    fetchAnnouncements: async (filters?: AnnouncementFilters) => {
      set({ isLoading: true });
      try {
        const response = await http.get('/api/v1/announcements', {
          params: {
            scope: filters?.scope,
            forum_id: filters?.forumId,
            is_active: filters?.isActive,
            include_expired: filters?.includeExpired,
            author_id: filters?.authorId,
            group_id: filters?.groupId,
          },
        });

        const data = response.data;

        const rawAnnouncements = ensureArray<Record<string, unknown>>(data, 'announcements');
        const announcements = rawAnnouncements.map(mapAnnouncementFromApi);

        const pi = isRecord(data) && isRecord(data.page_info) ? data.page_info : {};
        set({
          announcements,
          cursor: typeof pi.end_cursor === 'string' ? pi.end_cursor : null,
          hasNextPage: typeof pi.has_next_page === 'boolean' ? pi.has_next_page : false,
          totalCount: typeof pi.total_count === 'number' ? pi.total_count : announcements.length,
          isLoading: false,
        });
      } catch (error) {
        logger.error('Failed to fetch announcements:', error);
        set({ isLoading: false });
      }
    },

    fetchGlobalAnnouncements: async () => {
      try {
        const response = await http.get('/api/v1/announcements/global');
        const announcements = ensureArray<Record<string, unknown>>(
          response.data,
          'announcements'
        ).map(mapAnnouncementFromApi);

        // Filter only active ones
        const now = new Date();
        const active = announcements.filter((a) => {
          if (!a.isActive) return false;
          const start = new Date(a.startDate);
          if (start > now) return false;
          if (a.endDate && new Date(a.endDate) < now) return false;
          return true;
        });

        set({ globalAnnouncements: active });
      } catch (error) {
        logger.error('Failed to fetch global announcements:', error);
      }
    },

    fetchForumAnnouncements: async (forumId: string) => {
      try {
        const response = await http.get(`/api/v1/forums/${forumId}/announcements`);
        const announcements = ensureArray<Record<string, unknown>>(
          response.data,
          'announcements'
        ).map(mapAnnouncementFromApi);

        // Filter only active ones
        const now = new Date();
        const active = announcements.filter((a) => {
          if (!a.isActive) return false;
          const start = new Date(a.startDate);
          if (start > now) return false;
          if (a.endDate && new Date(a.endDate) < now) return false;
          return true;
        });

        set((state) => {
          const updated = new Map(state.forumAnnouncements);
          updated.set(forumId, active);
          return { forumAnnouncements: updated };
        });
      } catch (error) {
        logger.error('Failed to fetch forum announcements:', error);
      }
    },

    fetchAnnouncement: async (id: string) => {
      try {
        const response = await http.get(`/api/v1/announcements/${id}`);
        const announcement = mapAnnouncementFromApi(response.data.announcement || response.data);
        set({ currentAnnouncement: announcement });
        return announcement;
      } catch (error) {
        logger.error('Failed to fetch announcement:', error);
        return null;
      }
    },
  };
}
