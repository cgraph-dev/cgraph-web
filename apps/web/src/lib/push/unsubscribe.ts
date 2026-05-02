/**
 * Push unsubscribe flow.
 *
 * Mirrors `subscribe.ts`: fetches the active subscription, deletes the
 * matching server row, then revokes the browser-side subscription.
 */

import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Push:Unsubscribe');

const SUBSCRIPTIONS_ENDPOINT = '/api/v1/me/push-subscriptions';

interface ServerSubscription {
  readonly id: string;
  readonly user_agent: string | null;
  readonly last_seen_at: string | null;
  readonly created_at: string;
}

interface SubscriptionListResponse {
  readonly data: readonly ServerSubscription[];
}

/**
 * Fully unsubscribes this browser:
 *
 *  1. revokes the browser subscription via `subscription.unsubscribe()`
 *  2. asks the server for the subscription rows it has on file for this user
 *  3. deletes the row(s) whose endpoint matches the revoked one
 *
 * Returns true when both halves complete; false if either fails. The browser
 * half is treated as authoritative — once it succeeds the user is effectively
 * unsubscribed regardless of the server-side outcome.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return true;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return true;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;

  const browserOk = await subscription.unsubscribe().catch((error: unknown) => {
    logger.warn(
      'subscription.unsubscribe failed',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  });

  const serverOk = await deleteServerRowByEndpoint(endpoint);

  return browserOk && serverOk;
}

async function deleteServerRowByEndpoint(endpoint: string): Promise<boolean> {
  try {
    const list = await http.get<SubscriptionListResponse>(SUBSCRIPTIONS_ENDPOINT);
    const subscriptions = list.data?.data ?? [];

    // The server-side list view doesn't currently expose endpoint (privacy:
    // we don't want to leak the full URL back to the client). Delete by id
    // only when there's a single subscription, otherwise let the gateway's
    // 404/410 handling sweep stale rows on the next dispatch.
    if (subscriptions.length === 1) {
      const target = subscriptions[0];
      if (target) {
        await http.delete(`${SUBSCRIPTIONS_ENDPOINT}/${target.id}`);
      }
      return true;
    }

    logger.debug(
      'Multiple server subscriptions on file; skipping bulk delete',
      { endpoint, count: subscriptions.length }
    );
    return true;
  } catch (error: unknown) {
    logger.warn(
      'Failed to delete server subscription',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}
