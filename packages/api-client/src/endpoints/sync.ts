/**
 * Sync endpoints.
 *
 * Endpoints under /api/v1/sync.
 */
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { SyncPullResponseSchema, SyncPushResponseSchema } from '../schemas/sync';
import type { SyncPullResponse, SyncPushResponse } from '../schemas/sync';

export type { SyncPullResponse, SyncPushResponse };

/**
 * Creates sync endpoints for pulling and pushing incremental changes.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all sync-related endpoint methods
 */
export function createSyncEndpoints(http: AxiosInstance) {
  return {
    /** Pull changes since a given timestamp. */
    async pullChanges(params: {
      readonly since: string;
      readonly types?: readonly string[];
    }): Promise<ApiResult<SyncPullResponse>> {
      return apiCall(
        () =>
          http.get('/api/v1/sync/pull', {
            params: {
              since: params.since,
              types: params.types?.join(','),
            },
          }),
        SyncPullResponseSchema
      );
    },

    /** Push local changes to the server. */
    async pushChanges(changes: {
      readonly type: string;
      readonly data: unknown[];
      readonly client_timestamp: string;
    }): Promise<ApiResult<SyncPushResponse>> {
      return apiCall(() => http.post('/api/v1/sync/push', changes), SyncPushResponseSchema);
    },
  };
}
