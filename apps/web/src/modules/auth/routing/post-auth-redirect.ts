import type { User } from '@/modules/auth/store/authStore.types';

const DEFAULT_APP_ROUTE = '/messages';
const ONBOARDING_ROUTE = '/onboarding';
const VERIFY_EMAIL_ROUTE = '/verify-email';

function hasEmailAddress(user: User | null): user is User & { email: string } {
  return typeof user?.email === 'string' && user.email.trim().length > 0;
}

/**
 * Returns true when an authenticated web user must verify email before app access.
 */
export function requiresEmailVerification(user: User | null): boolean {
  return hasEmailAddress(user) && !user.emailVerifiedAt;
}

/**
 * Returns true when an authenticated web user still needs the onboarding route.
 */
export function requiresOnboarding(user: User | null): boolean {
  return user?.onboardingCompleted === false;
}

/**
 * Resolves the first post-auth route the user must visit before normal app navigation.
 */
export function getPostAuthRedirect(
  user: User | null,
  fallback: string = DEFAULT_APP_ROUTE
): string {
  if (requiresEmailVerification(user)) {
    const email = user?.email.trim() ?? '';
    return `${VERIFY_EMAIL_ROUTE}?email=${encodeURIComponent(email)}`;
  }

  if (requiresOnboarding(user)) {
    return ONBOARDING_ROUTE;
  }

  return fallback || DEFAULT_APP_ROUTE;
}

/**
 * Checks whether the current pathname already satisfies a required post-auth gate.
 */
export function isCurrentPostAuthGate(pathname: string, redirectTo: string): boolean {
  if (redirectTo.startsWith(VERIFY_EMAIL_ROUTE)) {
    return pathname === VERIFY_EMAIL_ROUTE;
  }

  return pathname === redirectTo;
}
