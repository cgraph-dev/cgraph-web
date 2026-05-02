/**
 * Broadcast Store — Zustand state for Telegram-style one-way channels.
 *
 * Cursor pagination of both the directory and per-broadcast post lists.
 * Optimistic subscribe / unsubscribe with rollback on failure.
 *
 * Memory bounds (CLAUDE.md Rule 10):
 *   - `broadcasts` map capped at `MAX_BROADCASTS` entries.
 *   - `postsByBroadcast` capped at `MAX_LIST_KEYS` keys.
 *   - Each post list capped at `MAX_POSTS_PER_BROADCAST` entries.
 */

import { create } from 'zustand';
import { http } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api';
import { logger } from '@/lib/logger';
import type {
  Broadcast,
  BroadcastPost,
  BroadcastState,
  CreateBroadcastInput,
  PostList,
} from './broadcastStore.types';

export type {
  Broadcast,
  BroadcastPost,
  BroadcastState,
  CreateBroadcastInput,
  PostList,
} from './broadcastStore.types';

const MAX_BROADCASTS = 500;
const MAX_LIST_KEYS = 50;
const MAX_POSTS_PER_BROADCAST = 200;

interface ServerBroadcast {
  readonly id: unknown;
  readonly name?: unknown;
  readonly slug?: unknown;
  readonly description?: unknown;
  readonly avatar_url?: unknown;
  readonly banner_url?: unknown;
  readonly owner_id?: unknown;
  readonly subscriber_count?: unknown;
  readonly is_verified?: unknown;
  readonly is_subscribed?: unknown;
  readonly inserted_at?: unknown;
  readonly updated_at?: unknown;
}

interface ServerPost {
  readonly id: unknown;
  readonly broadcast_id?: unknown;
  readonly author_id?: unknown;
  readonly content?: unknown;
  readonly media_url?: unknown;
  readonly scheduled_for?: unknown;
  readonly published_at?: unknown;
  readonly view_count?: unknown;
  readonly inserted_at?: unknown;
  readonly updated_at?: unknown;
}

interface PageInfo {
  readonly endCursor: string | null;
  readonly hasMore: boolean;
}

interface ServerListResponse {
  readonly data: unknown;
  readonly page_info?: unknown;
}

interface ServerSingleResponse {
  readonly data: unknown;
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

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isServerBroadcast(value: unknown): value is ServerBroadcast {
  return isObject(value) && 'id' in value;
}

function isServerPost(value: unknown): value is ServerPost {
  return isObject(value) && 'id' in value;
}

function normalizeBroadcast(raw: unknown): Broadcast | null {
  if (!isServerBroadcast(raw)) return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    name: asString(raw.name, ''),
    slug: asString(raw.slug, ''),
    description: asStringOrNull(raw.description),
    avatarUrl: asStringOrNull(raw.avatar_url),
    bannerUrl: asStringOrNull(raw.banner_url),
    ownerId: asString(raw.owner_id, ''),
    subscriberCount: asNumber(raw.subscriber_count, 0),
    isVerified: asBool(raw.is_verified, false),
    isSubscribed: asBool(raw.is_subscribed, false),
    insertedAt: asStringOrNull(raw.inserted_at),
    updatedAt: asStringOrNull(raw.updated_at),
  };
}

function normalizeBroadcasts(raw: unknown): Broadcast[] {
  if (!Array.isArray(raw)) return [];
  const out: Broadcast[] = [];
  for (const entry of raw) {
    const broadcast = normalizeBroadcast(entry);
    if (broadcast) out.push(broadcast);
  }
  return out;
}

function normalizePost(raw: unknown): BroadcastPost | null {
  if (!isServerPost(raw)) return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    broadcastId: asString(raw.broadcast_id, ''),
    authorId: asStringOrNull(raw.author_id),
    content: asString(raw.content, ''),
    mediaUrl: asStringOrNull(raw.media_url),
    scheduledFor: asStringOrNull(raw.scheduled_for),
    publishedAt: asStringOrNull(raw.published_at),
    viewCount: asNumber(raw.view_count, 0),
    insertedAt: asStringOrNull(raw.inserted_at),
    updatedAt: asStringOrNull(raw.updated_at),
  };
}

