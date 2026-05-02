/**
 * Web Push permission helpers.
 *
 * The Notification API mandates that `requestPermission()` is invoked from a
 * user-gesture handler. Calling it on page load triggers a Chrome warning and
 * permanently denies the request on Safari, so this module only exposes the
 * primitive — the Settings panel toggle is the canonical caller.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('Push:Permission');

/** Possible values, including `'unsupported'` for browsers that lack the API. */
export type PushPermission = NotificationPermission | 'unsupported';

/** True iff the browser exposes Notification + Service Worker + PushManager. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/** Synchronous read of the current permission. */
export function getPushPermission(): PushPermission {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Prompts the user for notification permission. MUST be called from a
 * user-gesture handler (button click). On platforms without support resolves
 * to `'denied'` so callers don't have to special-case the unsupported branch.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    logger.warn('Push not supported in this browser');
    return 'denied';
  }

  const result = await Notification.requestPermission();
  logger.debug('requestPushPermission result', { result });
  return result;
}
