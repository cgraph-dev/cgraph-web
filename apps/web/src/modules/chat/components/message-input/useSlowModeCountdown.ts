/**
 * useSlowModeCountdown — composer-local slow-mode timer.
 *
 * Server is authoritative (`CGraph.Groups.SlowModeLimiter`). The composer
 * only mirrors what the server tells it: an initial cooldown anchor
 * passed in via `slowModeRetryAt`, plus locally-driven anchors set when
 * the API returns a `slow_mode_active` 429.
 *
 * Slow-mode state is intentionally NOT held in a global store — it's
 * per-conversation, per-session, and resets on reload (the next send
 * either succeeds or returns a fresh 429 with a new `retry_at`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSlowModeCountdownOptions {
  readonly slowModeSeconds?: number;
  readonly slowModeRetryAt?: string | null;
}

export interface UseSlowModeCountdownResult {
  /** true when slow mode is active for this channel (configured > 0). */
  readonly enabled: boolean;
  /** Remaining seconds until the user can send again. 0 when ready. */
  readonly remainingSeconds: number;
  /** Convenience: `remainingSeconds > 0` (i.e. user must wait). */
  readonly cooldownActive: boolean;
  /**
   * Arm the cooldown locally. Called by the composer when the API
   * returns a 429 with `details.retry_at`.
   */
  readonly armCooldown: (retryAt: string) => void;
}

const SECOND_MS = 1000;

function parseRetryAtMs(retryAt: string | null | undefined): number | null {
  if (!retryAt) return null;
  const parsed = Date.parse(retryAt);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function computeRemaining(retryAtMs: number | null): number {
  if (retryAtMs === null) return 0;
  const diffMs = retryAtMs - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / SECOND_MS);
}

/** Manage a per-composer slow-mode countdown driven by `retry_at` timestamps. */
export function useSlowModeCountdown({
  slowModeSeconds,
  slowModeRetryAt,
}: UseSlowModeCountdownOptions): UseSlowModeCountdownResult {
  const enabled = (slowModeSeconds ?? 0) > 0;

  const [retryAtMs, setRetryAtMs] = useState<number | null>(() => parseRetryAtMs(slowModeRetryAt));
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    computeRemaining(parseRetryAtMs(slowModeRetryAt))
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-arm whenever the prop instance changes.
  useEffect(() => {
    const next = parseRetryAtMs(slowModeRetryAt);
    setRetryAtMs(next);
    setRemainingSeconds(computeRemaining(next));
  }, [slowModeRetryAt]);

  // Tick every second while there's something to count down.
  useEffect(() => {
    if (retryAtMs === null) return;
    if (computeRemaining(retryAtMs) === 0) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = computeRemaining(retryAtMs);
        if (next === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return next === prev ? prev : next;
      });
    }, SECOND_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [retryAtMs]);

  const armCooldown = useCallback((retryAt: string) => {
    const ms = parseRetryAtMs(retryAt);
    setRetryAtMs(ms);
    setRemainingSeconds(computeRemaining(ms));
  }, []);

  return {
    enabled,
    remainingSeconds,
    cooldownActive: remainingSeconds > 0,
    armCooldown,
  };
}
