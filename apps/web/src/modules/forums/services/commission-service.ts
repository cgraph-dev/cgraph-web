/**
 * @deprecated Use `apiClient.commissions` from `@/lib/api-client` instead.
 * This file will be removed in a future migration.
 *
 * Commission Service — HTTP wrappers for commission board endpoints.
 *
 * All endpoints are scoped under:
 * /api/v1/forums/:forumId/boards/:boardId/commissions
 *
 */

import { apiClient } from '@/lib/api-client';
export type CommissionStatus =
  | 'open'
  | 'claimed'
  | 'in_progress'
  | 'delivered'
  | 'accepted'
  | 'disputed'
  | 'cancelled';

export interface Commission {
  readonly id: string;
  readonly board_id: string;
  readonly requester_id: string;
  readonly claimed_by: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly bounty_nodes: number;
  readonly status: CommissionStatus;
  readonly dispute_reason: string | null;
  readonly dispute_opened_at: string | null;
  readonly delivered_at: string | null;
  readonly accepted_at: string | null;
  readonly cancelled_at: string | null;
  readonly auto_accept_at: string | null;
  readonly inserted_at: string;
  readonly updated_at: string;
  readonly requester?: {
    readonly id: string;
    readonly username: string;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
  };
  readonly claimer?: {
    readonly id: string;
    readonly username: string;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
  };
}

export interface CommissionListMeta {
  readonly has_more: boolean;
  readonly cursor: string | null;
}

interface ListCommissionsParams {
  readonly status?: CommissionStatus;
  readonly limit?: number;
  readonly cursor?: string;
}

interface CreateCommissionParams {
  readonly title: string;
  readonly description?: string;
  readonly bounty_nodes: number;
}
function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

/** Type-safe coercion at API boundary — avoids `as` assertions. */
function coerceCommission(v: unknown): Commission;
function coerceCommission(v: unknown): unknown {
  return v;
}

export const commissionService = {
  /** List commissions with cursor pagination and optional status filter. */
  async list(
    forumId: string,
    boardId: string,
    params?: ListCommissionsParams
  ): Promise<{ data: { data: Commission[]; meta: CommissionListMeta } }> {
    const result = await apiClient.commissions.list(forumId, boardId, params);
    const raw = unwrap(result);
    return {
      data: {
        data: raw.data.map((c) => coerceCommission(c)),
        meta: raw.meta,
      },
    };
  },

  /** Get a single commission by ID. */
  async get(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.get(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Create a new commission (debits bounty from requester). */
  async create(
    forumId: string,
    boardId: string,
    data: CreateCommissionParams
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.create(forumId, boardId, data);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Claim an open commission. */
  async claim(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.claim(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Start work on a claimed commission. */
  async startWork(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.startWork(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Deliver work on a commission. */
  async deliver(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.deliver(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Accept delivered work (releases escrow to creator). */
  async accept(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.accept(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Dispute a delivered commission (within 72 hours). */
  async dispute(
    forumId: string,
    boardId: string,
    commissionId: string,
    reason: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.dispute(forumId, boardId, commissionId, reason);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },

  /** Cancel a commission (open or claimed only, refunds escrow). */
  async cancel(
    forumId: string,
    boardId: string,
    commissionId: string
  ): Promise<{ data: { data: Commission } }> {
    const result = await apiClient.commissions.cancel(forumId, boardId, commissionId);
    const raw = unwrap(result);
    return { data: { data: coerceCommission(raw) } };
  },
};
