/**
 * Groups endpoints.
 *
 * Endpoints under /api/v1/groups.
 * Every method returns `Promise<ApiResult<T>>` — callers check `result.ok`
 * before accessing `result.data` instead of guessing at response shapes.
 */
import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  GroupSchema,
  GroupMemberSchema,
  GroupInviteSchema,
  GroupChannelSchema,
  GroupCategorySchema,
  GroupBanSchema,
  GroupSettingsSchema,
  GroupStatsSchema,
  GroupRoleSchema,
  GateTypeSchema,
  AckSchema,
} from '../schemas/groups';
import type {
  Group,
  GroupMember,
  GroupInvite,
  GroupChannel,
  GroupCategory,
  GroupBan,
  GroupSettings,
  GroupStats,
  GroupRole,
  GateType,
  GroupFeatures,
  Ack,
} from '../schemas/groups';

export type {
  Group,
  GroupMember,
  GroupInvite,
  GroupChannel,
  GroupCategory,
  GroupBan,
  GroupSettings,
  GroupStats,
  GroupRole,
  GateType,
  GroupFeatures,
  Ack,
};

export { GroupRoleSchema, GateTypeSchema };

const JoinedGroupSchema = z.union([
  GroupSchema,
  z.object({ group: GroupSchema }).transform(({ group }) => group),
]);

/**
 * Creates all group-related endpoint methods bound to the provided Axios instance.
 * Every method returns `Promise<ApiResult<T>>` so callers must check `result.ok`
 * before accessing `result.data`.
 */
