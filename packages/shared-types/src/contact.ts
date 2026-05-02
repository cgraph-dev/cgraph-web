/** Matched contact from discovery */
export interface DiscoveredContact {
  readonly phone_hash: string;
  readonly user: {
    readonly id: string;
    readonly username: string | null;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
    readonly is_verified: boolean;
  };
}

/** Discovery response from server */
export interface DiscoveryResult {
  readonly matches: readonly DiscoveredContact[];
  readonly sync_token: string;
  readonly batch_size: number;
  readonly matches_found: number;
}

/** Sync response (extends discovery with delta info) */
export interface SyncResult extends DiscoveryResult {
  readonly new_contact_ids: readonly string[];
  readonly is_incremental: boolean;
}

/** User's sync state */
export interface ContactSyncStatus {
  readonly synced_hash_count: number;
  readonly registered_contact_count: number;
  readonly last_sync_at: string | null;
  readonly last_full_sync_at: string | null;
  readonly has_sync_token: boolean;
}

/** Registered contact (previously discovered user) */
export interface RegisteredContact {
  readonly user_id: string;
  readonly username: string | null;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly is_verified: boolean;
  readonly discovered_at: string;
}
