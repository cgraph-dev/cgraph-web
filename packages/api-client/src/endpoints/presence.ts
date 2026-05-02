/**
 * Presence endpoints.
 *
 * Endpoints under /api/v1/presence.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { OnlineUserSchema, PresenceResponseSchema } from '../schemas/presence';
import type { OnlineUser, PresenceResponse } from '../schemas/presence';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface GetOnlineUsersParams {
  readonly cursor?: string;
  readonly per_page?: number;
  readonly location?: string;
  readonly forum_id?: string;
  readonly thread_id?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates presence endpoints bound to the provided Axios instance. */
export function createPresenceEndpoints(http: AxiosInstance) {
  return {
    /**
     * Get the list of currently online users.
     *
     * Supports cursor pagination and optional location filters.
     */
    async getOnlineUsers(params?: GetOnlineUsersParams): Promise<ApiResult<PresenceResponse>> {
      return apiCall(() => http.get('/api/v1/presence/online', { params }), PresenceResponseSchema);
    },

    /**
     * Get the presence status of a specific user.
     */
    async getPresence(userId: string): Promise<ApiResult<OnlineUser>> {
      return apiCall(() => http.get(`/api/v1/users/${userId}/presence`), OnlineUserSchema);
    },

    /**
     * Update the current user's online status (visible / invisible).
     */
    async updateStatus(status: string): Promise<ApiResult<UpdateStatusResult>> {
      return apiCall(
        () => http.put('/api/v1/presence/status', { status }),
        UpdateStatusResultSchema
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Local schemas & types
// ---------------------------------------------------------------------------

const UpdateStatusResultSchema = z.object({
  status: z.string(),
});

export type UpdateStatusResult = z.infer<typeof UpdateStatusResultSchema>;
export type { OnlineUser, PresenceResponse } from '../schemas/presence';
