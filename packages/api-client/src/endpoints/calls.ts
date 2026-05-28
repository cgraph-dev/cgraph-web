/**
 * Calls endpoints (transport-only).
 *
 * These are the REST endpoints for call lifecycle management.
 * WebRTC signaling (offer/answer/ICE candidate exchange) happens
 * over the `call:{call_id}` Phoenix channel — not HTTP.
 *
 * Routes are under /api/v1/calls (see messaging_routes.ex).
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  CallHistoryDataSchema,
  CallInfoSchema,
  MissedCallCountSchema,
  MissedSeenResultSchema,
  IceServersResultSchema,
} from '../schemas/calls';
import type {
  CallInfo,
  CallHistory,
  MissedCallCount,
  MissedSeenResult,
  IceServersResult,
} from '../schemas/calls';

// Re-export types for consumers that import from this module directly.
export type { CallInfo, CallHistory, MissedCallCount, MissedSeenResult, IceServersResult };

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface GetCallHistoryParams {
  readonly cursor?: string;
  readonly limit?: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates call endpoints bound to the provided Axios instance. */
export function createCallsEndpoints(http: AxiosInstance) {
  return {
    /**
     * Fetch the authenticated user's call history with cursor pagination.
     *
     * Pass `cursor` from the previous response to retrieve the next page.
     * The backend caps `limit` at 100 and defaults to 50.
     */
    async getHistory(params?: GetCallHistoryParams): Promise<ApiResult<CallHistory>> {
      const result = await apiCall(() => http.get('/api/v1/calls', { params }), CallHistoryDataSchema);

      if (!result.ok) return result;

      return {
        ok: true,
        data: {
          calls: result.data,
          cursor: result.pageInfo?.end_cursor ?? null,
          has_more: result.pageInfo?.has_next_page ?? false,
        },
        ...(result.pageInfo ? { pageInfo: result.pageInfo } : {}),
      };
    },

    /**
     * Fetch a single call record by ID.
     */
    async getCallDetails(callId: string): Promise<ApiResult<CallInfo>> {
      return apiCall(() => http.get(`/api/v1/calls/${callId}`), CallInfoSchema);
    },

    /**
     * Get the count of unacknowledged missed calls.
     */
    async getMissedCount(): Promise<ApiResult<MissedCallCount>> {
      return apiCall(() => http.get('/api/v1/calls/missed-count'), MissedCallCountSchema);
    },

    /**
     * Mark all missed calls as seen, resetting the missed-call badge.
     */
    async markMissedSeen(): Promise<ApiResult<MissedSeenResult>> {
      return apiCall(() => http.post('/api/v1/calls/missed-seen', {}), MissedSeenResultSchema);
    },

    /**
     * Retrieve ICE server configuration (STUN/TURN) for WebRTC clients.
     *
     * Call this before setting up a new RTCPeerConnection.
     */
    async getIceServers(): Promise<ApiResult<IceServersResult>> {
      return apiCall(() => http.get('/api/v1/calls/ice-servers'), IceServersResultSchema);
    },
  };
}
