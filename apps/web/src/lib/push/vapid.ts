/**
 * VAPID public-key resolution for browser push subscriptions.
 *
 * Deployments normally provide the public key at build time. The public
 * endpoint preserves the existing fallback for deployments that do not.
 */
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Push:Vapid');
const ENVIRONMENT_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

let cachedVapidPublicKey: string | null = null;

export async function getVapidPublicKey(): Promise<string | null> {
  if (ENVIRONMENT_VAPID_PUBLIC_KEY) return ENVIRONMENT_VAPID_PUBLIC_KEY;
  if (cachedVapidPublicKey) return cachedVapidPublicKey;

  try {
    const response = await http.get('/api/v1/web-push/vapid-key');
    const publicKey = response.data?.data?.vapid_public_key;
    if (typeof publicKey === 'string' && publicKey.length > 0) {
      cachedVapidPublicKey = publicKey;
      return publicKey;
    }
  } catch (error: unknown) {
    logger.warn(
      'Failed to resolve VAPID public key',
      error instanceof Error ? error.message : String(error)
    );
  }

  return null;
}
