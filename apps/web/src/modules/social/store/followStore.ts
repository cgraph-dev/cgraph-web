/**
 * Follow Store — Zustand state for non-reciprocal follow relations.
 *
 * Distinct from `friendStore` (bidirectional friendship). A user follows
 * another without approval; counts and lists are publicly visible.
 *
 * Memory bounds (Rule 10):
 * - `following` lookup map capped at MAX_FOLLOWING_LOOKUP entries (LRU-evicted)
 * - `followingByUser` and `followersByUser` capped at MAX_LIST_KEYS keys
 */

import { create } from 'zustand';
import { http } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { FollowList, FollowState, FollowUser } from './followStore.types';

export type {
  FollowList,
  FollowState,
  FollowUser,
  FollowCounts,
} from './followStore.types';

const MAX_FOLLOWING_LOOKUP = 1000;
const MAX_LIST_KEYS = 50;

type FollowStoreData = Pick<
  FollowState,
  'following' | 'followingByUser' | 'followersByUser' | 'counts' | 'isLoading' | 'error'
>;

interface ServerUser {
  readonly id: unknown;
  readonly username?: unknown;
  readonly display_name?: unknown;
  readonly avatar_url?: unknown;
  readonly avatar_border_id?: unknown;
  readonly following_count?: unknown;
  readonly followers_count?: unknown;
}

interface ServerListResponse {
  readonly data: unknown;
  readonly page_info?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function isServerUser(value: unknown): value is ServerUser {
  return isObject(value) && 'id' in value;
}

function normalizeUser(raw: unknown): FollowUser | null {
  if (!isServerUser(raw)) return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    username: asString(raw.username, 'unknown'),
    displayName: asStringOrNull(raw.display_name),
    avatarUrl: asStringOrNull(raw.avatar_url),
    avatarBorderId: asStringOrNull(raw.avatar_border_id),
    followingCount: asNumberOrUndefined(raw.following_count),
    followersCount: asNumberOrUndefined(raw.followers_count),
  };
}

function normalizeUsers(raw: unknown): FollowUser[] {
  if (!Array.isArray(raw)) return [];
  const out: FollowUser[] = [];
  for (const entry of raw) {
    const user = normalizeUser(entry);
    if (user) out.push(user);
  }
  return out;
}

interface PageInfo {
  readonly endCursor: string | null;
  readonly hasMore: boolean;
}

function extractPageInfo(raw: unknown): PageInfo {
  if (!isObject(raw)) return { endCursor: null, hasMore: false };
  const endCursor = typeof raw.end_cursor === 'string' ? raw.end_cursor : null;
  const hasMore = raw.has_next_page === true;
  return { endCursor, hasMore };
}

function isFollowResponse(
  value: unknown
): value is { readonly data: { readonly following: boolean } } {
  if (!isObject(value) || !('data' in value) || !isObject(value.data)) return false;
  return 'following' in value.data;
}

function trimMap<T>(map: Record<string, T>, max: number): Record<string, T> {
  const keys = Object.keys(map);
  if (keys.length <= max) return map;
  const overflow = keys.length - max;
  const trimmed: Record<string, T> = {};
  for (const key of keys.slice(overflow)) {
    trimmed[key] = map[key]!;
  }
  return trimmed;
}

function bumpLookup(
  lookup: Record<string, boolean>,
  userId: string,
  value: boolean
): Record<string, boolean> {
  // Touch entry by re-inserting (object insertion order = recency).
  const next = { ...lookup };
  delete next[userId];
  next[userId] = value;
  return trimMap(next, MAX_FOLLOWING_LOOKUP);
}

function dropLookup(
  lookup: Record<string, boolean>,
  userId: string
): Record<string, boolean> {
  if (!(userId in lookup)) return lookup;
  const next = { ...lookup };
  delete next[userId];
  return next;
}

function bumpCount(
  counts: Record<string, { following: number; followers: number }>,
  userId: string,
  field: 'following' | 'followers',
  delta: number
): Record<string, { following: number; followers: number }> {
  const existing = counts[userId];
  if (!existing) return counts;
  return {
    ...counts,
    [userId]: {
      ...existing,
      [field]: Math.max(0, existing[field] + delta),
    },
  };
}

