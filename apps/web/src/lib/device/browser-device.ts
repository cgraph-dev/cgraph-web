const DEVICE_ID_STORAGE_KEY = 'cgraph_device_id';

let fallbackDeviceId: string | null = null;

function createBrowserDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `web-${crypto.randomUUID()}`;
  }

  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Returns a stable web-scoped device identifier for socket joins and push registration.
 */
export function getBrowserDeviceId(storage: Storage | null = getLocalStorage()): string {
  if (!storage) {
    fallbackDeviceId ??= createBrowserDeviceId();
    return fallbackDeviceId;
  }

  try {
    const storedDeviceId = storage.getItem(DEVICE_ID_STORAGE_KEY);
    if (storedDeviceId?.startsWith('web-')) {
      return storedDeviceId;
    }

    const deviceId = createBrowserDeviceId();
    storage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
  } catch {
    fallbackDeviceId ??= createBrowserDeviceId();
    return fallbackDeviceId;
  }
}
