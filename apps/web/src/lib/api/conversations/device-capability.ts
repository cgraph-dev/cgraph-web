/**
 * Device-capability API client.
 *
 * Wraps GET /api/v1/users/:id/device-capability which tells the sender
 * whether the recipient has at least one Signal-participant device
 * (mobile or desktop). Used by the new-chat UI to warn senders that a
 * Secret Chat will be undeliverable if the recipient only has a web
 * session.
 */
import { api } from '@/lib/api';

export interface DeviceCapability {
  readonly canReceiveSecret: boolean;
}

interface DeviceCapabilityBody {
  readonly data?: { readonly canReceiveSecret?: unknown };
}

/**
 * Fetches the device capability for a user. Fails closed — if the server
 * returns anything we don't recognize we assume `canReceiveSecret: false`
 * so the UI prompts the sender to fall back to a Cloud Chat instead of
 * silently shipping a ciphertext-only Secret Chat that only they can read.
 */
export async function fetchDeviceCapability(userId: string): Promise<DeviceCapability> {
  const response = await api.get<DeviceCapabilityBody>(`/api/v1/users/${userId}/device-capability`);
  const canReceiveSecret = response.data?.data?.canReceiveSecret === true;
  return { canReceiveSecret };
}
