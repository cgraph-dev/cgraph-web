/**
 * Service worker registration.
 *
 * Idempotent — if the SW is already controlling the page we return the
 * existing registration instead of re-installing. Designed to be called
 * exactly once from `main.tsx` at app boot.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('Push:RegisterSW');

const SW_PATH = '/sw.js';
const SW_SCOPE = '/';

/**
 * Registers the push notification service worker. Logs and resolves to
 * `null` on failure rather than throwing — the rest of the app should
 * continue working even when SW registration fails (e.g. private mode in
 * Firefox, or strict CSP misconfigurations).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    logger.warn('Service workers not supported');
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (existing) {
      logger.debug('Service worker already registered', { scope: existing.scope });
      return existing;
    }

    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE,
    });

    await navigator.serviceWorker.ready;
    logger.debug('Service worker registered', { scope: registration.scope });
    return registration;
  } catch (error: unknown) {
    logger.warn(
      'Service worker registration failed',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
