import { describe, expect, it } from 'vitest';
import { getPostAuthRedirect, isCurrentPostAuthGate } from '../post-auth-redirect';
import type { User } from '@/modules/auth/store/authStore.types';

const baseUser: User = {
  id: 'user-1',
  uid: '1234567890',
  userId: 1,
  userIdDisplay: '#1234567890',
  email: 'user@example.com',
  username: 'user',
  displayName: 'User',
  avatarUrl: null,
  emailVerifiedAt: '2026-01-01T00:00:00Z',
  onboardingCompleted: true,
  twoFactorEnabled: false,
  status: 'online',
  statusMessage: null,
  pulse: 0,
  isVerified: false,
  isPremium: false,
  isAdmin: false,
  canChangeUsername: true,
  usernameNextChangeAt: null,
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('post-auth redirects', () => {
  it('requires email verification before onboarding or messages', () => {
    expect(
      getPostAuthRedirect({
        ...baseUser,
        emailVerifiedAt: null,
        onboardingCompleted: false,
      })
    ).toBe('/verify-email?email=user%40example.com');
  });

  it('requires onboarding after email verification', () => {
    expect(getPostAuthRedirect({ ...baseUser, onboardingCompleted: false })).toBe('/onboarding');
  });

  it('falls through to the requested app route when gates are satisfied', () => {
    expect(getPostAuthRedirect(baseUser, '/social/friends')).toBe('/social/friends');
  });

  it('does not require email verification for phone-only accounts', () => {
    expect(
      getPostAuthRedirect({
        ...baseUser,
        email: '',
        emailVerifiedAt: null,
      })
    ).toBe('/messages');
  });

  it('recognizes current gate paths without comparing query strings', () => {
    expect(isCurrentPostAuthGate('/verify-email', '/verify-email?email=user%40example.com')).toBe(
      true
    );
    expect(isCurrentPostAuthGate('/onboarding', '/onboarding')).toBe(true);
    expect(isCurrentPostAuthGate('/messages', '/onboarding')).toBe(false);
  });
});
