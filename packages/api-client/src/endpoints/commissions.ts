/**
 * Commission endpoints.
 *
 * Endpoints under /api/v1/forums/:forumId/boards/:boardId/commissions.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { CommissionSchema, CommissionStatusSchema } from '../schemas/commission';
import type { Commission, CommissionStatus } from '../schemas/commission';
import { CursorMetaSchema } from '../schemas/common';

export type { Commission, CommissionStatus };

const CommissionListSchema = z.object({
  data: CommissionSchema.array(),
  meta: CursorMetaSchema,
});

export type CommissionList = z.infer<typeof CommissionListSchema>;

function basePath(forumId: string, boardId: string): string {
  return `/api/v1/forums/${forumId}/boards/${boardId}/commissions`;
}

/**
 * Creates commission endpoints for managing commission boards.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all commission-related endpoint methods
 */
export function createCommissionEndpoints(http: AxiosInstance) {
  return {
    /** List commissions with cursor pagination and optional status filter. */
    async list(
      forumId: string,
      boardId: string,
      params?: {
        readonly status?: CommissionStatus;
        readonly limit?: number;
        readonly cursor?: string;
      }
    ): Promise<ApiResult<CommissionList>> {
      return apiCall(() => http.get(basePath(forumId, boardId), { params }), CommissionListSchema);
    },

    /** Get a single commission by ID. */
    async get(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.get(`${basePath(forumId, boardId)}/${commissionId}`),
        CommissionSchema
      );
    },

    /** Create a new commission (debits bounty from requester). */
    async create(
      forumId: string,
      boardId: string,
      data: {
        readonly title: string;
        readonly description?: string;
        readonly bounty_nodes: number;
      }
    ): Promise<ApiResult<Commission>> {
      return apiCall(() => http.post(basePath(forumId, boardId), data), CommissionSchema);
    },

    /** Claim an open commission. */
    async claim(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.post(`${basePath(forumId, boardId)}/${commissionId}/claim`),
        CommissionSchema
      );
    },

    /** Start work on a claimed commission. */
    async startWork(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.post(`${basePath(forumId, boardId)}/${commissionId}/start`),
        CommissionSchema
      );
    },

    /** Deliver work on a commission. */
    async deliver(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.post(`${basePath(forumId, boardId)}/${commissionId}/deliver`),
        CommissionSchema
      );
    },

    /** Accept delivered work (releases escrow to creator). */
    async accept(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.post(`${basePath(forumId, boardId)}/${commissionId}/accept`),
        CommissionSchema
      );
    },

    /** Dispute a delivered commission (within 72 hours). */
    async dispute(
      forumId: string,
      boardId: string,
      commissionId: string,
      reason: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () =>
          http.post(`${basePath(forumId, boardId)}/${commissionId}/dispute`, {
            reason,
          }),
        CommissionSchema
      );
    },

    /** Cancel a commission (open or claimed only, refunds escrow). */
    async cancel(
      forumId: string,
      boardId: string,
      commissionId: string
    ): Promise<ApiResult<Commission>> {
      return apiCall(
        () => http.post(`${basePath(forumId, boardId)}/${commissionId}/cancel`),
        CommissionSchema
      );
    },
  };
}

// Re-export schema enum for consumers that need it
export { CommissionStatusSchema };
