/**
 * Broadcast Store — Types
 *
 * Telegram-style one-way channels: an owner publishes posts, subscribers
 * consume the read-only feed. Forums / Hubs / Broadcasts are not
 * encrypted (CLAUDE.md Rule 8a) — content is server-readable so
 * moderation can act on it.
 */

export interface Broadcast {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly ownerId: string;
  readonly subscriberCount: number;
  readonly isVerified: boolean;
  readonly isSubscribed: boolean;
  readonly insertedAt: string | null;
  readonly updatedAt: string | null;
}

export interface BroadcastPost {
  readonly id: string;
  readonly broadcastId: string;
  readonly authorId: string | null;
  readonly content: string;
  readonly mediaUrl: string | null;
  readonly scheduledFor: string | null;
  readonly publishedAt: string | null;
  readonly viewCount: number;
  readonly insertedAt: string | null;
  readonly updatedAt: string | null;
}

export interface PostList {
  readonly posts: BroadcastPost[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

export interface CreateBroadcastInput {
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
}

export interface BroadcastState {
  readonly broadcasts: Record<string, Broadcast>;
  /** Ordered list of broadcast ids returned by the directory endpoint. */
  readonly directoryIds: string[];
  readonly directoryCursor: string | null;
  readonly directoryHasMore: boolean;
  /** Posts grouped by broadcast id, capped to MAX_LIST_KEYS keys. */
  readonly postsByBroadcast: Record<string, PostList>;
  readonly isLoading: boolean;
  readonly isLoadingPosts: boolean;
  readonly error: string | null;

  // Actions
  fetchDirectory(cursor?: string | null): Promise<void>;
  fetchBroadcast(id: string): Promise<void>;
  createBroadcast(input: CreateBroadcastInput): Promise<Broadcast | null>;
  subscribe(id: string): Promise<void>;
  unsubscribe(id: string): Promise<void>;
  fetchPosts(id: string, cursor?: string | null): Promise<void>;
  publishPost(id: string, content: string): Promise<BroadcastPost | null>;
  reset(): void;
}
