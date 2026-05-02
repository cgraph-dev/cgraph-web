/**
 * Invite endpoints (app-level invites, not group invites).
 *
 * Endpoints under /api/v1/invites.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { InviteSchema, RedeemInviteResponseSchema } from '../schemas/invites';
import type { Invite, RedeemInviteResponse } from '../schemas/invites';

export type { Invite, RedeemInviteResponse };

const EmptySchema = z.object({}).passthrough();

/**
 * Creates invite endpoints for managing platform invite codes.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all invite-related endpoint methods
 */
export function createInviteEndpoints(http: AxiosInstance) {
  return {
    /** Create an invite code. */
    async create(options?: {
      readonly max_uses?: number;
      readonly expires_in?: number;
    }): Promise<ApiResult<Invite>> {
      return apiCall(() => http.post('/api/v1/invites', options), InviteSchema);
    },

    /** List current user's invites. */
    async list(): Promise<ApiResult<Invite[]>> {
      return apiCall(() => http.get('/api/v1/invites'), InviteSchema.array());
    },

    /** Get invite info by code. */
    async getByCode(code: string): Promise<ApiResult<Invite>> {
      return apiCall(() => http.get(`/api/v1/invites/${code}`), InviteSchema);
    },

    /** Redeem an invite code. */
    async redeem(code: string): Promise<ApiResult<RedeemInviteResponse>> {
      return apiCall(() => http.post(`/api/v1/invites/${code}/redeem`), RedeemInviteResponseSchema);
    },

    /** Delete an invite. */
    async delete(inviteId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/invites/${inviteId}`), EmptySchema);
    },
  };
}
