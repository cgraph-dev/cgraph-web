/**
 * Bounty endpoints.
 *
 * Endpoints under /api/v1/forums/:forumId/bounties.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { BountySchema, BountyEntrySchema } from '../schemas/bounty';
import type { Bounty, BountyEntry } from '../schemas/bounty';
import { CursorMetaSchema } from '../schemas/common';

export type { Bounty, BountyEntry };

const BountyListSchema = z.object({
  bounties: BountySchema.array(),
  meta: CursorMetaSchema,
});

export type BountyList = z.infer<typeof BountyListSchema>;

const BountyEntryListSchema = z.object({
  entries: BountyEntrySchema.array(),
  meta: CursorMetaSchema,
});

export type BountyEntryList = z.infer<typeof BountyEntryListSchema>;

/**
 * Creates bounty endpoints for managing community bounties.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all bounty-related endpoint methods
 */
export function createBountyEndpoints(http: AxiosInstance) {
  return {
    /** List bounties for a forum with optional status filter. */
    async list(
      forumId: string,
      opts?: {
        readonly status?: string;
        readonly cursor?: string;
        readonly limit?: number;
      }
    ): Promise<ApiResult<BountyList>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/bounties`, { params: opts }),
        BountyListSchema
      );
    },

    /** Get a single bounty by ID. */
    async get(forumId: string, bountyId: string): Promise<ApiResult<Bounty>> {
      return apiCall(
        () => http.get(`/api/v1/forums/${forumId}/bounties/${bountyId}`),
        BountySchema
      );
    },

    /** Create a new bounty. */
    async create(
      forumId: string,
      params: {
        readonly title: string;
        readonly description?: string;
        readonly prize_nodes: number;
        readonly entry_fee_nodes?: number;
        readonly voting_ends_at: string;
        readonly max_entries?: number;
      }
    ): Promise<ApiResult<Bounty>> {
      return apiCall(() => http.post(`/api/v1/forums/${forumId}/bounties`, params), BountySchema);
    },

    /** Close voting on a bounty. */
    async close(forumId: string, bountyId: string): Promise<ApiResult<Bounty>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/bounties/${bountyId}/close`),
        BountySchema
      );
    },

    /** Cancel a bounty (refunds escrowed nodes). */
    async cancel(forumId: string, bountyId: string): Promise<ApiResult<Bounty>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/bounties/${bountyId}/cancel`),
        BountySchema
      );
    },

    /** List entries for a bounty. */
    async listEntries(
      forumId: string,
      bountyId: string,
      opts?: {
        readonly cursor?: string;
        readonly limit?: number;
      }
    ): Promise<ApiResult<BountyEntryList>> {
      return apiCall(
        () =>
          http.get(`/api/v1/forums/${forumId}/bounties/${bountyId}/entries`, {
            params: opts,
          }),
        BountyEntryListSchema
      );
    },

    /** Submit an entry to a bounty. */
    async submitEntry(
      forumId: string,
      bountyId: string,
      params: {
        readonly content: string;
        readonly media_ids?: string[];
      }
    ): Promise<ApiResult<BountyEntry>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/bounties/${bountyId}/entries`, params),
        BountyEntrySchema
      );
    },

    /** Vote on a bounty entry. */
    async voteEntry(
      forumId: string,
      bountyId: string,
      entryId: string
    ): Promise<ApiResult<BountyEntry>> {
      return apiCall(
        () => http.post(`/api/v1/forums/${forumId}/bounties/${bountyId}/entries/${entryId}/vote`),
        BountyEntrySchema
      );
    },
  };
}
