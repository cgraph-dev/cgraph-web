/**
 * Background Sync registration helper.
 *
 * Pairs with the `sync` event handler in `apps/web/public/sw.js`. When
 * a message send fails offline, callers invoke `requestBackgroundSync()`
 * so the SW retries the queued send the moment the browser regains
 * network — even if the tab is closed by then.
 *
 * Falls back gracefully on browsers that don't expose the Background
 * Sync API (Safari today). The chat store uses its own
 * online-event-based retry path in those environments.
 */
import { createLogger } from '@/lib/logger';

const logger = createLogger('SyncRegistration');

/** Tag must match the value the SW listens for. */
export const MESSAGE_QUEUE_SYNC_TAG = 'cgraph-message-queue';

interface SyncCapableRegistration extends ServiceWorkerRegistration {
  readonly sync: { register(tag: string): Promise<void> };
}

function hasSync(reg: ServiceWorkerRegistration): reg is SyncCapableRegistration {
  return 'sync' in reg;
}

/**
 * Ask the active service worker to retry the pending message queue
 * the next time the browser is online. Resolves to `true` when the
 * registration succeeded and `false` when Background Sync is not
 * available — callers can decide whether to fall back to client-side
 * polling.
 */
export async function requestBackgroundSync(
  tag: string = MESSAGE_QUEUE_SYNC_TAG
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!hasSync(registration)) {
      logger.debug('Background Sync API not available — skipping registration');
      return false;
    }
    await registration.sync.register(tag);
    return true;
  } catch (err) {
    logger.warn('Failed to register background sync', err);
    return false;
  }
}
