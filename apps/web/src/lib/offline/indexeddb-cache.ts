import { createLogger } from '@/lib/logger';

const logger = createLogger('IndexedDBCache');

const DB_NAME = 'cgraph_offline';
const DB_VERSION = 4;
const MAX_MESSAGES_PER_CONVERSATION = 100;

const MESSAGES_STORE = 'messages';
const CONVERSATIONS_STORE = 'conversations';
const PENDING_STORE = 'pending_messages';
const SYNC_META_STORE = 'sync_meta';
const DRAFTS_STORE = 'drafts';
export const DRAFTS_CHANGED_EVENT = 'cgraph:drafts-changed';

export interface CachedMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string | null;
  readonly contentType: string;
  readonly isEncrypted: boolean;
  readonly isEdited: boolean;
  readonly clientMessageId?: string | null;
  readonly replyToId?: string | null;
  readonly sender: {
    readonly id: string;
    readonly username: string | null;
    readonly displayName: string | null;
    readonly avatarUrl: string | null;
  } | null;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CachedConversation {
  readonly id: string;
  readonly type: string;
  readonly name: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PendingMessage {
  readonly id: string;
  readonly accountId: string;
  readonly clientMessageId: string;
  readonly conversationId: string;
  readonly content: string;
  readonly contentType: string;
  readonly payload?: Record<string, unknown>;
  readonly replyToId?: string | null;
  readonly attachments?: readonly unknown[];
  readonly createdAt: number;
  readonly status: 'pending' | 'sending' | 'failed';
  readonly retryCount: number;
  readonly lastAttemptAt?: number;
  readonly lastError?: string;
}

let dbInstance: IDBDatabase | null = null;

function assertCacheKey(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const target = event.target;
      if (!target || !(target instanceof IDBOpenDBRequest)) return;
      const db = target.result;

      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const msgStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        msgStore.createIndex('by_conversation', 'conversationId', { unique: false });
        msgStore.createIndex('by_updated', ['conversationId', 'updatedAt'], {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
      }

      const pendingStore = db.objectStoreNames.contains(PENDING_STORE)
        ? request.transaction?.objectStore(PENDING_STORE)
        : db.createObjectStore(PENDING_STORE, { keyPath: 'id' });

      if (pendingStore && !pendingStore.indexNames.contains('by_conversation')) {
        pendingStore.createIndex('by_conversation', 'conversationId', { unique: false });
      }

      if (pendingStore && !pendingStore.indexNames.contains('by_status')) {
        pendingStore.createIndex('by_status', 'status', { unique: false });
      }

      if (pendingStore && !pendingStore.indexNames.contains('by_account')) {
        pendingStore.createIndex('by_account', 'accountId', { unique: false });
      }

      if (pendingStore && !pendingStore.indexNames.contains('by_account_conversation')) {
        pendingStore.createIndex('by_account_conversation', ['accountId', 'conversationId'], {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
        db.createObjectStore(SYNC_META_STORE, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'conversationId' });
      }

      // Version 2 accepted snake_case sync records without a conversationId.
      // The server is authoritative, so reset only refetchable cache state.
      if (event.oldVersion > 0 && event.oldVersion < 3 && request.transaction) {
        request.transaction.objectStore(MESSAGES_STORE).clear();
        request.transaction.objectStore(CONVERSATIONS_STORE).clear();
        request.transaction.objectStore(SYNC_META_STORE).clear();
      }

      // Pending records created before version 4 were not account-scoped. They
      // cannot safely be retried after a later sign-in, so discard only them.
      if (event.oldVersion > 0 && event.oldVersion < 4 && pendingStore) {
        pendingStore.clear();
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      dbInstance.onclose = () => {
        dbInstance = null;
      };

      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      logger.error('Failed to open IndexedDB', request.error);
      reject(request.error);
    };
  });
}

/** Run an IDB transaction and return a promise. */
function withTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T> | void
): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        const result = fn(tx);

        tx.oncomplete = () => {
          if (result instanceof IDBRequest) {
            resolve(result.result);
          } else {
            resolve(undefined);
          }
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

/** Save messages for a conversation, pruning to keep latest MAX_MESSAGES_PER_CONVERSATION. */
export async function saveMessages(
  conversationId: string,
  messages: readonly CachedMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  assertCacheKey(conversationId, 'conversationId');

  for (const message of messages) {
    assertCacheKey(message.id, 'message.id');
    assertCacheKey(message.conversationId, 'message.conversationId');

    if (message.conversationId !== conversationId) {
      throw new TypeError('message.conversationId must match the cache partition');
    }
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite');
    const store = tx.objectStore(MESSAGES_STORE);

    for (const msg of messages) {
      store.put(msg);
    }

    const index = store.index('by_updated');
    const range = IDBKeyRange.bound([conversationId, ''], [conversationId, '\uffff']);
    const request = index.getAllKeys(range);

    request.onsuccess = () => {
      const keys = request.result;
      const toRemove = keys.slice(0, keys.length - MAX_MESSAGES_PER_CONVERSATION);
      for (const key of toRemove) {
        store.delete(key);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get cached messages for a conversation, sorted by updatedAt ascending. */
export async function getMessages(conversationId: string): Promise<CachedMessage[]> {
  assertCacheKey(conversationId, 'conversationId');
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readonly');
    const store = tx.objectStore(MESSAGES_STORE);
    const index = store.index('by_conversation');

    const request = index.getAll(IDBKeyRange.only(conversationId));

    request.onsuccess = () => {
      const raw: CachedMessage[] = request.result;
      const results = raw.slice().sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      resolve(results);
    };

    tx.onerror = () => reject(tx.error);
  });
}

/** Remove messages by ID (tombstone processing). */
export async function removeMessages(messageIds: readonly string[]): Promise<void> {
  if (messageIds.length === 0) return;

  for (const id of messageIds) {
    assertCacheKey(id, 'messageId');
  }

  await withTransaction(MESSAGES_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(MESSAGES_STORE);
    for (const id of messageIds) {
      store.delete(id);
    }
  });
}

/** Save or update conversations in the cache. */
export async function saveConversations(
  conversations: readonly CachedConversation[]
): Promise<void> {
  if (conversations.length === 0) return;

  for (const conversation of conversations) {
    assertCacheKey(conversation.id, 'conversation.id');
  }

  await withTransaction(CONVERSATIONS_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(CONVERSATIONS_STORE);
    for (const conv of conversations) {
      store.put(conv);
    }
  });
}

/** Get all cached conversations. */
export async function getConversations(): Promise<CachedConversation[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVERSATIONS_STORE, 'readonly');
    const store = tx.objectStore(CONVERSATIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const raw: CachedConversation[] = request.result;
      resolve(raw);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/** Save a pending outbound message (queued while offline). */
export async function savePendingMessage(message: PendingMessage): Promise<void> {
  assertCacheKey(message.id, 'pendingMessage.id');
  assertCacheKey(message.accountId, 'pendingMessage.accountId');
  assertCacheKey(message.clientMessageId, 'pendingMessage.clientMessageId');
  assertCacheKey(message.conversationId, 'pendingMessage.conversationId');

  await withTransaction(PENDING_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(PENDING_STORE);
    store.put(message);
  });
}

/** Get one account's pending messages, ordered by createdAt ascending. */
export async function getPendingMessages(accountId: string): Promise<PendingMessage[]> {
  assertCacheKey(accountId, 'pendingMessage.accountId');
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readonly');
    const index = tx.objectStore(PENDING_STORE).index('by_account');
    const request = index.getAll(IDBKeyRange.only(accountId));

    request.onsuccess = () => {
      const raw: PendingMessage[] = request.result;
      const results = raw.slice().sort((a, b) => a.createdAt - b.createdAt);
      resolve(results);
    };

    tx.onerror = () => reject(tx.error);
  });
}

