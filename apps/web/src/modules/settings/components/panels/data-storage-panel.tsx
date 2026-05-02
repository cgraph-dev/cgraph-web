/**
 * Data & Storage settings panel.
 *
 * Mirrors Telegram's `DataAndStorageController.swift` — the user can inspect
 * and clear local cache, choose per-network auto-download policies for media
 * groups, toggle bandwidth-saver mode, and reset everything to defaults.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CircleStackIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { useSettingsStore } from '@/modules/settings/store';
import type { AutoDownloadPolicy, MediaSettings } from '@/modules/settings/store';
import { clearOfflineData } from '@/lib/offline/indexeddb-cache';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DataStoragePanel');

// Threshold under which we surface the "running low on storage" warning.
// Telegram shows a similar warning when the device has < ~100MB free.
const LOW_QUOTA_BYTES = 100 * 1024 * 1024;

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;
const BYTES_PER_GB = BYTES_PER_MB * 1024;

interface CacheReport {
  readonly used: number;
  readonly quota: number;
  readonly hasEstimate: boolean;
}

interface AutoDownloadGroup {
  readonly key: 'autoDownloadPhotos' | 'autoDownloadVideos' | 'autoDownloadFiles';
  readonly label: string;
  readonly description: string;
}

const AUTO_DOWNLOAD_GROUPS: readonly AutoDownloadGroup[] = [
  {
    key: 'autoDownloadPhotos',
    label: 'Photos',
    description: 'Download photos automatically',
  },
  {
    key: 'autoDownloadVideos',
    label: 'Videos',
    description: 'Download videos automatically',
  },
  {
    key: 'autoDownloadFiles',
    label: 'Files',
    description: 'Download other attachments automatically',
  },
] as const;

const AUTO_DOWNLOAD_OPTIONS: readonly { value: AutoDownloadPolicy; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'wifi', label: 'Wi-Fi only' },
  { value: 'never', label: 'Never' },
] as const;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  if (bytes >= BYTES_PER_GB) return `${(bytes / BYTES_PER_GB).toFixed(1)} GB`;
  if (bytes >= BYTES_PER_MB) return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
  if (bytes >= BYTES_PER_KB) return `${(bytes / BYTES_PER_KB).toFixed(0)} KB`;
  return `${bytes} B`;
}

async function readCacheReport(): Promise<CacheReport> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { used: 0, quota: 0, hasEstimate: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      hasEstimate: true,
    };
  } catch (error) {
    logger.warn('navigator.storage.estimate() failed', error);
    return { used: 0, quota: 0, hasEstimate: false };
  }
}

interface ConfirmDialogProps {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly danger?: boolean;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

function ConfirmDialog(props: ConfirmDialogProps): ReactNode {
  const { title, message, confirmLabel, danger, onConfirm, onClose } = props;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-storage-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="data-storage-confirm-title"
          className={`mb-2 text-xl font-bold ${
            danger === true
              ? 'text-[var(--token-status-danger)]'
              : 'text-[var(--token-text-primary)]'
          }`}
        >
          {title}
        </h2>
        <p className="mb-6 text-sm text-[var(--token-text-secondary)]">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--token-card-border)] py-3 text-sm font-semibold text-[var(--token-text-secondary)] transition-colors hover:bg-[var(--token-bg-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white ${
              danger === true ? 'bg-[var(--token-status-danger)]' : 'bg-primary-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AutoDownloadRowProps {
  readonly group: AutoDownloadGroup;
  readonly value: AutoDownloadPolicy;
  readonly disabled: boolean;
  readonly onChange: (value: AutoDownloadPolicy) => void;
}

function AutoDownloadRow(props: AutoDownloadRowProps): ReactNode {
  const { group, value, disabled, onChange } = props;
  const groupName = `auto-download-${group.key}`;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-[var(--token-text-primary)]">{group.label}</h3>
        <p className="text-sm text-[var(--token-text-secondary)]">{group.description}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={`Auto-download ${group.label.toLowerCase()}`}
        className="flex flex-wrap gap-2"
      >
        {AUTO_DOWNLOAD_OPTIONS.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                checked
                  ? 'border-primary-500/50 bg-primary-500/10 text-[var(--token-text-primary)]'
                  : 'border-[var(--token-card-border)] text-[var(--token-text-secondary)] hover:bg-[var(--token-bg-secondary)]'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface PendingChange {
  readonly key: AutoDownloadGroup['key'];
  readonly value: AutoDownloadPolicy;
}

const SAVE_DEBOUNCE_MS = 500;

/**
 * Data & Storage settings panel.
 */
