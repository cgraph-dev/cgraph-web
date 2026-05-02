/**
 * Follow Store — Types
 *
 * Non-reciprocal follow relation (Twitter / Telegram-channel style).
 * Distinct from the Friend relation, which is bidirectional.
 */

export interface FollowUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly avatarBorderId?: string | null;
  readonly followingCount?: number;
  readonly followersCount?: number;
}

export interface FollowList {
  readonly users: FollowUser[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

export interface FollowCounts {
  readonly following: number;
  readonly followers: number;
}

export interface FollowState {
  /** Quick lookup: is the current user following X? Capped at MAX_FOLLOWING_LOOKUP entries via LRU. */
  readonly following: Record<string, boolean>;
  /** Cached "users that X follows" lists, keyed by `userId`. Cap of MAX_LIST_KEYS. */
  readonly followingByUser: Record<string, FollowList>;
  /** Cached "users that follow X" lists, keyed by `userId`. Cap of MAX_LIST_KEYS. */
  readonly followersByUser: Record<string, FollowList>;
  /** Cached counts per user. */
  readonly counts: Record<string, FollowCounts>;
  readonly isLoading: boolean;
  readonly error: string | null;

  // Actions
  follow(userId: string): Promise<void>;
  unfollow(userId: string): Promise<void>;
  fetchFollowing(userId: string, cursor?: string | null): Promise<void>;
  fetchFollowers(userId: string, cursor?: string | null): Promise<void>;
  fetchCounts(userId: string): Promise<void>;
  reset(): void;
}
