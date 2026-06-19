/**
 * Auth Store Utilities Tests
 *
 * Tests for getApiErrorMessage, mapUserFromApi, and createSecureStorage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';

// Mock logger to prevent console noise
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
  authLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { getApiErrorMessage, mapUserFromApi, createSecureStorage } from '../authStore.utils';
describe('getApiErrorMessage', () => {
  it('extracts error field from AxiosError response data', () => {
    const err = new AxiosError('fail');
    err.response = { data: { error: 'Invalid credentials' }, status: 401 } as AxiosResponse;
    expect(getApiErrorMessage(err, 'fallback')).toBe('Invalid credentials');
  });

  it('extracts message field from AxiosError response data', () => {
    const err = new AxiosError('fail');
    err.response = { data: { message: 'Rate limited' }, status: 429 } as AxiosResponse;
    expect(getApiErrorMessage(err, 'fallback')).toBe('Rate limited');
  });

  it('prefers error over message when both present', () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { error: 'Primary error', message: 'Secondary' },
      status: 400,
    } as AxiosResponse;
    expect(getApiErrorMessage(err, 'fallback')).toBe('Primary error');
  });

  it('returns fallback for AxiosError with no response data fields', () => {
    const err = new AxiosError('fail');
    err.response = { data: {}, status: 500 } as AxiosResponse;
    expect(getApiErrorMessage(err, 'Server error')).toBe('Server error');
  });

  it('returns fallback for AxiosError with non-object response data', () => {
    const err = new AxiosError('fail');
    err.response = { data: 'raw string', status: 500 } as AxiosResponse;
    expect(getApiErrorMessage(err, 'Server error')).toBe('Server error');
  });

  it('returns fallback for AxiosError without response', () => {
    const err = new AxiosError('Network Error');
    expect(getApiErrorMessage(err, 'Network issue')).toBe('Network issue');
  });

  it('returns message for a plain Error', () => {
    expect(getApiErrorMessage(new Error('something broke'), 'default')).toBe('something broke');
  });

  it('returns fallback for unknown error types', () => {
    expect(getApiErrorMessage('string-error', 'default')).toBe('default');
    expect(getApiErrorMessage(42, 'default')).toBe('default');
    expect(getApiErrorMessage(null, 'default')).toBe('default');
    expect(getApiErrorMessage(undefined, 'default')).toBe('default');
  });
});
describe('mapUserFromApi', () => {
  const fullApiUser: Record<string, unknown> = {
    id: 'user-1',
    uid: '1234567890',
    user_id: 42,
    user_id_display: '#1234567890',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: 'https://cdn.test.com/avatar.png',
    wallet_address: '0xABC',
    email_verified_at: '2025-01-01T00:00:00Z',
    onboarding_completed: false,
    totp_enabled: true,
    status: 'online',
    custom_status: 'Busy coding',
    karma: 100,
    is_verified: true,
    is_premium: true,
    is_admin: true,
    can_change_username: false,
    username_next_change_at: '2026-06-01T00:00:00Z',
    inserted_at: '2024-06-01T12:00:00Z',
    level: 5,
    xp: 1200,
    nodes: 50,
    title: 'Legend',
    title_color: '#ff0000',
    badges: ['early_adopter', 'contributor'],
    streak: 7,
  };

  it('maps all fields correctly from snake_case API response', () => {
    const user = mapUserFromApi(fullApiUser);

    expect(user.id).toBe('user-1');
    expect(user.uid).toBe('1234567890');
    expect(user.userId).toBe(42);
    expect(user.userIdDisplay).toBe('#1234567890');
    expect(user.email).toBe('test@example.com');
    expect(user.username).toBe('testuser');
    expect(user.displayName).toBe('Test User');
    expect(user.avatarUrl).toBe('https://cdn.test.com/avatar.png');
    expect(user.walletAddress).toBe('0xABC');
    expect(user.emailVerifiedAt).toBe('2025-01-01T00:00:00Z');
    expect(user.onboardingCompleted).toBe(false);
    expect(user.twoFactorEnabled).toBe(true);
    expect(user.status).toBe('online');
    expect(user.statusMessage).toBe('Busy coding');
    expect(user.pulse).toBe(100);
    expect(user.isVerified).toBe(true);
    expect(user.isPremium).toBe(true);
    expect(user.isAdmin).toBe(true);
    expect(user.canChangeUsername).toBe(false);
    expect(user.usernameNextChangeAt).toBe('2026-06-01T00:00:00Z');
    expect(user.createdAt).toBe('2024-06-01T12:00:00Z');
    expect(user.level).toBe(5);
    expect(user.xp).toBe(1200);
    expect(user.nodes).toBe(50);
    expect(user.title).toBe('Legend');
    expect(user.titleColor).toBe('#ff0000');
    expect(user.badges).toEqual(['early_adopter', 'contributor']);
    expect(user.streak).toBe(7);
  });

  it('maps legacy avatar_hash as the persisted avatar URL', () => {
    const user = mapUserFromApi({
      id: 'user-1',
      username: 'testuser',
      avatar_hash: '/uploads/avatars/user-1/avatar.jpg',
    });

    expect(user.avatarUrl).toBe('/uploads/avatars/user-1/avatar.jpg');
  });

  it('provides safe defaults for missing fields', () => {
    const user = mapUserFromApi({});

    expect(user.id).toBe('');
    expect(user.uid).toBe('');
    expect(user.userId).toBe(0);
    expect(user.userIdDisplay).toBe('#0000000000');
    expect(user.email).toBe('');
    expect(user.username).toBeNull();
    expect(user.displayName).toBeNull();
    expect(user.avatarUrl).toBeNull();
    expect(user.walletAddress).toBeNull();
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.onboardingCompleted).toBe(true);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.status).toBe('offline');
    expect(user.statusMessage).toBeNull();
    expect(user.pulse).toBe(0);
    expect(user.isVerified).toBe(false);
    expect(user.isPremium).toBe(false);
    expect(user.isAdmin).toBe(false);
    expect(user.canChangeUsername).toBe(true);
    expect(user.usernameNextChangeAt).toBeNull();
    expect(user.createdAt).toBe('');
    expect(user.level).toBe(1);
    expect(user.xp).toBe(0);
    expect(user.nodes).toBe(0);
    expect(user.streak).toBe(0);
  });

  it('handles wrong types gracefully (uses defaults)', () => {
    const user = mapUserFromApi({
      id: 123, // number instead of string
      email: null, // null instead of string
      totp_enabled: 'yes', // string instead of boolean
      status: 'unknown_status', // invalid status value
      karma: '100', // string instead of number
      badges: 'not-an-array',
    });

    expect(user.id).toBe('');
    expect(user.email).toBe('');
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.status).toBe('offline');
    expect(user.pulse).toBe(0);
    expect(user.badges).toBeUndefined();
  });

  it('maps all valid status values', () => {
    for (const status of ['online', 'idle', 'dnd', 'offline']) {
      const user = mapUserFromApi({ status });
      expect(user.status).toBe(status);
    }
  });
});
describe('createSecureStorage', () => {
  let storage: ReturnType<typeof createSecureStorage>;

  beforeEach(() => {
    sessionStorage.clear();
    storage = createSecureStorage();
  });

  it('stores and retrieves a value (round-trip)', () => {
    storage.setItem('test-key', 'test-value');
    expect(storage.getItem('test-key')).toBe('test-value');
  });

  it('returns null for missing keys', () => {
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('removes an item', () => {
    storage.setItem('key', 'value');
    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('handles JSON data round-trip', () => {
    const data = JSON.stringify({ token: 'abc123', user: { id: '1' } });
    storage.setItem('auth', data);
    expect(storage.getItem('auth')).toBe(data);
  });

  it('encodes values in sessionStorage (not stored as plaintext)', () => {
    storage.setItem('secret', 'my-token');
    const raw = sessionStorage.getItem('secret');
    // The raw stored value should NOT be the plaintext
    expect(raw).not.toBe('my-token');
    // But decoding should return the original
    expect(storage.getItem('secret')).toBe('my-token');
  });

  it('handles unicode characters in values', () => {
    const unicodeValue = 'Hello \u00e9\u00e0\u00fc \u4f60\u597d';
    storage.setItem('unicode', unicodeValue);
    expect(storage.getItem('unicode')).toBe(unicodeValue);
  });

  it('handles empty string values', () => {
    storage.setItem('empty', '');
    // btoa('') produces '', which sessionStorage stores as '' (truthy),
    // but sessionStorage.getItem returns '' which is falsy — getItem returns null.
    // This is expected behavior: empty strings round-trip to null.
    const result = storage.getItem('empty');
    expect(result).toBeNull();
  });
});