export function DataStoragePanel(): ReactNode {
  const { settings, updateMediaSettings, resetMediaSettings, isSaving, fetchSettings } =
    useSettingsStore();
  const [cache, setCache] = useState<CacheReport>({ used: 0, quota: 0, hasEstimate: false });
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
    readCacheReport().then(setCache);
  }, [fetchSettings]);

  // Debounce per-group radio changes so rapid clicks coalesce into one PATCH,
  // mirroring the existing notification/privacy panel save cadence.
  const [pending, setPending] = useState<PendingChange | null>(null);
  useEffect(() => {
    if (pending === null) return;
    const handle = window.setTimeout(() => {
      const patch: Partial<MediaSettings> = { [pending.key]: pending.value };
      updateMediaSettings(patch).catch((error: unknown) => {
        logger.error('Failed to save auto-download policy', error);
        toast.error('Failed to save data & storage settings');
      });
      setPending(null);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [pending, updateMediaSettings]);

  function handleAutoDownloadChange(key: AutoDownloadGroup['key'], value: AutoDownloadPolicy): void {
    setPending({ key, value });
  }

  async function handleClearCache(): Promise<void> {
    setShowClearConfirm(false);
    setIsClearing(true);
    try {
      await clearOfflineData();
      const refreshed = await readCacheReport();
      setCache(refreshed);
      toast.success('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear offline cache', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  }

  async function handleResetMedia(): Promise<void> {
    setShowResetConfirm(false);
    try {
      await resetMediaSettings();
      toast.success('Data & storage settings reset');
    } catch (error) {
      logger.error('Failed to reset data & storage settings', error);
      toast.error('Failed to reset settings');
    }
  }

  async function handleDataSaverToggle(): Promise<void> {
    const next = !settings.media.dataSaverMode;
    try {
      await updateMediaSettings({ dataSaverMode: next });
      toast.success(next ? 'Bandwidth-saver enabled' : 'Bandwidth-saver disabled');
    } catch (error) {
      logger.error('Failed to toggle bandwidth-saver', error);
      toast.error('Failed to save data & storage settings');
    }
  }

  const free = cache.hasEstimate ? Math.max(cache.quota - cache.used, 0) : 0;
  const lowQuota = cache.hasEstimate && free > 0 && free < LOW_QUOTA_BYTES;

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-start gap-3">
        <div className="aurora-page-icon p-3">
          <CircleStackIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-primary-300/75 mb-1 text-[11px] font-black uppercase tracking-[0.24em]">
            Caches & Bandwidth
          </p>
          <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Data & Storage
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Control on-device caches and how media downloads on this network.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Cache size */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Cache size</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                {cache.hasEstimate
                  ? `Caches use ~${formatBytes(cache.used)} of ${formatBytes(cache.quota)} available.`
                  : 'Storage estimate is not available in this browser.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--token-status-danger)]/10 px-4 py-2 text-sm font-semibold text-[var(--token-status-danger)] transition-colors hover:bg-[var(--token-status-danger)]/20 disabled:cursor-wait disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4" />
              {isClearing ? 'Clearing…' : 'Clear cache'}
            </button>
          </div>
          {lowQuota && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--token-status-warning)]/40 bg-[var(--token-status-warning)]/10 p-3 text-sm text-[var(--token-status-warning)]">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Your browser is running low on storage.</p>
            </div>
          )}
        </GlassCard>

        {/* Auto-download media */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
              Auto-download media
            </h2>
            <p className="text-sm text-[var(--token-text-secondary)]">
              Choose which networks may download incoming media automatically.
            </p>
          </div>
          <div className="space-y-5">
            {AUTO_DOWNLOAD_GROUPS.map((group) => (
              <AutoDownloadRow
                key={group.key}
                group={group}
                value={settings.media[group.key]}
                disabled={isSaving}
                onChange={(value) => handleAutoDownloadChange(group.key, value)}
              />
            ))}
          </div>
        </GlassCard>

        {/* Network usage / bandwidth-saver */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Bandwidth-saver mode</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Lower image quality and disable autoplay to use less data.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.media.dataSaverMode}
              onClick={handleDataSaverToggle}
              disabled={isSaving}
              data-checked={settings.media.dataSaverMode}
              className={`aurora-social-toggle relative h-6 w-11 rounded-full ${
                isSaving ? 'cursor-wait opacity-50' : ''
              }`}
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>
        </GlassCard>

        {/* Reset */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">
                Reset data & storage settings
              </h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Restore auto-download and bandwidth defaults.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={isSaving}
              className="rounded-xl border border-[var(--token-card-border)] px-4 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition-colors hover:bg-[var(--token-bg-secondary)] disabled:cursor-wait disabled:opacity-60"
            >
              Reset to defaults
            </button>
          </div>
        </GlassCard>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Clear cache?"
          message="Locally cached messages, conversations, and drafts will be removed from this browser. Your account data on the server is unaffected."
          confirmLabel="Clear cache"
          danger
          onConfirm={handleClearCache}
          onClose={() => setShowClearConfirm(false)}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset data & storage?"
          message="Auto-download policies and bandwidth-saver mode will return to their defaults."
          confirmLabel="Reset"
          onConfirm={handleResetMedia}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </motion.div>
  );
}

export default DataStoragePanel;