const initialState: FollowStoreData = {
  following: {},
  followingByUser: {},
  followersByUser: {},
  counts: {},
  isLoading: false,
  error: null,
};

export const useFollowStore = create<FollowState>()((set, get) => ({
  ...initialState,

  follow: async (userId: string) => {
    const previous = get().following[userId] ?? false;
    set((state) => ({
      following: bumpLookup(state.following, userId, true),
      counts: bumpCount(state.counts, userId, 'followers', previous ? 0 : 1),
      error: null,
    }));

    try {
      const response = await http.post<unknown>(`/api/v1/users/${userId}/follow`);
      if (!isFollowResponse(response.data)) {
        // Server contract drift — keep optimistic state but log.
        logger.warn('follow: unexpected response shape', { userId });
      }
    } catch (error: unknown) {
      // Roll back on failure.
      set((state) => ({
        following: previous
          ? bumpLookup(state.following, userId, previous)
          : dropLookup(state.following, userId),
        counts: bumpCount(state.counts, userId, 'followers', previous ? 0 : -1),
        error: getErrorMessage(error),
      }));
      throw error;
    }
  },

  unfollow: async (userId: string) => {
    const previous = get().following[userId] ?? false;
    set((state) => ({
      following: dropLookup(state.following, userId),
      counts: bumpCount(state.counts, userId, 'followers', previous ? -1 : 0),
      error: null,
    }));

    try {
      await http.delete<unknown>(`/api/v1/users/${userId}/follow`);
    } catch (error: unknown) {
      // Roll back on failure.
      set((state) => ({
        following: previous ? bumpLookup(state.following, userId, true) : state.following,
        counts: bumpCount(state.counts, userId, 'followers', previous ? 1 : 0),
        error: getErrorMessage(error),
      }));
      throw error;
    }
  },

  fetchFollowing: async (userId: string, cursor: string | null = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = cursor ? { cursor } : {};
      const response = await http.get<ServerListResponse>(`/api/v1/users/${userId}/following`, {
        params,
      });
      const users = normalizeUsers(response.data?.data);
      const { endCursor, hasMore } = extractPageInfo(response.data?.page_info);
      set((state) => {
        const existing = cursor ? state.followingByUser[userId]?.users ?? [] : [];
        const merged: FollowList = {
          users: [...existing, ...users],
          cursor: endCursor,
          hasMore,
        };
        const followingByUser = trimMap(
          { ...state.followingByUser, [userId]: merged },
          MAX_LIST_KEYS
        );
        return { followingByUser, isLoading: false };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchFollowers: async (userId: string, cursor: string | null = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = cursor ? { cursor } : {};
      const response = await http.get<ServerListResponse>(`/api/v1/users/${userId}/followers`, {
        params,
      });
      const users = normalizeUsers(response.data?.data);
      const { endCursor, hasMore } = extractPageInfo(response.data?.page_info);
      set((state) => {
        const existing = cursor ? state.followersByUser[userId]?.users ?? [] : [];
        const merged: FollowList = {
          users: [...existing, ...users],
          cursor: endCursor,
          hasMore,
        };
        const followersByUser = trimMap(
          { ...state.followersByUser, [userId]: merged },
          MAX_LIST_KEYS
        );
        return { followersByUser, isLoading: false };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchCounts: async (userId: string) => {
    try {
      const response = await http.get<{ data: unknown }>(`/api/v1/users/${userId}`);
      const data = response.data?.data;
      if (!isObject(data)) return;
      const followingCount = typeof data.following_count === 'number' ? data.following_count : 0;
      const followersCount = typeof data.followers_count === 'number' ? data.followers_count : 0;
      const isFollowed = data.is_followed_by_me === true;
      set((state) => ({
        counts: {
          ...state.counts,
          [userId]: { following: followingCount, followers: followersCount },
        },
        following:
          isFollowed || userId in state.following
            ? bumpLookup(state.following, userId, isFollowed)
            : state.following,
      }));
    } catch (error: unknown) {
      logger.warn('fetchCounts failed', { userId, error: getErrorMessage(error) });
    }
  },

  reset: () => set({ ...initialState }),
}));
