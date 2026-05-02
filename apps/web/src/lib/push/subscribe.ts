/**
 * Web Push subscription flow.
 *
 * Owns the browser-side half of `pushManager.subscribe(...)` and the POST to
 * the backend's `/api/v1/me/push-subscriptions` endpoint. Returns the
 * `PushSubscription` so callers (Settings panel) can show the active state.
 */

import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { isPushSupported } from './permission';
import { registerServiceWorker } from './register-sw';

const logger = createLogger('Push:Subscribe');

const SUBSCRIPTIONS_ENDPOINT = '/api/v1/me/push-subscriptions';

/**
 * Decode a base64url-encoded VAPID public key into the `Uint8Array` shape the
 * `PushManager.subscribe` API expects. Implemented inline so this module has
 * no cross-package dependency on the legacy `services/web-push` helpers.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

/**
 * Creates (or reuses) the browser's Push subscription and persists it on the
 * server. Caller is responsible for ensuring `Notification.permission` is
 * `'granted'` first — this function does NOT prompt.
 *
 * Returns:
 *  - the `PushSubscription` on success
 *  - `null` if push is unsupported, the SW failed to register, or the
 *    subscribe call rejected.
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    logger.warn('subscribeToPush called in unsupported environment');
    return null;
  }

  if (typeof vapidPublicKey !== 'string' || vapidPublicKey.length === 0) {
    logger.warn('subscribeToPush requires a non-empty VAPID public key');
    return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) return null;

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  const ok = await postSubscriptionToServer(subscription);
  if (!ok) {
    logger.warn('Server failed to persist subscription; revoking locally');
    await subscription.unsubscribe().catch(() => undefined);
    return null;
  }

  return subscription;
}

/**
 * POSTs the subscription's JSON form to the backend. Returns true on a 2xx
 * response; logs and returns false otherwise so callers can revoke.
 */
async function postSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

  try {
    const response = await http.post(SUBSCRIPTIONS_ENDPOINT, {
      endpoint: json.endpoint,
      keys: json.keys,
      user_agent: userAgent,
    });

    const status = response.status;
    if (status === 200 || status === 201) return true;

    logger.warn('Unexpected status from server', { status });
    return false;
  } catch (error: unknown) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'postSubscriptionToServer failed'
    );
    return false;
  }
}
