/**
 * Location sharing endpoints.
 *
 * Routes are under /api/v1/conversations/:conversation_id/location-share.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ActiveLocationShareSchema = z.object({
  id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  duration: z.number(),
  expires_at: z.string(),
  proximity_threshold: z.number().nullable().optional(),
  tracker_status: z.string().optional(),
});

const ActiveShareListSchema = z.array(
  z.object({
    id: z.string(),
    user_id: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullable().optional(),
    heading: z.number().nullable().optional(),
    speed: z.number().nullable().optional(),
    duration: z.number(),
    expires_at: z.string(),
    proximity_threshold: z.number().nullable().optional(),
    updated_at: z.string(),
  })
);

const StopResultSchema = z.object({ status: z.string() });

const UpdateProximitySchema = z.object({
  id: z.string(),
  proximity_threshold: z.number().nullable(),
});

const StaticPinSchema = z.object({
  id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  share_type: z.string(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveLocationShare = z.infer<typeof ActiveLocationShareSchema>;
export type ActiveShareListItem = z.infer<typeof ActiveShareListSchema>[number];

export interface StartLocationShareParams {
  readonly duration: 900 | 3600 | 28800;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
  readonly heading?: number;
  readonly speed?: number;
  readonly proximity_threshold?: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates location sharing endpoints bound to the provided Axios instance. */
export function createLocationEndpoints(http: AxiosInstance) {
  return {
    /**
     * Start a live location share in a conversation.
     *
     * Creates a GenServer tracker that broadcasts GPS updates every 30s.
     */
    async startShare(
      conversationId: string,
      params: StartLocationShareParams
    ): Promise<ApiResult<ActiveLocationShare>> {
      return apiCall(
        () => http.post(`/api/v1/conversations/${conversationId}/location-share`, params),
        ActiveLocationShareSchema
      );
    },

    /**
     * Stop the active live location share in a conversation.
     */
    async stopShare(conversationId: string): Promise<ApiResult<z.infer<typeof StopResultSchema>>> {
      return apiCall(
        () => http.delete(`/api/v1/conversations/${conversationId}/location-share`),
        StopResultSchema
      );
    },

    /**
     * List all active live location shares in a conversation.
     */
    async getActiveShares(
      conversationId: string
    ): Promise<ApiResult<z.infer<typeof ActiveShareListSchema>>> {
      return apiCall(
        () => http.get(`/api/v1/conversations/${conversationId}/location-shares`),
        ActiveShareListSchema
      );
    },

    /**
     * Update the proximity threshold on an active share.
     *
     * Threshold must be between 100 and 10,000 meters.
     */
    async updateProximityThreshold(
      conversationId: string,
      proximityThreshold: number
    ): Promise<ApiResult<z.infer<typeof UpdateProximitySchema>>> {
      return apiCall(
        () =>
          http.put(`/api/v1/conversations/${conversationId}/location-share`, {
            proximity_threshold: proximityThreshold,
          }),
        UpdateProximitySchema
      );
    },

    /**
     * Send a one-time static location pin.
     */
    async sendPin(
      conversationId: string,
      params: { latitude: number; longitude: number; accuracy?: number }
    ): Promise<ApiResult<z.infer<typeof StaticPinSchema>>> {
      return apiCall(
        () => http.post(`/api/v1/conversations/${conversationId}/location-pin`, params),
        StaticPinSchema
      );
    },
  };
}
