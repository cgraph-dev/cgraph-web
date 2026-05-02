/**
 * Pulse Store
 *
 * Zustand store for Pulse (reputation) data:
 *   - Per-user, per-forum aggregated scores
 *   - Per-user reputation history (cursor-paginated)
 *   - Forum-scoped or global leaderboard (cursor-paginated)
 *
 * All API responses go through the type-guard helpers exported from
 * `@/modules/pulse/types`. The store caches scores and history with LRU-style
 * eviction so a long-lived session never grows an unbounded record.
 *
 * Wire response shape (matches MessageController):
 *   { data: T | T[], meta: { cursor: string | null, has_more: boolean } }
 */

import { create } from 'zustand';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import {
  normalizePulseScore,
  normalizePulseEntry,
  normalizePulseLeaderEntry,
  type PulseScore,
  type PulseEntry,
  type PulseLeaderEntry,
} from '@/modules/pulse/types';

const logger = createLogger('PulseStore');

const MAX_USERS_CACHED = 200;
const MAX_HISTORY_USERS = 50;
const HISTORY_LIMIT = 20;
const LEADERBOARD_LIMIT = 20;

interface PulseHistorySlice {
  readonly entries: readonly PulseEntry[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

interface PulseLeaderboardSlice {
  readonly entries: readonly PulseLeaderEntry[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
  readonly forumId: string | null;
}

interface PulseState {
  readonly scoresByUser: Record<string, readonly PulseScore[]>;
  readonly historyByUser: Record<string, PulseHistorySlice>;
  readonly leaderboard: PulseLeaderboardSlice;
  readonly isLoading: boolean;
  readonly error: string | null;

  fetchScore: (userId: string) => Promise<void>;
  fetchHistory: (userId: string, cursor?: string | null) => Promise<void>;
  fetchLeaderboard: (forumId: string | null, cursor?: string | null) => Promise<void>;
  clear: () => void;
}

interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly cursor: string | null;
    readonly hasMore: boolean;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCursor(meta: unknown): string | null {
  if (!isRecord(meta)) return null;
  const cursor = meta.cursor;
  return typeof cursor === 'string' && cursor.length > 0 ? cursor : null;
}

function extractHasMore(meta: unknown): boolean {
  if (!isRecord(meta)) return false;
  const hasMore = meta.has_more ?? meta.hasMore;
  return hasMore === true;
}

function unwrapList<T>(
  payload: unknown,
  normalize: (value: unknown) => T | null
): PaginatedResponse<T> {
  if (!isRecord(payload)) {
    return { data: [], meta: { cursor: null, hasMore: false } };
  }
  const rawList = payload.data;
  const list: T[] = [];
  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      const normalized = normalize(item);
      if (normalized !== null) list.push(normalized);
    }
  }
  return {
    data: list,
    meta: { cursor: extractCursor(payload.meta), hasMore: extractHasMore(payload.meta) },
  };
}

function unwrapScores(payload: unknown): readonly PulseScore[] {
  if (!isRecord(payload)) return [];
  const rawList = payload.data;
  if (!Array.isArray(rawList)) return [];
  const scores: PulseScore[] = [];
  for (const item of rawList) {
    const normalized = normalizePulseScore(item);
    if (normalized !== null) scores.push(normalized);
  }
  return scores;
}

function evictOldest<V>(
  record: Record<string, V>,
  max: number,
  incoming: string
): Record<string, V> {
  const keys = Object.keys(record);
  if (keys.length < max || incoming in record) return record;
  const overflow = keys.length - max + 1;
  const next: Record<string, V> = {};
  for (let i = overflow; i < keys.length; i += 1) {
    const key = keys[i];
    if (key !== undefined) {
      const value = record[key];
      if (value !== undefined) next[key] = value;
    }
  }
  return next;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'unknown error';
}

const EMPTY_LEADERBOARD: PulseLeaderboardSlice = {
  entries: [],
  cursor: null,
  hasMore: false,
  forumId: null,
};

export const usePulseStore = create<PulseState>()((set) => ({
  scoresByUser: {},
  historyByUser: {},
  leaderboard: EMPTY_LEADERBOARD,
  isLoading: false,
  error: null,

  fetchScore: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/api/v1/users/${userId}/reputation/score`);
      const scores = unwrapScores(res.data);
      set((state) => {
        const evicted = evictOldest(state.scoresByUser, MAX_USERS_CACHED, userId);
        return {
          scoresByUser: { ...evicted, [userId]: scores },
          isLoading: false,
        };
      });
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error('Failed to fetch pulse score', err);
      set({ error: message, isLoading: false });
    }
  },

  fetchHistory: async (userId: string, cursor: string | null = null) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string | number> = { limit: HISTORY_LIMIT };
      if (cursor !== null) params.cursor = cursor;
      const res = await api.get(`/api/v1/users/${userId}/reputation/history`, { params });
      const page = unwrapList(res.data, normalizePulseEntry);

      set((state) => {
        const previous = state.historyByUser[userId];
        const merged: readonly PulseEntry[] =
          cursor === null || previous === undefined
            ? page.data
            : [...previous.entries, ...page.data];
        const next: PulseHistorySlice = {
          entries: merged,
          cursor: page.meta.cursor,
          hasMore: page.meta.hasMore,
        };
        const evicted = evictOldest(state.historyByUser, MAX_HISTORY_USERS, userId);
        return {
          historyByUser: { ...evicted, [userId]: next },
          isLoading: false,
        };
      });
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error('Failed to fetch pulse history', err);
      set({ error: message, isLoading: false });
    }
  },

  fetchLeaderboard: async (forumId: string | null, cursor: string | null = null) => {
    set({ isLoading: true, error: null });
    try {
      const path =
        forumId === null ? '/api/v1/pulse/leaderboard' : `/api/v1/forums/${forumId}/leaderboard`;
      const params: Record<string, string | number> = { limit: LEADERBOARD_LIMIT };
      if (cursor !== null) params.cursor = cursor;
      const res = await api.get(path, { params });
      const page = unwrapList(res.data, normalizePulseLeaderEntry);

      set((state) => {
        const sameForum = state.leaderboard.forumId === forumId;
        const merged: readonly PulseLeaderEntry[] =
          cursor === null || !sameForum ? page.data : [...state.leaderboard.entries, ...page.data];
        return {
          leaderboard: {
            entries: merged,
            cursor: page.meta.cursor,
            hasMore: page.meta.hasMore,
            forumId,
          },
          isLoading: false,
        };
      });
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error('Failed to fetch pulse leaderboard', err);
      set({ error: message, isLoading: false });
    }
  },

  clear: () => {
    set({
      scoresByUser: {},
      historyByUser: {},
      leaderboard: EMPTY_LEADERBOARD,
      isLoading: false,
      error: null,
    });
  },
}));

export type { PulseState, PulseHistorySlice, PulseLeaderboardSlice };

export { MAX_USERS_CACHED, MAX_HISTORY_USERS, HISTORY_LIMIT, LEADERBOARD_LIMIT };
