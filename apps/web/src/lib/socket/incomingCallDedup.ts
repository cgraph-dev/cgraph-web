/**
 * Defense-in-depth dedup for `incoming_call` socket pushes.
 *
 * The server (`CGraph.Calls.RingDispatch`) is the source of truth — it caps
 * group ring fan-out and short-circuits delivery once a ring is cancelled or
 * answered. This client-side guard catches the rare cases the server cannot
 * cover: a server hiccup that re-broadcasts within a short window, a tab
 * coming back from `bfcache` that re-receives buffered pushes, or a session
 * resume that replays already-shown rings.
 *
 * If the same `callId` arrives twice within `DEDUP_WINDOW_MS`, the second
 * push is swallowed at the socket-handler boundary so the incoming-call
 * store never sees the duplicate (no double modal, no double ring tone).
 */

const DEDUP_WINDOW_MS = 5_000;
const MAX_TRACKED_CALLS = 100;

const lastSeenAt = new Map<string, number>();

/**
 * Returns `true` if the given `callId` has already been observed within the
 * dedup window — meaning the caller should drop this delivery.
 *
 * Records the timestamp on first sight so subsequent calls within the window
 * are reported as duplicates. The internal map is bounded to
 * `MAX_TRACKED_CALLS` and LRU-evicts the oldest entry when full.
 */
export function shouldDropIncomingCall(callId: string, now: number = Date.now()): boolean {
  const previous = lastSeenAt.get(callId);

  if (previous !== undefined && now - previous < DEDUP_WINDOW_MS) {
    // Refresh recency so a steady stream of duplicates keeps being dropped
    // instead of leaking through after the original entry ages out.
    lastSeenAt.set(callId, now);
    return true;
  }

  if (lastSeenAt.size >= MAX_TRACKED_CALLS && !lastSeenAt.has(callId)) {
    evictOldest();
  }

  lastSeenAt.set(callId, now);
  return false;
}

/**
 * Test-only helper to reset internal state between tests. Not exported from
 * the package barrel — only the test file imports it.
 */
export function _resetIncomingCallDedup(): void {
  lastSeenAt.clear();
}

function evictOldest(): void {
  // Map iteration order is insertion order, so the first entry is oldest.
  const oldestKey = lastSeenAt.keys().next().value;
  if (typeof oldestKey === 'string') {
    lastSeenAt.delete(oldestKey);
  }
}
