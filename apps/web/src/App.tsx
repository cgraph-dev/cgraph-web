/**
 * Application Root
 *
 * Composes the top-level providers, global handlers,
 * and route tree. All lazy page imports, route guards,
 * and auth initialization are delegated to the routes/ module.
 *
 */

import { useEffect, useState, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from '@/shared/components/page-transition';
import { AuthInitializer } from '@/routes/auth-initializer';
import { AppRoutes } from '@/routes/app-routes';
import { ReconnectBanner } from '@/components/socket/reconnect-banner';
import { useGroupStore } from '@/modules/groups/store';
import { initErrorTracking, reportWebVitals } from '@/lib/error-tracking';
import { startAutoSync, stopAutoSync } from '@/lib/offline/sync-service';
import { startPeriodicCheck, stopPeriodicCheck } from '@/lib/client-version-check';
import { useAuthStore } from '@/modules/auth/store';
import { useDesktopInit } from '@/lib/desktop/use-desktop-init';
import { applyOtherUserIdentityPayload } from '@/lib/identity/otherIdentitySync';
import { VersionUpdateGate } from '@/shared/components/version-update-gate';
import {
  applyCustomizationPreferenceSync,
  applySettingsPreferenceSync,
  applyThemePreferenceSync,
  startPreferenceSyncBus,
} from '@/lib/preferences/preference-sync-bus';
import '@/lib/theme/theme-globals.css';
import '@/styles/customization-effects.css';

// Lazy-load non-critical global components to reduce initial bundle
const IncomingCallHandler = lazy(() =>
  import('@/modules/calls/components/incoming-call-handler').then((m) => ({
    default: m.IncomingCallHandler,
  }))
);
const QuickSwitcher = lazy(() =>
  import('@/shared/components/quick-switcher').then((m) => ({ default: m.QuickSwitcher }))
);
const KeyboardShortcutsModal = lazy(() =>
  import('@/shared/components/keyboard-shortcuts-modal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);
const GroupJoinCelebration = lazy(() =>
  import('@/modules/groups/components/group-join-celebration').then((m) => ({
    default: m.GroupJoinCelebration,
  }))
);
const PushNotificationPrompt = lazy(() =>
  import('@/shared/components/push-notification-prompt').then((m) => ({
    default: m.PushNotificationPrompt,
  }))
);

const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

declare global {
  interface Window {
    __CGRAPH_E2E_PREFERENCE_SYNC_READY__?: boolean;
  }
}

// Initialize error tracking on module load
initErrorTracking();
reportWebVitals();

// Defer animated emoji catalog until after first paint — not critical for initial render.
// Uses requestIdleCallback where available, falls back to setTimeout.
const deferEmojiCatalog = () => {
  import('@/modules/chat/components/emoji-picker/emojiData')
    .then((m) => m.fetchAnimatedEmojiCatalog())
    .catch(() => {
      // Silently ignore — emojis will fall back to plain text
    });
};
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(deferEmojiCatalog);
} else {
  setTimeout(deferEmojiCatalog, 2000);
}

/** Scrolls to top on route navigation */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getUserIdFromPayload(payload: Record<string, unknown>) {
  const userId = payload.userId ?? payload.user_id;
  return typeof userId === 'string' ? userId : null;
}

function getStringFromPayload(
  payload: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

/**
 * App component.
 */
export default function App() {
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  const [versionUpdateRequired, setVersionUpdateRequired] = useState(false);
  const justJoinedGroupName = useGroupStore((s) => s.justJoinedGroupName);
  const clearJoinCelebration = useGroupStore((s) => s.clearJoinCelebration);
  const token = useAuthStore((s) => s.token);

  // Initialize desktop-native features (tray, deep links, updater, menus)
  // No-op when running in browser — all Tauri APIs are gated by isTauri()
  useDesktopInit();

  useEffect(() => startPreferenceSyncBus(), []);

  useEffect(() => {
    startPeriodicCheck(() => setVersionUpdateRequired(true));
    return stopPeriodicCheck;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSwitcherOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!token) {
      stopAutoSync();
      return;
    }

    startAutoSync();
    return () => stopAutoSync();
  }, [token]);

  useEffect(() => {
    if (!isE2EAuthBypass) return undefined;

    const handleIdentityPatch = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isRecord(event.detail)) return;
      const userId = getUserIdFromPayload(event.detail);
      if (!userId) return;
      applyOtherUserIdentityPayload(userId, event.detail);
    };

    window.addEventListener('cgraph:e2e-identity-patch', handleIdentityPatch);
    return () => window.removeEventListener('cgraph:e2e-identity-patch', handleIdentityPatch);
  }, []);

  useEffect(() => {
    if (!isE2EAuthBypass) return undefined;

    window.__CGRAPH_E2E_PREFERENCE_SYNC_READY__ = false;

    const handlePreferenceSync = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isRecord(event.detail)) return;

      const surface = getStringFromPayload(event.detail, ['surface', 'type']);
      const userId = getUserIdFromPayload(event.detail) ?? useAuthStore.getState().user?.id ?? null;
      if (!userId) return;

      if (surface === 'settings') {
        const section = getStringFromPayload(event.detail, ['section']);
        const changes = event.detail.changes;
        if (!section || !isRecord(changes)) return;

        const incomingAt =
          getStringFromPayload(event.detail, ['last_updated_at', 'lastUpdatedAt']) ??
          new Date(Date.now() + 1).toISOString();

        applySettingsPreferenceSync({
          userId,
          section,
          changes,
          lastUpdatedAt: incomingAt,
        });
        return;
      }

      if (surface === 'customization') {
        const changes = event.detail.changes ?? event.detail.customizations;
        if (isRecord(changes)) {
          applyCustomizationPreferenceSync({ userId, changes });
        }
        return;
      }

      if (surface === 'theme') {
        const theme = event.detail.theme ?? event.detail.changes;
        if (isRecord(theme)) {
          applyThemePreferenceSync({ userId, changes: theme });
        }
      }
    };

    window.addEventListener('cgraph:e2e-preference-sync', handlePreferenceSync);
    window.__CGRAPH_E2E_PREFERENCE_SYNC_READY__ = true;
    window.dispatchEvent(new Event('cgraph:e2e-preference-sync-ready'));

    return () => {
      window.removeEventListener('cgraph:e2e-preference-sync', handlePreferenceSync);
      window.__CGRAPH_E2E_PREFERENCE_SYNC_READY__ = false;
    };
  }, []);

  return (
    <AuthInitializer>
      <ScrollToTop />
      <ReconnectBanner />
      <Suspense fallback={null}>
        <IncomingCallHandler />
        <QuickSwitcher isOpen={quickSwitcherOpen} onClose={() => setQuickSwitcherOpen(false)} />
        <KeyboardShortcutsModal />
        <GroupJoinCelebration
          groupName={justJoinedGroupName ?? ''}
          show={!!justJoinedGroupName}
          onComplete={clearJoinCelebration}
        />
        <PushNotificationPrompt />
      </Suspense>
      <AnimatePresence mode="wait">
        <PageTransition>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </PageTransition>
      </AnimatePresence>
      {versionUpdateRequired && <VersionUpdateGate onReload={() => window.location.reload()} />}
    </AuthInitializer>
  );
}