/** Get pending messages for a specific conversation. */
export async function getPendingMessagesForConversation(
  accountId: string,
  conversationId: string
): Promise<PendingMessage[]> {
  assertCacheKey(accountId, 'pendingMessage.accountId');
  assertCacheKey(conversationId, 'conversationId');
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readonly');
    const store = tx.objectStore(PENDING_STORE);
    const index = store.index('by_account_conversation');

    const request = index.getAll(IDBKeyRange.only([accountId, conversationId]));

    request.onsuccess = () => {
      const raw: PendingMessage[] = request.result;
      const results = raw.slice().sort((a, b) => a.createdAt - b.createdAt);
      resolve(results);
    };

    tx.onerror = () => reject(tx.error);
  });
}

/** Remove a pending message by ID (after successful send). */
export async function removePendingMessage(id: string): Promise<void> {
  assertCacheKey(id, 'pendingMessage.id');
  await withTransaction(PENDING_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(PENDING_STORE);
    store.delete(id);
  });
}

/** Update status of a pending message. */
export async function updatePendingMessageStatus(
  id: string,
  status: PendingMessage['status'],
  error?: string
): Promise<void> {
  assertCacheKey(id, 'pendingMessage.id');
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    const store = tx.objectStore(PENDING_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing: PendingMessage | undefined = getReq.result;
      if (!existing) {
        resolve();
        return;
      }

      store.put({
        ...existing,
        status,
        lastError: error,
        lastAttemptAt: status === 'sending' ? Date.now() : existing.lastAttemptAt,
        retryCount: status === 'failed' ? existing.retryCount + 1 : existing.retryCount,
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const LAST_SYNC_KEY = 'last_sync_timestamp';

/** Read one durable value from the existing sync metadata store. */
export async function getSyncMetadata(key: string): Promise<string | null> {
  assertCacheKey(key, 'syncMetadata.key');
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_META_STORE, 'readonly');
    const request = tx.objectStore(SYNC_META_STORE).get(key);

    request.onsuccess = () => {
      const record: { value?: unknown } | undefined = request.result;
      resolve(typeof record?.value === 'string' ? record.value : null);
    };

    tx.onerror = () => reject(tx.error);
  });
}

/** Write one durable value to the existing sync metadata store. */
export async function setSyncMetadata(key: string, value: string): Promise<void> {
  assertCacheKey(key, 'syncMetadata.key');

  await withTransaction(SYNC_META_STORE, 'readwrite', (tx) => {
    tx.objectStore(SYNC_META_STORE).put({ key, value });
  });
}

/** Get the last sync timestamp (ISO 8601 string). */
export async function getLastSyncTimestamp(): Promise<string | null> {
  return getSyncMetadata(LAST_SYNC_KEY);
}

/** Set the last sync timestamp. */
export async function setLastSyncTimestamp(timestamp: string): Promise<void> {
  await setSyncMetadata(LAST_SYNC_KEY, timestamp);
}

/** Clear all offline data (e.g. on logout). */
export async function clearOfflineData(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [MESSAGES_STORE, CONVERSATIONS_STORE, PENDING_STORE, SYNC_META_STORE, DRAFTS_STORE],
      'readwrite'
    );

    tx.objectStore(MESSAGES_STORE).clear();
    tx.objectStore(CONVERSATIONS_STORE).clear();
    tx.objectStore(PENDING_STORE).clear();
    tx.objectStore(SYNC_META_STORE).clear();
    tx.objectStore(DRAFTS_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** A draft stored per conversation. */
export interface DraftRecord {
  readonly conversationId: string;
  readonly text: string;
  readonly updatedAt: number;
}

/**
 * Persist (or clear) the draft for a conversation. An empty / whitespace-only
 * `text` removes any existing draft — matches Signal-Desktop's `saveDraft`
 * behaviour in `composer.preload.ts`.
 */
export async function saveDraft(conversationId: string, text: string): Promise<void> {
  assertCacheKey(conversationId, 'conversationId');
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    await deleteDraft(conversationId);
    return;
  }

  await withTransaction(DRAFTS_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(DRAFTS_STORE);
    store.put({
      conversationId,
      text,
      updatedAt: Date.now(),
    });
  });
  notifyDraftsChanged(conversationId);
}

