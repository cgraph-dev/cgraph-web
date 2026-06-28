import { describe, expect, it } from 'vitest';

import {
  isCanonicalUsername,
  profileApiPathForHandle,
  publicProfilePath,
} from '@/lib/profile-route';

describe('publicProfilePath', () => {
  it('prefers a canonical username over the user ID', () => {
    expect(publicProfilePath({ id: 'user-id', username: 'tricker' })).toBe('/tricker');
  });

  it('falls back to the legacy ID route for reserved usernames', () => {
    expect(publicProfilePath({ id: 'user-id', username: 'settings' })).toBe('/user/user-id');
  });

  it('falls back to the current-user profile when no identity is available', () => {
    expect(publicProfilePath(null)).toBe('/me/profile');
  });
});

describe('profile route classification', () => {
  it('accepts public handles without colliding with top-level app routes', () => {
    expect(isCanonicalUsername('tricker')).toBe(true);
    expect(isCanonicalUsername('forums')).toBe(false);
  });

  it('uses the ID endpoint only for UUID handles in automatic mode', () => {
    const id = '0c50b960-1cdb-4653-96bf-85d65902ce9a';

    expect(profileApiPathForHandle(id, 'auto')).toBe(`/api/v1/users/${id}`);
    expect(profileApiPathForHandle('tricker', 'auto')).toBe(
      '/api/v1/users/tricker/profile'
    );
  });
});
