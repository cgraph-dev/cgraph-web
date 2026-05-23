import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { useSettingsStore } from '@/modules/settings/store/settingsStore.impl';
import { useThemeStore } from '@/stores/theme/store';

export const PREFERENCE_SYNC_CHANNEL = 'cgraph:preference-sync:v1';

type PreferenceSyncKind = 'settings' | 'customization' | 'theme';

interface PreferenceSyncEnvelope {
  readonly kind: PreferenceSyncKind;
  readonly userId: string;
  readonly sourceId: string;
  readonly payload: Record<string, unknown>;
}

interface SettingsSyncInput {
  readonly userId: string;
  readonly section: string;
  readonly changes: Record<string, unknown>;
  readonly lastUpdatedAt: string;
  readonly broadcast?: boolean;
}

interface PreferencePatchInput {
  readonly userId: string;
  readonly changes: Record<string, unknown>;
  readonly broadcast?: boolean;
}

const localSourceId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

let channel: BroadcastChannel | null = null;
let unsubscribe: (() => void) | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canUseBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

function getCurrentUserId(): string | null {
  const user = useAuthStore.getState().user;
  return typeof user?.id === 'string' ? user.id : null;
}

function shouldApplyLocalUserPatch(userId: string): boolean {
  const currentUserId = getCurrentUserId();
  return currentUserId === null || currentUserId === userId;
}

function shouldApplyBroadcastPatch(envelope: PreferenceSyncEnvelope): boolean {
  const currentUserId = getCurrentUserId();
  return (
    envelope.sourceId !== localSourceId &&
    typeof currentUserId === 'string' &&
    currentUserId === envelope.userId
  );
}

function isPreferenceSyncEnvelope(value: unknown): value is PreferenceSyncEnvelope {
  if (!isRecord(value)) return false;
  const { kind, payload, sourceId, userId } = value;
  return (
    (kind === 'settings' || kind === 'customization' || kind === 'theme') &&
    typeof userId === 'string' &&
    typeof sourceId === 'string' &&
    isRecord(payload)
  );
}

function publishEnvelope(envelope: PreferenceSyncEnvelope): void {
  if (!canUseBroadcastChannel()) return;
  channel ??= new BroadcastChannel(PREFERENCE_SYNC_CHANNEL);
  channel.postMessage(envelope);
}

function applyEnvelope(envelope: PreferenceSyncEnvelope): void {
  if (envelope.kind === 'settings') {
    const section = envelope.payload['section'];
    const changes = envelope.payload['changes'];
    const lastUpdatedAt = envelope.payload['lastUpdatedAt'] ?? envelope.payload['last_updated_at'];

    if (typeof section !== 'string' || !isRecord(changes)) return;

    useSettingsStore
      .getState()
      .mergeSettingsFromSync(
        section,
        changes,
        typeof lastUpdatedAt === 'string' ? lastUpdatedAt : new Date().toISOString()
      );
    return;
  }

  if (envelope.kind === 'customization') {
    useCustomizationStore.getState().applyServerSettings(envelope.payload);
    return;
  }

  useThemeStore.getState().applyServerTheme(envelope.payload);
}

/**
 * Opens the browser-level preference sync channel and applies trusted same-user patches.
 */
export function startPreferenceSyncBus(): () => void {
  if (!canUseBroadcastChannel()) return () => undefined;
  if (unsubscribe) return unsubscribe;

  channel ??= new BroadcastChannel(PREFERENCE_SYNC_CHANNEL);
  const handleMessage = (event: MessageEvent<unknown>) => {
    if (!isPreferenceSyncEnvelope(event.data)) return;
    if (!shouldApplyBroadcastPatch(event.data)) return;
    applyEnvelope(event.data);
  };

  channel.addEventListener('message', handleMessage);

  unsubscribe = () => {
    channel?.removeEventListener('message', handleMessage);
    channel?.close();
    channel = null;
    unsubscribe = null;
  };

  return unsubscribe;
}

/**
 * Applies a server-owned settings patch locally and mirrors it to other open tabs.
 */
export function applySettingsPreferenceSync({
  userId,
  section,
  changes,
  lastUpdatedAt,
  broadcast = true,
}: SettingsSyncInput): void {
  if (!shouldApplyLocalUserPatch(userId)) return;

  useSettingsStore.getState().mergeSettingsFromSync(section, changes, lastUpdatedAt);

  if (broadcast) {
    publishEnvelope({
      kind: 'settings',
      userId,
      sourceId: localSourceId,
      payload: { section, changes, lastUpdatedAt },
    });
  }
}

/**
 * Applies a server-owned customization patch locally and mirrors it to other open tabs.
 */
export function applyCustomizationPreferenceSync({
  userId,
  changes,
  broadcast = true,
}: PreferencePatchInput): void {
  if (!shouldApplyLocalUserPatch(userId)) return;

  useCustomizationStore.getState().applyServerSettings(changes);

  if (broadcast) {
    publishEnvelope({
      kind: 'customization',
      userId,
      sourceId: localSourceId,
      payload: changes,
    });
  }
}

/**
 * Applies a server-owned theme patch locally and mirrors it to other open tabs.
 */
export function applyThemePreferenceSync({
  userId,
  changes,
  broadcast = true,
}: PreferencePatchInput): void {
  if (!shouldApplyLocalUserPatch(userId)) return;

  useThemeStore.getState().applyServerTheme(changes);

  if (broadcast) {
    publishEnvelope({
      kind: 'theme',
      userId,
      sourceId: localSourceId,
      payload: changes,
    });
  }
}
