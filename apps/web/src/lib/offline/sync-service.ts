import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import {
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  saveMessages,
  saveConversations,
  removeMessages,
  getPendingMessages,
  removePendingMessage,
  updatePendingMessageStatus,
  type CachedMessage,
  type CachedConversation,
} from './indexeddb-cache';

const logger = createLogger('SyncService');

interface PullResponse {
  readonly data: {
    readonly messages: readonly CachedMessage[];
    readonly tombstones: readonly { id: string; deleted_at: string; conversation_id: string }[];
    readonly conversations: readonly CachedConversation[];
    readonly cursor: string | null;
    readonly has_more: boolean;
    readonly server_timestamp: string;
  };
}

interface PushItemResult {
  readonly client_id: string;
  readonly status: 'ok' | 'duplicate' | 'error';
  readonly server_id: string | null;
  readonly error: string | null;
}

interface PushResponse {
  readonly data: {
    readonly messages: readonly PushItemResult[];
    readonly read_receipts: readonly PushItemResult[];
    readonly reactions: readonly PushItemResult[];
  };
}

export interface SyncStats {
  readonly pulled: number;
  readonly pushed: number;
  readonly tombstones: number;
  readonly durationMs: number;
}

let isSyncing = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let onlineHandler: (() => void) | null = null;
let offlineHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;

const VISIBLE_SYNC_DELAY_MS = 60_000;

type SyncListener = (stats: SyncStats) => void;
type StatusListener = (isOnline: boolean) => void;

const syncListeners = new Set<SyncListener>();
const statusListeners = new Set<StatusListener>();

/**
 *
 * Description.
 */
export function onSyncComplete(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/**
 *
 * Description.
 */
export function onStatusChange(listener: StatusListener): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function notifySyncComplete(stats: SyncStats): void {
  for (const listener of syncListeners) {
    try {
      listener(stats);
    } catch {
      // Don't let listener errors break sync
    }
  }
}

function notifyStatusChange(isOnline: boolean): void {
  for (const listener of statusListeners) {
    try {
      listener(isOnline);
    } catch {
      // Don't let listener errors break status updates
    }
  }
}

/** Pull changes from the server since last sync, with automatic pagination. */
async function pullChanges(): Promise<{ pulled: number; tombstones: number }> {
  const lastSynced = await getLastSyncTimestamp();
  let totalPulled = 0;
  let totalTombstones = 0;
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const params = new URLSearchParams();
    if (lastSynced) params.set('last_synced_at', lastSynced);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', '500');

    const { data: response } = await http.get<PullResponse>(
      `/api/v1/sync/offline/pull?${params.toString()}`
    );
    const result = response.data;

    if (result.messages.length > 0) {
      const byConversation = new Map<string, CachedMessage[]>();
      for (const msg of result.messages) {
        const existing = byConversation.get(msg.conversationId) ?? [];
        existing.push(msg);
        byConversation.set(msg.conversationId, existing);
      }

      for (const [convId, msgs] of byConversation) {
        await saveMessages(convId, msgs);
      }

      totalPulled += result.messages.length;
    }

    if (result.tombstones.length > 0) {
      const tombstoneIds = result.tombstones.map((t) => t.id);
      await removeMessages(tombstoneIds);
      totalTombstones += result.tombstones.length;
    }

    if (result.conversations.length > 0) {
      await saveConversations(result.conversations);
    }

    await setLastSyncTimestamp(result.server_timestamp);

    hasMore = result.has_more;
    cursor = result.cursor;
  }

  return { pulled: totalPulled, tombstones: totalTombstones };
}

/** Push pending messages from the offline queue to the server. */
async function pushChanges(): Promise<number> {
  const pending = await getPendingMessages();
  if (pending.length === 0) return 0;

  const messagesToPush = pending
    .filter((m) => m.status === 'pending')
    .map((m) => {
      const payload =
        typeof m.payload === 'object' && m.payload !== null && !Array.isArray(m.payload)
          ? m.payload
          : {
              client_message_id: m.clientMessageId,
              content: m.content,
              content_type: m.contentType,
              reply_to_id: m.replyToId ?? null,
              attachments: m.attachments ?? [],
            };

      return {
        conversation_id: m.conversationId,
        ...payload,
      };
    });

  if (messagesToPush.length === 0) return 0;

  for (const msg of pending) {
    await updatePendingMessageStatus(msg.id, 'sending');
  }

  try {
    const { data: response } = await http.post<PushResponse>('/api/v1/sync/offline/push', {
      messages: messagesToPush,
    });

    const results = response.data.messages;
    let pushed = 0;

    for (const result of results) {
      const pendingMsg = pending.find((m) => m.clientMessageId === result.client_id);
      if (!pendingMsg) continue;

      if (result.status === 'ok' || result.status === 'duplicate') {
        await removePendingMessage(pendingMsg.id);
        pushed++;
      } else {
        await updatePendingMessageStatus(pendingMsg.id, 'failed', result.error ?? undefined);
      }
    }

    return pushed;
  } catch (error) {
    for (const msg of pending) {
      await updatePendingMessageStatus(msg.id, 'pending');
    }
    throw error;
  }
}

/** Run a full pull + push sync cycle. Safe to call concurrently (deduplicates). */
export async function runSync(): Promise<SyncStats | null> {
  if (isSyncing) return null;
  if (!navigator.onLine) return null;

  isSyncing = true;
  const startTime = Date.now();

  try {
    const { pulled, tombstones } = await pullChanges();
    const pushed = await pushChanges();

    const stats: SyncStats = {
      pulled,
      pushed,
      tombstones,
      durationMs: Date.now() - startTime,
    };

    logger.info('Sync complete', stats);
    notifySyncComplete(stats);
    return stats;
  } catch (error) {
    logger.error('Sync failed', error);
    return null;
  } finally {
    isSyncing = false;
  }
}

function canScheduleSync(): boolean {
  if (!navigator.onLine) return false;
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

function clearScheduledSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function scheduleNextSync(delayMs = VISIBLE_SYNC_DELAY_MS): void {
  clearScheduledSync();
  if (!canScheduleSync()) return;

  syncTimer = setTimeout(() => {
    runSync().finally(() => scheduleNextSync());
  }, delayMs);
}

function runVisibleSync(): void {
  if (!canScheduleSync()) {
    clearScheduledSync();
    return;
  }

  runSync().finally(() => scheduleNextSync());
}

/** Start automatic syncing on startup, network reconnect, and visible-tab regain. */
export function startAutoSync(): void {
  stopAutoSync();

  onlineHandler = () => {
    notifyStatusChange(true);
    runVisibleSync();
  };

  offlineHandler = () => {
    notifyStatusChange(false);
    clearScheduledSync();
  };

  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      runVisibleSync();
    } else {
      clearScheduledSync();
    }
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  runVisibleSync();
}

/** Stop automatic syncing and clean up listeners. */
export function stopAutoSync(): void {
  clearScheduledSync();

  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }

  if (offlineHandler) {
    window.removeEventListener('offline', offlineHandler);
    offlineHandler = null;
  }

  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
}

/** Check if sync is currently running. */
export function isSyncInProgress(): boolean {
  return isSyncing;
}
