/**
 * Contact discovery and sync endpoints.
 *
 * Implements private set intersection: client hashes phone numbers locally,
 * server matches hashes against registered users.
 *
 * @see Signal CDS (Contact Discovery Service)
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  DiscoveryResultSchema,
  SyncResultSchema,
  ContactSyncStatusSchema,
  RegisteredContactSchema,
  DiscoverableResponseSchema,
} from '../schemas/contacts';
import type {
  DiscoveryResult,
  SyncResult,
  ContactSyncStatus,
  RegisteredContact,
} from '../schemas/contacts';

export type { DiscoveryResult, SyncResult, ContactSyncStatus, RegisteredContact };

/**
 * Creates contact discovery endpoint methods.
 *
 * @param http - Axios instance configured with base URL and auth headers
 */
export function createContactsEndpoints(http: AxiosInstance) {
  return {
    /**
     * Discover which phone contacts are registered on CGraph.
     * Client must SHA-256 hash E.164 phone numbers before submitting.
     */
    discover(hashes: readonly string[], syncToken?: string): Promise<ApiResult<DiscoveryResult>> {
      return apiCall(
        () =>
          http.post('/api/v1/contacts/discover', {
            hashes,
            ...(syncToken ? { sync_token: syncToken } : {}),
          }),
        DiscoveryResultSchema
      );
    },

    /**
     * Full or incremental contact sync.
     * If syncToken is provided, performs incremental sync (only new hashes).
     */
    sync(hashes: readonly string[], syncToken?: string): Promise<ApiResult<SyncResult>> {
      return apiCall(
        () =>
          http.post('/api/v1/contacts/sync', {
            hashes,
            ...(syncToken ? { sync_token: syncToken } : {}),
          }),
        SyncResultSchema
      );
    },

    /** Get current sync state (last sync time, contact count, etc.) */
    getSyncStatus(): Promise<ApiResult<ContactSyncStatus>> {
      return apiCall(() => http.get('/api/v1/contacts/sync-status'), ContactSyncStatusSchema);
    },

    /** List all previously discovered registered contacts. Cursor-paginated. */
    listRegistered(params?: {
      cursor?: string;
      limit?: number;
    }): Promise<ApiResult<readonly RegisteredContact[]>> {
      return apiCall(
        () => http.get('/api/v1/contacts/registered', { params }),
        z.array(RegisteredContactSchema)
      );
    },

    /** Toggle whether the current user appears in contact discovery. */
    setDiscoverable(discoverable: boolean): Promise<ApiResult<{ discoverable: boolean }>> {
      return apiCall(
        () => http.put('/api/v1/contacts/discoverable', { discoverable }),
        DiscoverableResponseSchema
      );
    },
  } as const;
}
