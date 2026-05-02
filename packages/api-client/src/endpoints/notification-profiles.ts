/**
 * Notification profile endpoints.
 *
 * CRUD for notification profiles, schedule management, allowed members,
 * and manual activation/deactivation.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ── Zod Schemas ──────────────────────────────────────────────────

const AllowedMemberSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

const ScheduleSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  start_time: z.number(),
  end_time: z.number(),
  days_enabled: z.array(z.number()),
});

const NotificationProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  color: z.string(),
  allow_all_calls: z.boolean(),
  allow_all_mentions: z.boolean(),
  schedule: ScheduleSchema.nullable(),
  allowed_members: z.array(AllowedMemberSchema),
  inserted_at: z.string(),
  updated_at: z.string(),
  active_until: z.string().nullable().optional(),
});

const DeleteResultSchema = z.object({
  id: z.string(),
  deleted: z.boolean(),
});

export type NotificationProfileData = z.infer<typeof NotificationProfileSchema>;
export type ScheduleData = z.infer<typeof ScheduleSchema>;
export type AllowedMemberData = z.infer<typeof AllowedMemberSchema>;

const BASE_PATH = '/api/v1/notification-profiles';

/**
 * Creates notification profile endpoints.
 */
export function createNotificationProfileEndpoints(http: AxiosInstance) {
  return {
    /** List all profiles for the current user. */
    async list(): Promise<ApiResult<NotificationProfileData[]>> {
      return apiCall(() => http.get(BASE_PATH), NotificationProfileSchema.array());
    },

    /** Get a single profile by ID. */
    async get(profileId: string): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(() => http.get(`${BASE_PATH}/${profileId}`), NotificationProfileSchema);
    },

    /** Create a new profile. */
    async create(params: {
      readonly name: string;
      readonly emoji?: string;
      readonly color?: string;
    }): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(() => http.post(BASE_PATH, params), NotificationProfileSchema);
    },

    /** Update a profile's fields. */
    async update(
      profileId: string,
      params: {
        readonly name?: string;
        readonly emoji?: string;
        readonly color?: string;
        readonly allow_all_calls?: boolean;
        readonly allow_all_mentions?: boolean;
      }
    ): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(
        () => http.put(`${BASE_PATH}/${profileId}`, params),
        NotificationProfileSchema
      );
    },

    /** Soft-delete a profile. */
    async delete(profileId: string): Promise<ApiResult<{ id: string; deleted: boolean }>> {
      return apiCall(() => http.delete(`${BASE_PATH}/${profileId}`), DeleteResultSchema);
    },

    /** Update a profile's schedule. */
    async updateSchedule(
      profileId: string,
      params: {
        readonly enabled?: boolean;
        readonly start_time?: number;
        readonly end_time?: number;
        readonly days_enabled?: readonly number[];
      }
    ): Promise<ApiResult<ScheduleData>> {
      return apiCall(() => http.put(`${BASE_PATH}/${profileId}/schedule`, params), ScheduleSchema);
    },

    /** Replace all allowed members for a profile. */
    async setMembers(
      profileId: string,
      userIds: readonly string[]
    ): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(
        () => http.put(`${BASE_PATH}/${profileId}/members`, { user_ids: userIds }),
        NotificationProfileSchema
      );
    },

    /** Add a single allowed member. */
    async addMember(
      profileId: string,
      userId: string
    ): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(
        () => http.post(`${BASE_PATH}/${profileId}/members`, { user_id: userId }),
        NotificationProfileSchema
      );
    },

    /** Remove a single allowed member. */
    async removeMember(
      profileId: string,
      userId: string
    ): Promise<ApiResult<NotificationProfileData>> {
      return apiCall(
        () => http.delete(`${BASE_PATH}/${profileId}/members/${userId}`),
        NotificationProfileSchema
      );
    },

    /** Manually activate a profile. */
    async activate(params: {
      readonly profile_id: string;
      readonly duration_minutes?: number | null;
    }): Promise<ApiResult<NotificationProfileData | null>> {
      return apiCall(
        () => http.post(`${BASE_PATH}/activate`, params),
        NotificationProfileSchema.nullable()
      );
    },

    /** Deactivate manual override. */
    async deactivate(): Promise<ApiResult<null>> {
      return apiCall(() => http.post(`${BASE_PATH}/deactivate`), z.null());
    },

    /** Get the currently active profile. */
    async getActive(): Promise<ApiResult<NotificationProfileData | null>> {
      return apiCall(() => http.get(`${BASE_PATH}/active`), NotificationProfileSchema.nullable());
    },
  };
}
