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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapPayload(value: unknown, keys: readonly string[]): unknown {
  if (!isRecord(value)) return value;
  for (const key of keys) {
    if (key in value) return value[key];
  }
  return value;
}

function unwrapListPayload(value: unknown, keys: readonly string[]): unknown {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return value;
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return value;
}

const GroupResponseSchema = z.preprocess(
  (value) => unwrapPayload(value, ['group', 'data']),
  GroupSchema
);
const GroupListResponseSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['groups', 'communities', 'data', 'results']),
  z.array(GroupResponseSchema)
);
const GroupInviteResponseSchema = z.preprocess(
  (value) => unwrapPayload(value, ['invite', 'data']),
  GroupInviteSchema
);
const GroupInviteListResponseSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['invites', 'data', 'results']),
  z.array(GroupInviteResponseSchema)
);
const GroupMemberListResponseSchema = z.preprocess(
  (value) => unwrapListPayload(value, ['members', 'data', 'results']),
  z.array(GroupMemberSchema)
);

/**
 * Creates all group-related endpoint methods bound to the provided Axios instance.
 * Every method returns `Promise<ApiResult<T>>` so callers must check `result.ok`
 * before accessing `result.data`.
 */
export function createGroupsEndpoints(http: AxiosInstance) {
  return {
    /** Get user's groups. */
    async list(): Promise<ApiResult<Group[]>> {
      return apiCall(() => http.get('/api/v1/groups'), GroupListResponseSchema);
    },

    /** Get group by ID. */
    async get(groupId: string): Promise<ApiResult<Group>> {
      return apiCall(() => http.get(`/api/v1/groups/${groupId}`), GroupResponseSchema);
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
        GroupResponseSchema
      );
    },

    /** Update a group. */
    async update(
      groupId: string,
      data: {
        readonly name?: string;
        readonly description?: string;
        readonly isPublic?: boolean;
        readonly visibility?: 'public' | 'private';
        readonly category?: string;
        readonly features?: Record<string, boolean>;
        readonly icon_url?: string | null;
        readonly banner_url?: string | null;
        readonly is_node_gated?: boolean;
        readonly gate_type?: GateType | null;
        readonly gate_price_nodes?: number | null;
      }
    ): Promise<ApiResult<Group>> {
      return apiCall(
        () =>
          http.patch(`/api/v1/groups/${groupId}`, {
            name: data.name,
            description: data.description,
            visibility:
              data.visibility ??
              (data.isPublic !== undefined ? (data.isPublic ? 'public' : 'private') : undefined),
            category: data.category,
            features: data.features,
            icon_url: data.icon_url,
            banner_url: data.banner_url,
            is_node_gated: data.is_node_gated,
            gate_type: data.gate_type,
            gate_price_nodes: data.gate_price_nodes,
          }),
        GroupResponseSchema
      );
    },

    /** Delete a group. */
    async delete(groupId: string): Promise<ApiResult<Ack>> {
      return apiCall(() => http.delete(`/api/v1/groups/${groupId}`), AckSchema);
    },

    /** Join a group. */
    async join(groupId: string): Promise<ApiResult<Group>> {
      return apiCall(() => http.post(`/api/v1/groups/${groupId}/join`), GroupResponseSchema);
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
        GroupListResponseSchema
      );
    },

    /** Get featured groups. */
    async getFeatured(): Promise<ApiResult<Group[]>> {
      return apiCall(() => http.get('/api/v1/groups/featured'), GroupListResponseSchema);
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
        GroupMemberListResponseSchema
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
        GroupInviteListResponseSchema
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
        GroupInviteResponseSchema
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
