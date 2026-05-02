/**
 * PaidDmSettingsPage
 *
 * Owner-side settings for the Paid DM feature. Lets a creator opt in,
 * set a per-DM Node price (1-10000), pick which file types they accept,
 * auto-accept messages from friends, and configure the auto-refund window
 * for messages that go unread.
 *
 * Backend contract:
 *   GET  /api/v1/paid-dm/settings -> { data: PaidDmSettings }
 *   PUT  /api/v1/paid-dm/settings -> body PaidDmSettings, returns updated row
 *   GET  /api/v1/paid-dm/stats    -> { data: { unlocks_last_7d } }  (optional)
 *
 * Optimistic update: PUT is fire-and-confirm. We restore on failure.
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PaidDmSettings');

const MIN_PRICE = 1;
const MAX_PRICE = 10000;
const MIN_AUTO_REFUND_HOURS = 1;
const MAX_AUTO_REFUND_HOURS = 168;
const DEFAULT_AUTO_REFUND_HOURS = 72;
const FILE_TYPES = ['image', 'video', 'audio', 'document'] as const;

type FileType = (typeof FILE_TYPES)[number];

interface PaidDmSettings {
  readonly enabled: boolean;
  readonly priceNodes: number;
  readonly acceptedFileTypes: readonly FileType[];
  readonly autoAcceptFriends: boolean;
  readonly autoRefundAfterHours: number;
}

interface WeeklyStats {
  readonly unlocksLast7d: number;
}

const DEFAULT_SETTINGS: PaidDmSettings = {
  enabled: false,
  priceNodes: MIN_PRICE,
  acceptedFileTypes: [],
  autoAcceptFriends: false,
  autoRefundAfterHours: DEFAULT_AUTO_REFUND_HOURS,
};

function isFileType(value: unknown): value is FileType {
  if (typeof value !== 'string') return false;
  for (const type of FILE_TYPES) {
    if (type === value) return true;
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPaidDmSettings(value: unknown): value is PaidDmSettings {
  if (!isRecord(value)) return false;
  if (
    typeof value.enabled !== 'boolean' ||
    typeof value.priceNodes !== 'number' ||
    !Array.isArray(value.acceptedFileTypes) ||
    !value.acceptedFileTypes.every(isFileType) ||
    typeof value.autoAcceptFriends !== 'boolean'
  ) {
    return false;
  }
  // autoRefundAfterHours is optional in payload; default applied later
  return value.autoRefundAfterHours === undefined || typeof value.autoRefundAfterHours === 'number';
}

function clampPrice(raw: number): number {
  if (!Number.isFinite(raw)) return MIN_PRICE;
  const rounded = Math.round(raw);
  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, rounded));
}

function clampRefundHours(raw: number): number {
  if (!Number.isFinite(raw)) return DEFAULT_AUTO_REFUND_HOURS;
  const rounded = Math.round(raw);
  return Math.min(MAX_AUTO_REFUND_HOURS, Math.max(MIN_AUTO_REFUND_HOURS, rounded));
}

/** Pulls `data.data` out of axios-shaped responses without leaning on type assertions. */
function unwrapEnvelope(response: unknown): unknown {
  if (!isRecord(response)) return undefined;
  const outer = response.data;
  if (!isRecord(outer)) return undefined;
  return outer.data;
}

