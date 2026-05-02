/**
 * Reconnect banner — shown when the socket circuit breaker has tripped
 * (status === 'paused'). Lets the user manually re-establish the
 * connection. Automatic resume already happens on `window.online` and
 * tab visibility regain inside SocketManager — this banner is the
 * fallback for when neither signal fires (long-running tab, captive
 * portal cleared without a network event, etc.).
 */
import { useReducedMotion } from '@/providers/theme-enhanced';
import { socketLogger as logger } from '@/lib/logger';
import { socketManager } from '@/lib/socket';
import { useConnectionStatusStore } from '@/lib/socket/connection-status-store';

import type { ReactNode } from 'react';

/**
 * Top-mounted banner that surfaces the paused socket state with a
 * manual retry button. Renders nothing for any other status.
 */
export function ReconnectBanner(): ReactNode {
  const status = useConnectionStatusStore((s) => s.status);
  const reduceMotion = useReducedMotion();

  if (status !== 'paused') return null;

  function handleRetry(): void {
    logger.info('Manual reconnect requested via ReconnectBanner');
    socketManager.connect();
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full border border-[var(--token-border-subtle)] bg-[var(--token-card-bg)] px-4 py-2 text-sm shadow-lg backdrop-blur"
      style={{ transition: reduceMotion ? 'none' : 'opacity 200ms ease' }}
    >
      <span className="text-[var(--token-text-secondary)]">Reconnecting paused.</span>{' '}
      <button
        type="button"
        onClick={handleRetry}
        className="font-semibold text-[var(--token-interactive-primary)] underline-offset-2 hover:underline focus-visible:underline"
      >
        Retry now
      </button>
    </div>
  );
}
