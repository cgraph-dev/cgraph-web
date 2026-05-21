export function shouldLogoutForDeviceRevocation(
  payload: Record<string, unknown>,
  currentDeviceId: string
): boolean {
  const revokedDeviceId = payload['device_id'];

  return typeof revokedDeviceId === 'string' && revokedDeviceId === currentDeviceId;
}