async function loadSettings(): Promise<PaidDmSettings> {
  const response = await api.get('/api/v1/paid-dm/settings');
  const payload = unwrapEnvelope(response);
  if (isPaidDmSettings(payload)) {
    return {
      ...payload,
      autoRefundAfterHours: payload.autoRefundAfterHours ?? DEFAULT_AUTO_REFUND_HOURS,
    };
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(next: PaidDmSettings): Promise<void> {
  await api.put('/api/v1/paid-dm/settings', next);
}

async function loadStats(): Promise<WeeklyStats | null> {
  try {
    const response = await api.get('/api/v1/paid-dm/stats');
    const payload = unwrapEnvelope(response);
    if (isRecord(payload)) {
      const unlocks = typeof payload.unlocks_last_7d === 'number' ? payload.unlocks_last_7d : 0;
      return { unlocksLast7d: unlocks };
    }
    return null;
  } catch (error) {
    logger.debug('Stats endpoint unavailable', error);
    return null;
  }
}

interface FileTypeRowProps {
  readonly type: FileType;
  readonly checked: boolean;
  readonly onToggle: (type: FileType) => void;
}

function FileTypeRow({ type, checked, onToggle }: FileTypeRowProps) {
  return (
    <label className="flex items-center gap-2 text-sm capitalize">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(type)}
        className="h-4 w-4 accent-[var(--token-primary)]"
      />
      <span>{type}</span>
    </label>
  );
}

interface SaveStatusBannerProps {
  readonly status: 'idle' | 'saving' | 'success' | 'error';
}

function SaveStatusBanner({ status }: SaveStatusBannerProps) {
  if (status === 'success') {
    return <p className="text-sm text-emerald-400">Settings saved!</p>;
  }
  if (status === 'error') {
    return <p className="text-sm text-red-400">Failed to save settings.</p>;
  }
  return null;
}

/** Owner-side settings page for the Paid DM feature. */
function PaidDmSettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<PaidDmSettings | null>(null);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    let active = true;
    loadSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((error) => {
        logger.warn('Falling back to defaults', error);
        if (active) setSettings(DEFAULT_SETTINGS);
      });
    loadStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  if (settings === null) {
    return (
      <div
        role="status"
        aria-label="Loading paid DM settings"
        className="flex h-32 items-center justify-center"
      >
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--token-primary)] border-t-transparent" />
      </div>
    );
  }

  function setEnabled(enabled: boolean): void {
    setSettings((prev) => (prev === null ? prev : { ...prev, enabled }));
  }

  function setPrice(raw: number): void {
    setSettings((prev) => (prev === null ? prev : { ...prev, priceNodes: clampPrice(raw) }));
  }

  function toggleFileType(type: FileType): void {
    setSettings((prev) => {
      if (prev === null) return prev;
      const next = prev.acceptedFileTypes.includes(type)
        ? prev.acceptedFileTypes.filter((t) => t !== type)
        : [...prev.acceptedFileTypes, type];
      return { ...prev, acceptedFileTypes: next };
    });
  }

  function setAutoAccept(autoAcceptFriends: boolean): void {
    setSettings((prev) => (prev === null ? prev : { ...prev, autoAcceptFriends }));
  }

  function setAutoRefundHours(raw: number): void {
    setSettings((prev) =>
      prev === null ? prev : { ...prev, autoRefundAfterHours: clampRefundHours(raw) }
    );
  }

  async function handleSave(): Promise<void> {
    if (settings === null) return;
    const previous = settings;
    setSaveStatus('saving');
    try {
      await saveSettings(previous);
      setSaveStatus('success');
    } catch (error) {
      logger.error('Save failed', error);
      setSaveStatus('error');
    }
  }

  const estimatedWeekly = stats === null ? null : stats.unlocksLast7d * settings.priceNodes;

  return (
    <div className="paid-dm-settings mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-white">Paid DM Settings</h2>
        <p className="text-sm text-[var(--token-text-secondary)]">
          Charge senders Nodes to deliver a DM. You keep 80%; CGraph keeps 20%.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] p-4">
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white">Enable Paid DMs</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-[var(--token-primary)]"
          />
        </label>

        <div className="flex flex-col gap-2">
          <label htmlFor="paid-dm-price" className="text-sm font-medium text-white">
            Price per DM (Nodes)
          </label>
          <input
            id="paid-dm-price"
            type="number"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={1}
            value={settings.priceNodes}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-32 rounded-md border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white focus:border-[var(--token-primary)] focus:outline-none"
          />
          <p className="text-xs text-[var(--token-text-secondary)]">
            Allowed range: {MIN_PRICE}-{MAX_PRICE} Nodes. You receive 80% per unlock.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="paid-dm-auto-refund" className="text-sm font-medium text-white">
            Auto-refund window (hours)
          </label>
          <input
            id="paid-dm-auto-refund"
            type="number"
            min={MIN_AUTO_REFUND_HOURS}
            max={MAX_AUTO_REFUND_HOURS}
            step={1}
            value={settings.autoRefundAfterHours}
            onChange={(e) => setAutoRefundHours(Number(e.target.value))}
            className="w-32 rounded-md border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white focus:border-[var(--token-primary)] focus:outline-none"
          />
          <p className="text-xs text-[var(--token-text-secondary)]">
            Refund senders if you don't read their paid DM within this window. Range:{' '}
            {MIN_AUTO_REFUND_HOURS}-{MAX_AUTO_REFUND_HOURS} hours.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-white">Accepted File Types</legend>
          <div className="grid grid-cols-2 gap-2">
            {FILE_TYPES.map((type) => (
              <FileTypeRow
                key={type}
                type={type}
                checked={settings.acceptedFileTypes.includes(type)}
                onToggle={toggleFileType}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white">Auto-accept Friends</span>
          <input
            type="checkbox"
            checked={settings.autoAcceptFriends}
            onChange={(e) => setAutoAccept(e.target.checked)}
            className="h-5 w-5 accent-[var(--token-primary)]"
          />
        </label>
      </section>

      {estimatedWeekly !== null && (
        <section className="rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] p-4">
          <h3 className="text-sm font-medium text-white">Estimated Weekly Earnings</h3>
          <p className="mt-1 text-2xl font-semibold text-[var(--token-primary)]">
            {estimatedWeekly} Nodes
          </p>
          <p className="text-xs text-[var(--token-text-secondary)]">
            Based on {stats?.unlocksLast7d ?? 0} unlocks in the last 7 days at {settings.priceNodes}{' '}
            Nodes each.
          </p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saveStatus === 'saving'}
          className="rounded-md bg-[var(--token-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Save Settings'}
        </button>
        <SaveStatusBanner status={saveStatus} />
      </div>
    </div>
  );
}

export default PaidDmSettingsPage;
export { PaidDmSettingsPage };
export type { PaidDmSettings, WeeklyStats, FileType };
