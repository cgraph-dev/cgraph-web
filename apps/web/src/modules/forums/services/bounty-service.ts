/**
 * @deprecated Use `apiClient.bounties` from `@/lib/api-client` instead.
 * This file will be removed in a future migration.
 *
 * Bounty API service
 *
 * Client methods for community bounties: CRUD, entries, voting,
 * and lifecycle management.
 *
 */

import { apiClient } from '@/lib/api-client';
export interface Bounty {
  readonly id: string;
  readonly forumId: string;
  readonly creatorId: string;
  readonly title: string;
  readonly description: string | null;
  readonly prizeNodes: number;
  readonly entryFeeNodes: number;
  readonly status: 'open' | 'voting' | 'completed' | 'cancelled';
  readonly winnerId: string | null;
  readonly votingEndsAt: string;
  readonly maxEntries: number;
  readonly entryCount: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BountyEntry {
  readonly id: string;
  readonly bountyId: string;
  readonly userId: string;
  readonly content: string;
  readonly mediaIds: string[];
  readonly score: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateBountyParams {
  readonly title: string;
  readonly description?: string;
  readonly prize_nodes: number;
  readonly entry_fee_nodes?: number;
  readonly voting_ends_at: string;
  readonly max_entries?: number;
}

export interface CreateEntryParams {
  readonly content: string;
  readonly media_ids?: string[];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
function num(v: unknown): number {
  return typeof v === 'number' ? v : 0;
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}
function bountyStatus(v: unknown): Bounty['status'] {
  if (v === 'open' || v === 'voting' || v === 'completed' || v === 'cancelled') return v;
  return 'open';
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function mapBounty(raw: Record<string, unknown>): Bounty {
  return {
    id: str(raw.id),
    forumId: str(raw.forum_id),
    creatorId: str(raw.creator_id),
    title: str(raw.title),
    description: strOrNull(raw.description),
    prizeNodes: num(raw.prize_nodes),
    entryFeeNodes: num(raw.entry_fee_nodes),
    status: bountyStatus(raw.status),
    winnerId: strOrNull(raw.winner_id),
    votingEndsAt: str(raw.voting_ends_at),
    maxEntries: num(raw.max_entries),
    entryCount: numOrNull(raw.entry_count),
    createdAt: str(raw.created_at),
    updatedAt: str(raw.updated_at),
  };
}

function mapEntry(raw: Record<string, unknown>): BountyEntry {
  return {
    id: str(raw.id),
    bountyId: str(raw.bounty_id),
    userId: str(raw.user_id),
    content: str(raw.content),
    mediaIds: strArray(raw.media_ids),
    score: num(raw.score),
    createdAt: str(raw.created_at),
    updatedAt: str(raw.updated_at),
  };
}

export const bountyService = {
  /** List bounties for a forum with optional status filter. */
  async listBounties(
    forumId: string,
    opts: { status?: string; cursor?: string; limit?: number } = {}
  ): Promise<{ bounties: Bounty[]; meta: { cursor: string | null; hasMore: boolean } }> {
    const result = await apiClient.bounties.list(forumId, opts);
    if (!result.ok) throw new Error(result.error.message);
    const { bounties: rawBounties, meta } = result.data;
    return {
      bounties: rawBounties.map((b) => mapBounty(b)),
      meta: { cursor: meta.cursor, hasMore: meta.has_more },
    };
  },

  /** Get a single bounty by ID. */
  async getBounty(forumId: string, bountyId: string): Promise<Bounty> {
    const result = await apiClient.bounties.get(forumId, bountyId);
    if (!result.ok) throw new Error(result.error.message);
    return mapBounty(result.data);
  },

  /** Create a new bounty. */
  async createBounty(forumId: string, params: CreateBountyParams): Promise<Bounty> {
    const result = await apiClient.bounties.create(forumId, params);
    if (!result.ok) throw new Error(result.error.message);
    return mapBounty(result.data);
  },

  /** Close voting on a bounty. */
  async closeBounty(forumId: string, bountyId: string): Promise<Bounty> {
    const result = await apiClient.bounties.close(forumId, bountyId);
    if (!result.ok) throw new Error(result.error.message);
    return mapBounty(result.data);
  },

  /** Cancel a bounty (refunds escrowed nodes). */
  async cancelBounty(forumId: string, bountyId: string): Promise<Bounty> {
    const result = await apiClient.bounties.cancel(forumId, bountyId);
    if (!result.ok) throw new Error(result.error.message);
    return mapBounty(result.data);
  },

  /** List entries for a bounty. */
  async listEntries(
    forumId: string,
    bountyId: string,
    opts: { cursor?: string; limit?: number } = {}
  ): Promise<{ entries: BountyEntry[]; meta: { cursor: string | null; hasMore: boolean } }> {
    const result = await apiClient.bounties.listEntries(forumId, bountyId, opts);
    if (!result.ok) throw new Error(result.error.message);
    const { entries: rawEntries, meta } = result.data;
    return {
      entries: rawEntries.map((e) => mapEntry(e)),
      meta: { cursor: meta.cursor, hasMore: meta.has_more },
    };
  },

  /** Submit an entry to a bounty. */
  async submitEntry(
    forumId: string,
    bountyId: string,
    params: CreateEntryParams
  ): Promise<BountyEntry> {
    const result = await apiClient.bounties.submitEntry(forumId, bountyId, params);
    if (!result.ok) throw new Error(result.error.message);
    return mapEntry(result.data);
  },

  /** Vote on a bounty entry. */
  async voteEntry(forumId: string, bountyId: string, entryId: string): Promise<BountyEntry> {
    const result = await apiClient.bounties.voteEntry(forumId, bountyId, entryId);
    if (!result.ok) throw new Error(result.error.message);
    return mapEntry(result.data);
  },
};
