/**
 * Client version check — adaptive polling for version enforcement.
 *
 * Checks the server's version requirements on app startup and when the
 * tab becomes visible. If the client version is below the minimum, triggers
 * a force-update callback.
 *
 * Mirrors Signal's RemoteDeprecationDetectorInterceptor: the client periodically
 * checks if it is deprecated and shows an update screen if needed.
 *
 * Uses adaptive visibility-change polling instead of fixed setInterval
 * (CLAUDE.md: "NEVER use fixed setInterval -- use adaptive polling or WebSocket push").
 */
import { logger } from '@/lib/logger';

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

let visibilityHandler: (() => void) | null = null;

/** Result of a version check against the server. */
interface VersionCheckResult {
  readonly needsUpdate: boolean;
  readonly forceUpdate: boolean;
  readonly latestVersion: string;
  readonly updateUrl: string | null;
}

/**
 * Check the current app version against server requirements.
 *
 * Calls GET /api/v1/app/version and compares the response against
 * the compiled-in VITE_APP_VERSION.
 */
async function checkVersion(): Promise<VersionCheckResult> {
  try {
    const response = await fetch('/api/v1/app/version?platform=web');
    const json = await response.json();
    const info = json.data;

    if (!info) {
      return {
        needsUpdate: false,
        forceUpdate: false,
        latestVersion: APP_VERSION,
        updateUrl: null,
      };
    }

    const needsUpdate = compareSemver(APP_VERSION, info.latest_version) < 0;
    const forceUpdate = compareSemver(APP_VERSION, info.min_version) < 0;

    if (info.pending_deprecation) {
      logger.warn('client_version_pending_deprecation', {
        current: APP_VERSION,
        deprecation: info.pending_deprecation,
      });
    }

    return {
      needsUpdate,
      forceUpdate,
      latestVersion: info.latest_version,
      updateUrl: info.update_url,
    };
  } catch {
    // Fail-open: don't block the app if version check fails
    return { needsUpdate: false, forceUpdate: false, latestVersion: APP_VERSION, updateUrl: null };
  }
}

/**
 * Start adaptive version checking.
 *
 * Checks on initial call, then on every tab visibility change.
 * Calls onForceUpdate when the app version is below the minimum.
 */
function startPeriodicCheck(onForceUpdate: () => void): void {
  if (visibilityHandler) return;

  // Check on initial call
  checkVersion().then((result) => {
    if (result.forceUpdate) onForceUpdate();
  });

  // Check when tab becomes visible (adaptive, not fixed interval)
  function handleVisibilityChange(): void {
    if (!document.hidden) {
      checkVersion().then((result) => {
        if (result.forceUpdate) onForceUpdate();
      });
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  visibilityHandler = handleVisibilityChange;
}

/** Stop the adaptive version check. */
function stopPeriodicCheck(): void {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
}

/**
 * Compare two semver strings.
 *
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

export { checkVersion, startPeriodicCheck, stopPeriodicCheck, compareSemver };
export type { VersionCheckResult };
