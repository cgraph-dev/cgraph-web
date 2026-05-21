/**
 * Auth Initializer Provider
 *
 * Non-blocking app bootstrapper that checks authentication,
 * fetches gamification data, applies theme CSS variables,
 * and coordinates user preference bootstrap.
 *
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import type { User } from '@/modules/auth/store';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { bootstrapUserPreferences } from '@/modules/settings/store/preferenceOrchestrator';
import { themeEngine } from '@/lib/theme/theme-engine';
import { STORAGE_KEY as THEME_PREFERENCES_KEY } from '@/lib/theme/preferences';
import { useCustomizationApplication } from '@/modules/settings/hooks/useCustomizationApplication';
import { authLogger, themeLogger } from '@/lib/logger';

const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';
const E2E_ONBOARDING_COMPLETED_KEY = 'cgraph-e2e-onboarding-completed';
const PUBLIC_AUTH_ROUTE_PATTERN =
  /^\/(login|register|forgot-password|reset-password|verify-email)(\/|$)/;

const E2E_USER: User = {
  id: 'e2e-user',
  uid: '1000000000',
  userId: 1,
  userIdDisplay: '#1000000000',
  email: 'e2e@cgraph.local',
  username: 'e2e-user',
  displayName: 'E2E User',
  avatarUrl: null,
  walletAddress: null,
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
  onboardingCompleted: true,
  twoFactorEnabled: false,
  status: 'online',
  statusMessage: null,
  pulse: 0,
  isVerified: true,
  isPremium: false,
  isAdmin: true,
  canChangeUsername: true,
  usernameNextChangeAt: null,
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  subscription: {
    tier: 'free',
    status: 'active',
  },
};

function getE2EUser(): User {
  if (typeof sessionStorage === 'undefined') return E2E_USER;

  const onboardingCompleted = sessionStorage.getItem(E2E_ONBOARDING_COMPLETED_KEY);
  if (onboardingCompleted === 'false') {
    return {
      ...E2E_USER,
      onboardingCompleted: false,
    };
  }

  return E2E_USER;
}

/**
 * Initializes authentication, gamification, preferences, and theme state.
 * Renders children immediately — never blocks rendering.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const colorPreset = useThemeStore((state) => state.theme.colorPreset);

  // Apply customization settings to UI
  useCustomizationApplication();

  // Auth check — runs once on mount only
  useEffect(() => {
    if (isE2EAuthBypass) {
      if (!PUBLIC_AUTH_ROUTE_PATTERN.test(pathname)) {
        useAuthStore.setState({
          user: getE2EUser(),
          token: 'e2e-access-token',
          refreshToken: 'e2e-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
      return;
    }

    authLogger.debug('Starting auth check on mount');
    checkAuth()
      .catch((error) => {
        authLogger.error(error, 'Auth check failed');
      })
      .finally(() => {
        authLogger.debug('Auth check complete');
      });
  }, [checkAuth, pathname]);

  useEffect(() => {
    if (isE2EAuthBypass) {
      return;
    }

    if (isAuthenticated) {
      bootstrapUserPreferences({ userId, includeTheme: Boolean(userId) }).catch((error) => {
        authLogger.error('Preference initialization failed:', error);
      });
    }
  }, [isAuthenticated, userId]);
  useEffect(() => {
    const hasProfessionalThemePreferences = Boolean(localStorage.getItem(THEME_PREFERENCES_KEY));
    const appThemeId = hasProfessionalThemePreferences
      ? themeEngine.getCurrentTheme().id
      : 'aurora';
    themeEngine.setTheme(appThemeId);

    const colors = THEME_COLORS[colorPreset];
    if (colors) {
      const root = document.documentElement;
      root.style.setProperty('--user-theme-primary', colors.primary);
      root.style.setProperty('--user-theme-secondary', colors.secondary);
      root.style.setProperty('--user-theme-glow', colors.glow);
      root.style.setProperty('--user-theme-gradient', colors.gradient);
      themeLogger.debug('Applied user customizations:', colorPreset, colors);
    }
    themeLogger.debug('Applied app theme:', appThemeId);
  }, [colorPreset]);

  return <>{children}</>;
}
