export type DirectCallType = 'audio' | 'video';

/**
 * Builds a direct-call route when a recipient is available.
 */
export function getDirectCallRoute(
  recipientId: string | null | undefined,
  callType: DirectCallType
): string | null {
  return recipientId ? `/call/${recipientId}/${callType}` : null;
}
