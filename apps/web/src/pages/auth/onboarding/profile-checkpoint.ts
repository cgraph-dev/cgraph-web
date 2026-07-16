import { safeSessionStorage } from '@/lib/safeStorage';

export const PROFILE_CHECKPOINT_STORAGE_KEY = 'cgraph-onboarding-profile-v1';
const PROFILE_CHECKPOINT_VERSION = 1;

interface ProfileCheckpoint {
  readonly version: typeof PROFILE_CHECKPOINT_VERSION;
  readonly userId: string;
  readonly displayName: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProfileCheckpoint(value: unknown): value is ProfileCheckpoint {
  if (!isRecord(value)) return false;

  return (
    value.version === PROFILE_CHECKPOINT_VERSION &&
    typeof value.userId === 'string' &&
    value.userId.length > 0 &&
    typeof value.displayName === 'string' &&
    value.displayName.length <= 100
  );
}

export function readProfileCheckpoint(userId: string, fallback: string): string {
  const raw = safeSessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY);
  if (typeof raw !== 'string') return fallback;

  try {
    const checkpoint: unknown = JSON.parse(raw);
    if (isProfileCheckpoint(checkpoint) && checkpoint.userId === userId) {
      return checkpoint.displayName;
    }
  } catch {
    // Invalid same-tab state is discarded below.
  }

  safeSessionStorage.removeItem(PROFILE_CHECKPOINT_STORAGE_KEY);
  return fallback;
}

export function writeProfileCheckpoint(userId: string, displayName: string): void {
  const checkpoint: ProfileCheckpoint = {
    version: PROFILE_CHECKPOINT_VERSION,
    userId,
    displayName,
  };
  safeSessionStorage.setItem(PROFILE_CHECKPOINT_STORAGE_KEY, JSON.stringify(checkpoint));
}

export function clearProfileCheckpoint(): void {
  safeSessionStorage.removeItem(PROFILE_CHECKPOINT_STORAGE_KEY);
}
