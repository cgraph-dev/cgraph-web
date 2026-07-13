import { useEffect, useState } from 'react';
import type { AutoDownloadPolicy } from '@cgraph-dev/shared-types';

export interface BrowserMediaNetwork {
  readonly isOnline: boolean;
  readonly type: 'wifi' | 'unknown';
}

interface BrowserConnection {
  readonly type?: unknown;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function isBrowserConnection(value: unknown): value is BrowserConnection {
  return typeof value === 'object' && value !== null;
}

function getBrowserConnection(): BrowserConnection | undefined {
  if (typeof navigator === 'undefined') return undefined;

  const connection = Reflect.get(navigator, 'connection');
  return isBrowserConnection(connection) ? connection : undefined;
}

/** Read the narrow network signal that browsers can reliably expose to this feature. */
export function readBrowserMediaNetwork(): BrowserMediaNetwork {
  if (typeof navigator === 'undefined') {
    return { isOnline: true, type: 'unknown' };
  }

  const connection = getBrowserConnection();
  return {
    isOnline: navigator.onLine,
    type: connection?.type === 'wifi' ? 'wifi' : 'unknown',
  };
}

/**
 * Decides whether an incoming attachment may start rendering without a click.
 *
 * `wifi` is intentionally conservative: when a browser cannot expose a Wi-Fi
 * network type, the attachment remains manual rather than silently using data.
 */
export function shouldAutoDownloadIncomingMedia(
  policy: AutoDownloadPolicy,
  network: BrowserMediaNetwork
): boolean {
  if (!network.isOnline || policy === 'never') return false;
  if (policy === 'always') return true;
  return network.type === 'wifi';
}

/** Keeps the attachment renderer current when connectivity changes. */
export function useBrowserMediaNetwork(): BrowserMediaNetwork {
  const [network, setNetwork] = useState<BrowserMediaNetwork>(readBrowserMediaNetwork);

  useEffect(() => {
    const refresh = () => setNetwork(readBrowserMediaNetwork());
    const connection = getBrowserConnection();

    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    connection?.addEventListener?.('change', refresh);

    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      connection?.removeEventListener?.('change', refresh);
    };
  }, []);

  return network;
}
