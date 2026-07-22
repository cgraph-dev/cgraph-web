/**
 * CGraph Service Worker for Push Notifications
 *
 * Handles:
 * - Web push notification reception
 * - Notification click handling
 * - Background sync of pending offline messages
 *
 * @version 0.9.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* global self, caches, clients, console, indexedDB, fetch */

const CACHE_NAME = 'cgraph-v1';
const NOTIFICATION_ICON = '/icon-192x192.png';

// Background Sync constants — must match `apps/web/src/lib/offline/`
// (DB_NAME / DB_VERSION / PENDING_STORE / sync tag).
const OFFLINE_DB_NAME = 'cgraph_offline';
const OFFLINE_DB_VERSION = 4;
const PENDING_MESSAGES_STORE = 'pending_messages';
const MESSAGE_QUEUE_SYNC_TAG = 'cgraph-message-queue';

// Install event - cache essential assets
self.addEventListener('install', (_event) => {
  console.log('[SW] Installing service worker...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (_e) {
    // Try as text if JSON parse fails
    data = {
      title: 'CGraph',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || NOTIFICATION_ICON,
    badge: '/badge-72x72.png',
    tag: data.tag || `notification-${Date.now()}`,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      id: data.id,
      ...data.data,
    },
    actions: data.actions || getDefaultActions(data.type),
  };

  event.waitUntil(self.registration.showNotification(data.title || 'CGraph', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';

  // Handle specific actions
  if (event.action === 'reply') {
    // Handle inline reply if supported
    url = getReplyUrl(data);
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else if (event.action === 'view') {
    url = getViewUrl(data);
  }

  // Open the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          // Navigate existing window
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (_event) => {
  console.log('[SW] Notification closed');
  // Could track analytics here
});

// Get default actions based on notification type
function getDefaultActions(type) {
  const REPLY_TYPES = ['message', 'direct_message', 'new_message'];
  const VIEW_DISMISS_TYPES = ['friend_request', 'group_invite'];
  const VIEW_TYPES = [
    'forum_reply',
    'mention',
    'post_reply',
    'comment_reply',
    'post_mention',
    'post_vote',
    'tip_received',
    'gift_received',
    'content_unlocked',
    'commission_claimed',
    'commission_delivered',
    'commission_accepted',
    'commission_disputed',
    'new_subscriber',
    'subscription_renewed',
    'subscription_expired',
    'security_alert',
  ];

  if (REPLY_TYPES.includes(type)) {
    return [
      { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
    ];
  }
  if (VIEW_DISMISS_TYPES.includes(type)) {
    return [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
    ];
  }
  if (VIEW_TYPES.includes(type)) {
    return [{ action: 'view', title: 'View', icon: '/icons/view.png' }];
  }
  return [];
}

// Get reply URL based on notification data
function getReplyUrl(data) {
  if (data.type === 'message' || data.type === 'direct_message') {
    return `/messages/${data.conversation_id || data.id}`;
  }
  return '/messages';
}

// Get view URL based on notification data
function getViewUrl(data) {
  const NOTIFICATION_ROUTES = {
    friend_request: () => '/friends/requests',
    friend_accepted: () => '/friends',
    group_invite: () => `/groups/${data.group_id || data.id}`,
    group_join: () => `/groups/${data.group_id || data.id}`,
    group_role_change: () => `/groups/${data.group_id || data.id}/settings`,
    post_reply: () => `/forums/post/${data.post_id || data.id}`,
    comment_reply: () => `/forums/post/${data.post_id || data.id}`,
    post_mention: () => (data.post_id ? `/forums/post/${data.post_id}` : '/forums'),
    post_vote: () => `/forums/post/${data.post_id || data.id}`,
    tip_received: () => '/settings/nodes',
    gift_received: () => '/settings/nodes',
    content_unlocked: () => '/settings/nodes',
    new_subscriber: () => '/settings/nodes',
    subscription_renewed: () => '/settings/nodes',
    subscription_expired: () => '/settings/nodes',
    commission_claimed: () => `/commissions/${data.commission_id || ''}`,
    commission_delivered: () => `/commissions/${data.commission_id || ''}`,
    commission_accepted: () => `/commissions/${data.commission_id || ''}`,
    commission_disputed: () => `/commissions/${data.commission_id || ''}`,
    security_alert: () => '/settings/account',
    welcome: () => '/onboarding',
  };

  // Handle forum mentions with group context
  if (data.type === 'mention' || data.type === 'channel_mention') {
    if (data.forum_id || data.post_id) {
      return `/forums/post/${data.post_id || data.id}`;
    }
    if (data.group_id && data.channel_id) {
      return `/groups/${data.group_id}/channels/${data.channel_id}`;
    }
    return '/';
  }

  const routeFn = NOTIFICATION_ROUTES[data.type];
  return routeFn ? routeFn() : data.url || '/notifications';
}

// pushsubscriptionchange — fires when the browser silently rotates the
// subscription's keys (e.g. Chrome's quarterly key refresh). Re-register the
// new subscription with the backend so we don't drop pushes for the user.
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] pushsubscriptionchange — re-registering with backend');
  event.waitUntil(
    (async () => {
      try {
        const subscription = await self.registration.pushManager.getSubscription();
        if (!subscription) return;

        const json = subscription.toJSON();
        await fetch('/api/v1/me/push-subscriptions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
            user_agent: self.navigator ? self.navigator.userAgent : undefined,
          }),
        });
      } catch (error) {
        console.warn('[SW] pushsubscriptionchange re-register failed', error);
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// Background Sync — drains the IndexedDB `pending_messages` queue when the
// browser regains connectivity. Fires even if the tab is closed.
//
// Mirrors the client-side push path in `lib/offline/sync-service.ts`. We POST
// each pending message to `/api/v1/conversations/:id/messages` (cookie auth)
// and delete the row on a 2xx response. Failures stay queued so the next
// `sync` event retries them.
// ---------------------------------------------------------------------------

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction;
      if (!tx) return;

      const messages = db.objectStoreNames.contains('messages')
        ? tx.objectStore('messages')
        : db.createObjectStore('messages', { keyPath: 'id' });
      if (!messages.indexNames.contains('by_conversation')) {
        messages.createIndex('by_conversation', 'conversationId', { unique: false });
      }
      if (!messages.indexNames.contains('by_updated')) {
        messages.createIndex('by_updated', ['conversationId', 'updatedAt'], { unique: false });
      }

      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }

      const pending = db.objectStoreNames.contains(PENDING_MESSAGES_STORE)
        ? tx.objectStore(PENDING_MESSAGES_STORE)
        : db.createObjectStore(PENDING_MESSAGES_STORE, { keyPath: 'id' });
      if (!pending.indexNames.contains('by_conversation')) {
        pending.createIndex('by_conversation', 'conversationId', { unique: false });
      }
      if (!pending.indexNames.contains('by_status')) {
        pending.createIndex('by_status', 'status', { unique: false });
      }
      if (!pending.indexNames.contains('by_account')) {
        pending.createIndex('by_account', 'accountId', { unique: false });
      }
      if (!pending.indexNames.contains('by_account_conversation')) {
        pending.createIndex('by_account_conversation', ['accountId', 'conversationId'], {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'conversationId' });
      }

      if (event.oldVersion > 0 && event.oldVersion < 3) {
        tx.objectStore('messages').clear();
        tx.objectStore('conversations').clear();
        tx.objectStore('sync_meta').clear();
      }
      if (event.oldVersion > 0 && event.oldVersion < 4) {
        pending.clear();
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function readPendingMessages(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(PENDING_MESSAGES_STORE)) {
      resolve([]);
      return;
    }
    const tx = db.transaction(PENDING_MESSAGES_STORE, 'readonly');
    const store = tx.objectStore(PENDING_MESSAGES_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = Array.isArray(request.result) ? request.result : [];
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

function deletePendingMessage(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_MESSAGES_STORE, 'readwrite');
    const store = tx.objectStore(PENDING_MESSAGES_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function updatePendingMessage(db, id, updates) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_MESSAGES_STORE, 'readwrite');
    const store = tx.objectStore(PENDING_MESSAGES_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const existing = request.result;
      if (!existing) {
        resolve();
        return;
      }

      const putRequest = store.put({ ...existing, ...updates });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
  });
}

async function authenticatedAccountId() {
  const response = await fetch('/api/v1/me', { credentials: 'include' });
  if (!response.ok) return null;

  const payload = await response.json();
  const accountId = payload && payload.data && payload.data.id;
  return typeof accountId === 'string' && accountId.length > 0 ? accountId : null;
}

function buildMessageBody(pending) {
  const payload =
    pending && typeof pending.payload === 'object' && pending.payload !== null
      ? pending.payload
      : null;

  if (payload) {
    return payload;
  }

  return {
    client_message_id: pending.clientMessageId,
    content: pending.content,
    content_type: pending.contentType,
    reply_to_id: pending.replyToId || null,
    attachments: pending.attachments || [],
  };
}

async function flushPendingMessage(db, pending) {
  if (!pending || typeof pending.id !== 'string' || typeof pending.conversationId !== 'string') {
    return false;
  }

  const body = buildMessageBody(pending);

  const response = await fetch(
    `/api/v1/conversations/${encodeURIComponent(pending.conversationId)}/messages`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (response.ok) {
    await deletePendingMessage(db, pending.id);
    return true;
  }

  // Terminal client errors remain visible to the user as failed messages.
  // 401/408/409/429/5xx remain pending for a later authenticated retry.
  const TRANSIENT_STATUSES = [401, 408, 409, 429];
  if (
    response.status >= 400 &&
    response.status < 500 &&
    !TRANSIENT_STATUSES.includes(response.status)
  ) {
    await updatePendingMessage(db, pending.id, {
      status: 'failed',
      lastError: `Message request failed with status ${response.status}`,
      updatedAt: Date.now(),
    });
  }
  return false;
}

async function flushPendingMessages() {
  let db;
  try {
    db = await openOfflineDB();
  } catch (error) {
    console.warn('[CGraph SW] Failed to open offline DB for sync', error);
    throw error;
  }

  const accountId = await authenticatedAccountId();
  if (!accountId) return;

  const pending = (await readPendingMessages(db)).filter(
    (message) =>
      message &&
      message.accountId === accountId &&
      (message.status === 'pending' || message.status === 'sending')
  );
  if (pending.length === 0) {
    return;
  }

  const failures = [];
  for (const message of pending) {
    try {
      const ok = await flushPendingMessage(db, message);
      if (!ok) failures.push(message.id);
    } catch (error) {
      console.warn('[CGraph SW] Pending message send failed', error);
      failures.push(message && message.id);
    }
  }

  if (failures.length > 0) {
    // Throwing here tells the SW the sync failed and the browser will retry
    // with the same tag according to its own backoff policy.
    throw new Error(`[CGraph SW] ${failures.length} pending message(s) failed`);
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag !== MESSAGE_QUEUE_SYNC_TAG) return;
  console.log('[CGraph SW] sync event for', event.tag);
  event.waitUntil(flushPendingMessages());
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker loaded');
