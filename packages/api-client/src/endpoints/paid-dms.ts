/**
 * Paid DM file endpoints.
 *
 * Endpoints under /api/v1/paid-dm.
 * Paid DMs are file attachments gated behind a node payment set by the sender.
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { PaidDmFileSchema, PendingFilesResponseSchema } from '../schemas/paid-dms';
import type { PaidDmFile, PendingFilesResponse } from '../schemas/paid-dms';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface SendPaidFileParams {
  /** ID of the user receiving the file. */
  readonly receiver_id: string;
  /** URL of the file to send (must be a pre-uploaded URL). */
  readonly file_url: string;
  /** MIME type or a human-readable type label (e.g. "image/png"). */
  readonly file_type: string;
  /** Number of nodes the receiver must pay to unlock the file. */
  readonly nodes_price: number;
}

export interface UnlockPaidFileParams {
  /** ID of the conversation message that references this file. */
  readonly message_id?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates paid DM file endpoints bound to the provided Axios instance. */
export function createPaidDmsEndpoints(http: AxiosInstance) {
  return {
    /**
     * Send a paid file to another user.
     *
     * POST /api/v1/paid-dm/send
     * Requires strict rate limiting (financial action).
     */
    async sendFile(params: SendPaidFileParams): Promise<ApiResult<PaidDmFile>> {
      return apiCall(
        () =>
          http.post('/api/v1/paid-dm/send', {
            receiver_id: params.receiver_id,
            file_url: params.file_url,
            file_type: params.file_type,
            nodes_price: params.nodes_price,
          }),
        PaidDmFileSchema
      );
    },

    /**
     * Unlock a paid file by paying the required node amount.
     *
     * PUT /api/v1/paid-dm/:id/unlock
     */
    async unlockFile(
      fileId: string,
      params?: UnlockPaidFileParams
    ): Promise<ApiResult<PaidDmFile>> {
      return apiCall(
        () => http.put(`/api/v1/paid-dm/${fileId}/unlock`, params ?? {}),
        PaidDmFileSchema
      );
    },

    /**
     * List pending paid files for the current user.
     *
     * GET /api/v1/paid-dm/pending
     * Returns files sent to the current user that have not yet been unlocked or expired.
     */
    async getPendingFiles(): Promise<ApiResult<PendingFilesResponse>> {
      return apiCall(() => http.get('/api/v1/paid-dm/pending'), PendingFilesResponseSchema);
    },
  };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { PaidDmFile, PendingFilesResponse, PaidFileStatus } from '../schemas/paid-dms';