/** Read a draft for a conversation, or `null` if none exists. */
export async function getDraft(conversationId: string): Promise<DraftRecord | null> {
  assertCacheKey(conversationId, 'conversationId');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.get(conversationId);

    request.onsuccess = () => {
      const record = request.result;
      if (!record || typeof record !== 'object') {
        resolve(null);
        return;
      }
      const maybe: Record<string, unknown> = record;
      if (
        typeof maybe.conversationId === 'string' &&
        typeof maybe.text === 'string' &&
        typeof maybe.updatedAt === 'number'
      ) {
        resolve({
          conversationId: maybe.conversationId,
          text: maybe.text,
          updatedAt: maybe.updatedAt,
        });
        return;
      }
      resolve(null);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove the draft for a conversation. Called after a successful send. */
export async function deleteDraft(conversationId: string): Promise<void> {
  assertCacheKey(conversationId, 'conversationId');
  await withTransaction(DRAFTS_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(DRAFTS_STORE);
    store.delete(conversationId);
  });
  notifyDraftsChanged(conversationId);
}

/** Return every stored draft, newest first. Used for conversation-list previews. */
export async function getAllDrafts(): Promise<DraftRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results: DraftRecord[] = [];
      for (const raw of request.result ?? []) {
        if (!raw || typeof raw !== 'object') continue;
        const maybe: Record<string, unknown> = raw;
        if (
          typeof maybe.conversationId === 'string' &&
          typeof maybe.text === 'string' &&
          typeof maybe.updatedAt === 'number'
        ) {
          results.push({
            conversationId: maybe.conversationId,
            text: maybe.text,
            updatedAt: maybe.updatedAt,
          });
        }
      }
      results.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(results);
    };
    tx.onerror = () => reject(tx.error);
  });
}

function notifyDraftsChanged(conversationId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(DRAFTS_CHANGED_EVENT, {
      detail: { conversationId },
    })
  );
}
