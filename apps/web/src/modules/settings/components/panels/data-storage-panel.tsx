/**
 * Data & Storage settings panel.
 *
 * Lets the user inspect and clear CGraph's browser cache and choose the
 * incoming media categories that can begin loading automatically.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CircleStackIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GlassCard,
  toast,
} from '@/shared/components/ui';
import { useSettingsStore } from '@/modules/settings/store';
import {
  DEFAULT_MEDIA_SETTINGS,
  type AutoDownloadPolicy,
  type MediaSettings,
} from '@/modules/settings/store';
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
  readonly key: 'autoDownloadPhotos' | 'autoDownloadVideos';
  readonly label: string;
  readonly description: string;
}

const AUTO_DOWNLOAD_GROUPS: readonly AutoDownloadGroup[] = [
  {
    key: 'autoDownloadPhotos',
    label: 'Photos',
    description: 'Load incoming photo attachments automatically',
  },
  {
    key: 'autoDownloadVideos',
    label: 'Videos',
    description: 'Load incoming video controls automatically',
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent ariaLabel={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" animated={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger === true ? 'danger' : 'primary'}
            animated={false}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        className="cgraph-segmented flex flex-wrap"
      >
        {AUTO_DOWNLOAD_OPTIONS.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              data-selected={checked}
              className={`cgraph-segmented-item flex cursor-pointer items-center px-4 text-sm font-medium ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
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

type PendingChanges = Partial<Pick<MediaSettings, AutoDownloadGroup['key']>>;

const SAVE_DEBOUNCE_MS = 500;

/**
 * Data & Storage settings panel.
 */
export function DataStoragePanel(): ReactNode {
  const { settings, updateMediaSettings, isSaving, fetchSettings } = useSettingsStore();
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
  const [pending, setPending] = useState<PendingChanges>({});
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    const handle = window.setTimeout(() => {
      updateMediaSettings(pending).catch((error: unknown) => {
        logger.error('Failed to save auto-download policy', error);
        toast.error('Failed to save data & storage settings');
      });
      setPending({});
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [pending, updateMediaSettings]);

  function handleAutoDownloadChange(key: AutoDownloadGroup['key'], value: AutoDownloadPolicy): void {
    setPending((current) => ({ ...current, [key]: value }));
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
      await updateMediaSettings({
        autoDownloadPhotos: DEFAULT_MEDIA_SETTINGS.autoDownloadPhotos,
        autoDownloadVideos: DEFAULT_MEDIA_SETTINGS.autoDownloadVideos,
      });
      toast.success('Data & storage settings reset');
    } catch (error) {
      logger.error('Failed to reset data & storage settings', error);
      toast.error('Failed to reset settings');
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
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">
            Data & Storage
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Control on-device caches and how incoming media loads.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Cache size */}
        <GlassCard variant="default" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Cache size</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                {cache.hasEstimate
                  ? `Caches use ~${formatBytes(cache.used)} of ${formatBytes(cache.quota)} available.`
                  : 'Storage estimate is not available in this browser.'}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              animated={false}
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearing}
            >
              <TrashIcon className="h-4 w-4" />
              {isClearing ? 'Clearing…' : 'Clear cache'}
            </Button>
          </div>
          {lowQuota && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--token-status-warning)]/40 bg-[var(--token-status-warning)]/10 p-3 text-sm text-[var(--token-status-warning)]">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Your browser is running low on storage.</p>
            </div>
          )}
        </GlassCard>

        {/* Auto-download media */}
        <GlassCard variant="default" className="p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
              Auto-download media
            </h2>
            <p className="text-sm text-[var(--token-text-secondary)]">
              Choose when CGraph may start loading incoming photos and videos. Manual loading is
              always available.
            </p>
          </div>
          <div className="space-y-5">
            {AUTO_DOWNLOAD_GROUPS.map((group) => (
              <AutoDownloadRow
                key={group.key}
                group={group}
                value={pending[group.key] ?? settings.media[group.key]}
                disabled={isSaving}
                onChange={(value) => handleAutoDownloadChange(group.key, value)}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--token-text-secondary)]">
            Wi-Fi only asks before loading when this browser cannot identify the active network.
          </p>
        </GlassCard>

        {/* Reset */}
        <GlassCard variant="default" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">
                Reset data & storage settings
              </h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Restore photo and video loading defaults.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              animated={false}
              onClick={() => setShowResetConfirm(true)}
              disabled={isSaving}
            >
              Reset to defaults
            </Button>
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
          message="Photo and video loading policies will return to their defaults."
          confirmLabel="Reset"
          onConfirm={handleResetMedia}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </motion.div>
  );
}

export default DataStoragePanel;