function normalizePosts(raw: unknown): BroadcastPost[] {
  if (!Array.isArray(raw)) return [];
  const out: BroadcastPost[] = [];
  for (const entry of raw) {
    const post = normalizePost(entry);
    if (post) out.push(post);
  }
  return out;
}

function extractPageInfo(raw: unknown): PageInfo {
  if (!isObject(raw)) return { endCursor: null, hasMore: false };
  const endCursor = typeof raw.end_cursor === 'string' ? raw.end_cursor : null;
  const hasMore = raw.has_next_page === true;
  return { endCursor, hasMore };
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

function applySubscriptionUpdate(broadcast: Broadcast, isSubscribed: boolean): Broadcast {
  const wasSubscribed = broadcast.isSubscribed;
  if (wasSubscribed === isSubscribed) return broadcast;
  const delta = isSubscribed ? 1 : -1;
  return {
    ...broadcast,
    isSubscribed,
    subscriberCount: Math.max(0, broadcast.subscriberCount + delta),
  };
}

function dedupePostList(existing: BroadcastPost[], incoming: BroadcastPost[]): BroadcastPost[] {
  if (existing.length === 0) return incoming.slice(0, MAX_POSTS_PER_BROADCAST);
  const seen = new Set(existing.map((p) => p.id));
  const merged = existing.slice();
  for (const post of incoming) {
    if (!seen.has(post.id)) {
      merged.push(post);
      seen.add(post.id);
    }
  }
  return merged.slice(0, MAX_POSTS_PER_BROADCAST);
}

const initialState: Pick<
  BroadcastState,
  | 'broadcasts'
  | 'directoryIds'
  | 'directoryCursor'
  | 'directoryHasMore'
  | 'postsByBroadcast'
  | 'isLoading'
  | 'isLoadingPosts'
  | 'error'
> = {
  broadcasts: {},
  directoryIds: [],
  directoryCursor: null,
  directoryHasMore: false,
  postsByBroadcast: {},
  isLoading: false,
  isLoadingPosts: false,
  error: null,
};

export const useBroadcastStore = create<BroadcastState>()((set, get) => ({
  ...initialState,

  fetchDirectory: async (cursor: string | null = null): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const params = cursor ? { cursor } : {};
      const response = await http.get<ServerListResponse>('/api/v1/broadcasts', { params });
      const list = normalizeBroadcasts(response.data?.data);
      const { endCursor, hasMore } = extractPageInfo(response.data?.page_info);

      set((state) => {
        const broadcasts = { ...state.broadcasts };
        const ids = cursor ? [...state.directoryIds] : [];
        const seen = new Set(ids);
        for (const broadcast of list) {
          broadcasts[broadcast.id] = broadcast;
          if (!seen.has(broadcast.id)) {
            ids.push(broadcast.id);
            seen.add(broadcast.id);
          }
        }
        return {
          broadcasts: trimMap(broadcasts, MAX_BROADCASTS),
          directoryIds: ids,
          directoryCursor: endCursor,
          directoryHasMore: hasMore,
          isLoading: false,
        };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchBroadcast: async (id: string): Promise<void> => {
    set({ error: null });
    try {
      const response = await http.get<ServerSingleResponse>(`/api/v1/broadcasts/${id}`);
      const broadcast = normalizeBroadcast(response.data?.data);
      if (!broadcast) return;
      set((state) => ({
        broadcasts: trimMap({ ...state.broadcasts, [broadcast.id]: broadcast }, MAX_BROADCASTS),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  createBroadcast: async (input: CreateBroadcastInput): Promise<Broadcast | null> => {
    set({ error: null });
    try {
      const body = {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
      };
      const response = await http.post<ServerSingleResponse>('/api/v1/broadcasts', body);
      const broadcast = normalizeBroadcast(response.data?.data);
      if (!broadcast) return null;
      set((state) => ({
        broadcasts: trimMap({ ...state.broadcasts, [broadcast.id]: broadcast }, MAX_BROADCASTS),
        directoryIds: [broadcast.id, ...state.directoryIds.filter((id) => id !== broadcast.id)],
      }));
      return broadcast;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      return null;
    }
  },

  subscribe: async (id: string): Promise<void> => {
    const previous = get().broadcasts[id];
    set((state) => {
      const current = state.broadcasts[id];
      if (!current) return state;
      return {
        broadcasts: { ...state.broadcasts, [id]: applySubscriptionUpdate(current, true) },
        error: null,
      };
    });

    try {
      await http.post<unknown>(`/api/v1/broadcasts/${id}/subscribe`);
    } catch (error: unknown) {
      // Roll back on failure.
      if (previous) {
        set((state) => ({
          broadcasts: { ...state.broadcasts, [id]: previous },
          error: getErrorMessage(error),
        }));
      } else {
        set({ error: getErrorMessage(error) });
      }
      throw error;
    }
  },

  unsubscribe: async (id: string): Promise<void> => {
    const previous = get().broadcasts[id];
    set((state) => {
      const current = state.broadcasts[id];
      if (!current) return state;
      return {
        broadcasts: { ...state.broadcasts, [id]: applySubscriptionUpdate(current, false) },
        error: null,
      };
    });

    try {
      await http.delete<unknown>(`/api/v1/broadcasts/${id}/subscribe`);
    } catch (error: unknown) {
      if (previous) {
        set((state) => ({
          broadcasts: { ...state.broadcasts, [id]: previous },
          error: getErrorMessage(error),
        }));
      } else {
        set({ error: getErrorMessage(error) });
      }
      throw error;
    }
  },

  fetchPosts: async (id: string, cursor: string | null = null): Promise<void> => {
    set({ isLoadingPosts: true, error: null });
    try {
      const params = cursor ? { cursor } : {};
      const response = await http.get<ServerListResponse>(`/api/v1/broadcasts/${id}/posts`, {
        params,
      });
      const incoming = normalizePosts(response.data?.data);
      const { endCursor, hasMore } = extractPageInfo(response.data?.page_info);

      set((state) => {
        const existing = cursor ? (state.postsByBroadcast[id]?.posts ?? []) : [];
        const merged: PostList = {
          posts: dedupePostList(existing, incoming),
          cursor: endCursor,
          hasMore,
        };
        const postsByBroadcast = trimMap(
          { ...state.postsByBroadcast, [id]: merged },
          MAX_LIST_KEYS
        );
        return { postsByBroadcast, isLoadingPosts: false };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoadingPosts: false });
    }
  },

  publishPost: async (id: string, content: string): Promise<BroadcastPost | null> => {
    set({ error: null });
    try {
      const response = await http.post<ServerSingleResponse>(`/api/v1/broadcasts/${id}/posts`, {
        content,
      });
      const post = normalizePost(response.data?.data);
      if (!post) return null;
      set((state) => {
        const existing = state.postsByBroadcast[id]?.posts ?? [];
        const merged: PostList = {
          posts: dedupePostList([post, ...existing], []),
          cursor: state.postsByBroadcast[id]?.cursor ?? null,
          hasMore: state.postsByBroadcast[id]?.hasMore ?? false,
        };
        return {
          postsByBroadcast: trimMap({ ...state.postsByBroadcast, [id]: merged }, MAX_LIST_KEYS),
        };
      });
      return post;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.warn('Failed to publish broadcast post', { id, error: message });
      set({ error: message });
      return null;
    }
  },

  reset: (): void => set({ ...initialState }),
}));
