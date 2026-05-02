/**
 * Advanced settings panel.
 *
 * Mirrors Telegram-iOS user-facing experimental flags + reset surface.
 * Surfaces feature flags / experiments and exposes a single
 * "Reset preferences" button that snaps stickers/calls/etc. back to
 * defaults without touching the server-synced groups.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { useSettingsStore } from '@/modules/settings/store';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdvancedSettingsPanel');

export function AdvancedSettingsPanel(): ReactNode {
  const resetAllPreferences = useSettingsStore((s) => s.resetAllPreferences);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset(): Promise<void> {
    setResetting(true);
    try {
      await resetAllPreferences();
      toast.success('Local preferences reset to defaults');
      setConfirming(false);
    } catch (err) {
      logger.error('Failed to reset preferences', err);
      toast.error('Could not reset preferences');
    } finally {
      setResetting(false);
    }
  }

  function handleDownloadDebugLogs(): void {
    // Build a minimal debug bundle from the page (current URL, user agent,
    // timestamp). Real logger output already goes to Sentry — this is a
    // local-only diagnostic export the user can hand to support.
    const bundle = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cgraph-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Debug bundle downloaded');
  }

  return (
    <motion.div {...FADE_UP} className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--token-card-bg)] p-2">
          <Cog6ToothIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">Advanced</h1>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Diagnostics and preference reset
          </p>
        </div>
      </header>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-2 text-base font-semibold text-[var(--token-text-primary)]">
          Diagnostics
        </h2>
        <p className="mb-4 text-sm text-[var(--token-text-secondary)]">
          Download a small JSON bundle (current URL, user agent, timestamp) to attach when reporting
          an issue. Real telemetry goes to Sentry automatically.
        </p>
        <button
          type="button"
          onClick={handleDownloadDebugLogs}
          className="rounded-lg border border-[var(--token-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--token-text-primary)] hover:bg-[var(--token-card-bg)]"
        >
          Download debug bundle
        </button>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--token-text-primary)]">
          <ArrowPathIcon className="h-4 w-4" /> Reset local preferences
        </h2>
        <p className="mb-4 text-sm text-[var(--token-text-secondary)]">
          Snaps Stickers & Emoji and Calls back to defaults. Server-synced groups (notifications,
          privacy, appearance) are not affected.
        </p>
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="rounded-lg bg-[var(--token-danger)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Confirm reset'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={resetting}
              className="rounded-lg border border-[var(--token-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--token-text-primary)] hover:bg-[var(--token-card-bg)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-[var(--token-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--token-text-primary)] hover:bg-[var(--token-card-bg)]"
          >
            Reset preferences…
          </button>
        )}
      </GlassCard>
    </motion.div>
  );
}
