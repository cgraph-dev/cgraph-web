import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROFILE_CHECKPOINT_STORAGE_KEY,
  clearProfileCheckpoint,
  readProfileCheckpoint,
  writeProfileCheckpoint,
} from '../profile-checkpoint';

describe('profile checkpoint', () => {
  beforeEach(() => sessionStorage.clear());

  it('round-trips only the versioned user-bound display-name draft', () => {
    writeProfileCheckpoint('user-1', '  Tricky  ');

    expect(readProfileCheckpoint('user-1', 'Fallback')).toBe('  Tricky  ');
    expect(JSON.parse(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      userId: 'user-1',
      displayName: '  Tricky  ',
    });
  });

  it('discards malformed state instead of blocking the route', () => {
    sessionStorage.setItem(PROFILE_CHECKPOINT_STORAGE_KEY, '{not-json');

    expect(readProfileCheckpoint('user-1', 'Fallback')).toBe('Fallback');
    expect(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY)).toBeNull();
  });

  it('discards another user checkpoint', () => {
    writeProfileCheckpoint('user-1', 'First user');

    expect(readProfileCheckpoint('user-2', 'Second user')).toBe('Second user');
    expect(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY)).toBeNull();
  });

  it('tolerates unknown fields and clears the checkpoint explicitly', () => {
    sessionStorage.setItem(
      PROFILE_CHECKPOINT_STORAGE_KEY,
      JSON.stringify({ version: 1, userId: 'user-1', displayName: 'Tricky', future: true })
    );

    expect(readProfileCheckpoint('user-1', '')).toBe('Tricky');
    clearProfileCheckpoint();
    expect(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY)).toBeNull();
  });
});
