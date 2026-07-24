import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import { isAxiosError } from 'axios';
import { z } from 'zod';
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
  type PendingMessage,
} from './indexeddb-cache';

const logger = createLogger('SyncService');

const cacheKeySchema = z.string().trim().min(1);

const cachedMessageSchema: z.ZodType<CachedMessage> = z
  .object({
    id: cacheKeySchema,
    conversationId: cacheKeySchema,
    senderId: cacheKeySchema,
    content: z.string().nullable(),
    contentType: cacheKeySchema,
    isEncrypted: z.boolean(),
    isEdited: z.boolean(),
    clientMessageId: z.string().nullable().optional(),
    replyToId: z.string().nullable().optional(),
    sender: z
      .object({
        id: cacheKeySchema,
        username: z.string().nullable(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .passthrough()
      .nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: cacheKeySchema,
    updatedAt: cacheKeySchema,
  })
  .passthrough();

const cachedConversationSchema: z.ZodType<CachedConversation> = z
  .object({
    id: cacheKeySchema,
    type: cacheKeySchema,
    name: z.string().nullable(),
    createdAt: cacheKeySchema,
    updatedAt: cacheKeySchema,
  })
  .passthrough();

const pullDataSchema = z.object({
  messages: z.array(cachedMessageSchema),
  tombstones: z.array(
    z.object({
      id: cacheKeySchema,
      deleted_at: cacheKeySchema,
      conversation_id: cacheKeySchema,
    })
  ),
  conversations: z.array(cachedConversationSchema),
  cursor: z.string().nullable(),
  has_more: z.boolean(),
  server_timestamp: cacheKeySchema,
});

interface PullResponse {
  readonly data: unknown;
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
const STALE_SEND_RETRY_MS = 30_000;

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
    const result = pullDataSchema.parse(response.data);

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

function currentAccountId(): string | null {
  const accountId = useAuthStore.getState().user?.id;
  return typeof accountId === 'string' && accountId.trim().length > 0 ? accountId : null;
}

function isStaleSend(message: PendingMessage, now: number): boolean {
  if (message.status !== 'sending') return false;
  const startedAt = message.lastAttemptAt ?? message.createdAt;
  return now - startedAt >= STALE_SEND_RETRY_MS;
}

function pendingMessagePayload(message: PendingMessage): Record<string, unknown> {
  return message.payload ?? {
    client_message_id: message.clientMessageId,
    content: message.content,
    content_type: message.contentType,
    reply_to_id: message.replyToId ?? null,
    attachments: message.attachments ?? [],
  };
}

async function supportsBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    return 'sync' in (await navigator.serviceWorker.ready);
  } catch {
    return false;
  }
}

/** Retry durable messages through the direct Cloud Chat owner when Background Sync is unavailable. */
async function pushChanges(accountId: string): Promise<number> {
  if (await supportsBackgroundSync()) return 0;

  const pending = await getPendingMessages(accountId);
  if (pending.length === 0) return 0;

  const retryable = pending.filter(
    (message) => message.status === 'pending' || isStaleSend(message, Date.now())
  );
  let pushed = 0;

  for (const message of retryable) {
    await updatePendingMessageStatus(message.id, 'sending');

    try {
      await http.post(
        `/api/v1/conversations/${encodeURIComponent(message.conversationId)}/messages`,
        pendingMessagePayload(message)
      );
      await removePendingMessage(message.id);
      pushed++;
    } catch (error) {
      if (!isAxiosError(error) || !error.response || error.response.status >= 500) {
        await updatePendingMessageStatus(message.id, 'pending');
        throw error;
      }

      await updatePendingMessageStatus(message.id, 'failed', 'Message send failed.');
    }
  }

  return pushed;
}

/** Run a full pull + push sync cycle. Safe to call concurrently (deduplicates). */
export async function runSync(): Promise<SyncStats | null> {
  if (isSyncing) return null;
  if (!navigator.onLine) return null;

  const accountId = currentAccountId();
  if (!accountId) return null;

  isSyncing = true;
  const startTime = Date.now();

  try {
    const { pulled, tombstones } = await pullChanges();
    const pushed = await pushChanges(accountId);

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