export function createGroupsEndpoints(http: AxiosInstance) {
  return {
    /** Get user's groups. */
    async list(): Promise<ApiResult<Group[]>> {
      return apiCall(() => http.get('/api/v1/groups'), GroupSchema.array());
    },

    /** Get group by ID. */
    async get(groupId: string): Promise<ApiResult<Group>> {
      return apiCall(() => http.get(`/api/v1/groups/${groupId}`), GroupSchema);
    },

    /** Create a group. */
    async create(data: {
      readonly name: string;
      readonly description?: string;
      readonly isPublic?: boolean;
      readonly category?: string;
      readonly features?: Record<string, boolean>;
    }): Promise<ApiResult<Group>> {
      return apiCall(
        () =>
          http.post('/api/v1/groups', {
            name: data.name,
            description: data.description,
            visibility: data.isPublic !== false ? 'public' : 'private',
            category: data.category,
            features: data.features,
          }),
        GroupSchema
      );
    },

    /** Update a group. */
    async update(
      groupId: string,
      data: {
        readonly name?: string;
        readonly description?: string;
        readonly isPublic?: boolean;
        readonly category?: string;
        readonly features?: Record<string, boolean>;
      }
    ): Promise<ApiResult<Group>> {
      return apiCall(
        () =>
          http.patch(`/api/v1/groups/${groupId}`, {
            name: data.name,
            description: data.description,
            visibility:
              data.isPublic !== undefined ? (data.isPublic ? 'public' : 'private') : undefined,
            category: data.category,
            features: data.features,
          }),
        GroupSchema
      );
    },

    /** Delete a group. */
    async delete(groupId: string): Promise<ApiResult<Ack>> {
      return apiCall(() => http.delete(`/api/v1/groups/${groupId}`), AckSchema);
    },

    /** Join a group. */
    async join(groupId: string): Promise<ApiResult<Group>> {
      return apiCall(() => http.post(`/api/v1/groups/${groupId}/join`), GroupSchema);
    },

    /** Leave a group. */
    async leave(groupId: string): Promise<ApiResult<Ack>> {
      return apiCall(() => http.post(`/api/v1/groups/${groupId}/leave`), AckSchema);
    },

    /** Get public groups. */
    async getPublic(options?: {
      readonly limit?: number;
      readonly offset?: number;
      readonly category?: string;
      readonly search?: string;
      readonly sort_by?: 'members' | 'activity' | 'created';
    }): Promise<ApiResult<Group[]>> {
      return apiCall(
        () => http.get('/api/v1/groups/public', { params: options }),
        GroupSchema.array()
      );
    },

    /** Get featured groups. */
    async getFeatured(): Promise<ApiResult<Group[]>> {
      return apiCall(() => http.get('/api/v1/groups/featured'), GroupSchema.array());
    },

    /** Get group members. */
    async getMembers(
      groupId: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly role?: string;
        readonly status?: string;
        readonly search?: string;
      }
    ): Promise<ApiResult<GroupMember[]>> {
      return apiCall(
        () => http.get(`/api/v1/groups/${groupId}/members`, { params: options }),
        GroupMemberSchema.array()
      );
    },

    /** Update a member's role. */
    async updateMemberRole(
      groupId: string,
      userId: string,
      role: string
    ): Promise<ApiResult<GroupMember>> {
      return apiCall(
        () => http.patch(`/api/v1/groups/${groupId}/members/${userId}`, { role }),
        GroupMemberSchema
      );
    },

    /** Kick a member. */
    async kickMember(groupId: string, userId: string, reason?: string): Promise<ApiResult<Ack>> {
      return apiCall(
        () =>
          http.delete(`/api/v1/groups/${groupId}/members/${userId}`, {
            data: { reason },
          }),
        AckSchema
      );
    },

    /** Get group invites. */
    async getInvites(groupId: string): Promise<ApiResult<GroupInvite[]>> {
      return apiCall(
        () => http.get(`/api/v1/groups/${groupId}/invites`),
        GroupInviteSchema.array()
      );
    },

    /** Create a group invite. */
    async createInvite(
      groupId: string,
      options?: {
        readonly max_uses?: number;
        readonly expires_in?: number;
      }
    ): Promise<ApiResult<GroupInvite>> {
      return apiCall(
        () => http.post(`/api/v1/groups/${groupId}/invites`, options),
        GroupInviteSchema
      );
    },

    /** Delete a group invite. */
    async deleteInvite(groupId: string, inviteId: string): Promise<ApiResult<Ack>> {
      return apiCall(() => http.delete(`/api/v1/groups/${groupId}/invites/${inviteId}`), AckSchema);
    },

    /** Join group by invite code. */
    async joinByInvite(code: string): Promise<ApiResult<Group>> {
      return apiCall(() => http.post(`/api/v1/invites/${code}/join`), JoinedGroupSchema);
    },

    /** Get invite info. */
    async getInviteInfo(code: string): Promise<ApiResult<GroupInvite>> {
      return apiCall(() => http.get(`/api/v1/invites/${code}`), GroupInviteSchema);
    },

    /** Get group channels (returns categories with nested channels). */
    async getChannels(groupId: string): Promise<ApiResult<GroupCategory[]>> {
      return apiCall(
        () => http.get(`/api/v1/groups/${groupId}/channels`),
        GroupCategorySchema.array()
      );
    },

    /** Create a channel. */
    async createChannel(
      groupId: string,
      data: {
        readonly name: string;
        readonly type: 'text' | 'voice' | 'announcement' | 'forum';
        readonly category_id?: string;
        readonly description?: string;
        readonly is_private?: boolean;
      }
    ): Promise<ApiResult<GroupChannel>> {
      return apiCall(
        () => http.post(`/api/v1/groups/${groupId}/channels`, data),
        GroupChannelSchema
      );
    },

    /** Create a category. */
    async createCategory(groupId: string, name: string): Promise<ApiResult<GroupCategory>> {
      return apiCall(
        () => http.post(`/api/v1/groups/${groupId}/categories`, { name }),
        GroupCategorySchema
      );
    },

    /** Get group bans. */
    async getBans(groupId: string): Promise<ApiResult<GroupBan[]>> {
      return apiCall(() => http.get(`/api/v1/groups/${groupId}/bans`), GroupBanSchema.array());
    },

    /** Ban a member. */
    async banMember(
      groupId: string,
      userId: string,
      options?: {
        readonly reason?: string;
        readonly delete_messages?: boolean;
        readonly duration?: number;
      }
    ): Promise<ApiResult<GroupBan>> {
      return apiCall(
        () =>
          http.post(`/api/v1/groups/${groupId}/bans`, {
            user_id: userId,
            ...options,
          }),
        GroupBanSchema
      );
    },

    /** Unban a member. */
    async unbanMember(groupId: string, banId: string): Promise<ApiResult<Ack>> {
      return apiCall(() => http.delete(`/api/v1/groups/${groupId}/bans/${banId}`), AckSchema);
    },

    /** Get group settings. */
    async getSettings(groupId: string): Promise<ApiResult<GroupSettings>> {
      return apiCall(() => http.get(`/api/v1/groups/${groupId}/settings`), GroupSettingsSchema);
    },

    /** Update group settings. */
    async updateSettings(
      groupId: string,
      settings: Record<string, unknown>
    ): Promise<ApiResult<GroupSettings>> {
      return apiCall(
        () => http.patch(`/api/v1/groups/${groupId}/settings`, settings),
        GroupSettingsSchema
      );
    },

    /** Get group stats. */
    async getStats(groupId: string): Promise<ApiResult<GroupStats>> {
      return apiCall(() => http.get(`/api/v1/groups/${groupId}/stats`), GroupStatsSchema);
    },
  };
}
