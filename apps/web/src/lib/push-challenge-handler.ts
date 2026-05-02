/**
 * Push challenge handler for web clients.
 *
 * Manages the lifecycle of push challenge resolution:
 * 1. Service worker / WebSocket receives silent push with challenge token
 * 2. Token is passed to handlePushChallengeToken()
 * 3. Token is sent to POST /challenge/push
 * 4. On success, registered listeners are notified
 *
 * Mirrors Signal's PushChallengeRequest.java: listen for FCM data message,
 * extract token, send back to server.
 */
import { logger } from '@/lib/logger';

/** Callback invoked when a push challenge is resolved or fails. */
type ChallengeListener = (resolved: boolean) => void;

const listeners = new Set<ChallengeListener>();

/**
 * Register a listener for push challenge resolution events.
 *
 * Returns an unsubscribe function.
 */
function addChallengeListener(listener: ChallengeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Handle a push challenge token received via service worker or WebSocket.
 *
 * Sends the token to the server for verification. On success, notifies
 * all registered listeners so the UI can dismiss the challenge dialog.
 */
async function handlePushChallengeToken(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/challenge/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge: token }),
    });

    if (response.ok) {
      listeners.forEach((listener) => listener(true));
      logger.info('push_challenge_resolved');
    } else {
      listeners.forEach((listener) => listener(false));
      logger.warn('push_challenge_resolution_failed');
    }
  } catch {
    listeners.forEach((listener) => listener(false));
    logger.warn('push_challenge_resolution_failed');
  }
}

export { addChallengeListener, handlePushChallengeToken };
