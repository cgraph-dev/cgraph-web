/**
 * Reconnect Backoff
 *
 * Signal-style Fibonacci schedule with jitter. We reconnect forever — the
 * schedule caps delay rather than attempts — so the client keeps trying
 * long outages without hammering the server. Once the schedule is full
 * we stay at the last delay until the connection returns.
 *
 * @see reference/Signal/Signal-Desktop/ts/util/BackOff.std.ts (FIBONACCI_TIMEOUTS)
 */

const SECOND_MS = 1000;
const JITTER = 0.3;

/**
 * Delays between reconnect attempts (ms). Attempt 0 uses index 0, attempt 1
 * uses index 1, and so on; overflow attempts reuse the final value.
 * Matches Signal-Desktop's FIBONACCI_TIMEOUTS.
 */
const FIBONACCI_DELAYS_MS: ReadonlyArray<number> = [
  1 * SECOND_MS,
  2 * SECOND_MS,
  3 * SECOND_MS,
  5 * SECOND_MS,
  8 * SECOND_MS,
  13 * SECOND_MS,
  21 * SECOND_MS,
  34 * SECOND_MS,
  55 * SECOND_MS,
];

/**
 * Compute the delay before the next reconnect attempt.
 *
 * Follows Signal's pattern: Fibonacci backoff with random +/-30% jitter
 * so simultaneous clients don't reconnect in lockstep. Attempts beyond
 * the table length clamp to the last entry (55s) and stay there.
 */
export function getReconnectDelay(attempt: number): number {
  const clamped = Math.max(0, Math.min(attempt, FIBONACCI_DELAYS_MS.length - 1));
  const base = FIBONACCI_DELAYS_MS[clamped] ?? FIBONACCI_DELAYS_MS[FIBONACCI_DELAYS_MS.length - 1]!;
  const jitter = base * JITTER * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(base + jitter));
}
