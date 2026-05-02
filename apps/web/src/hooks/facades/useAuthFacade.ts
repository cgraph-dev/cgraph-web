/**
 * Auth Facade Hook
 *
 * Composition hook that aggregates auth, user profile,
 * and session state into a single domain interface.
 *
 * Replaces direct multi-store access patterns with a stable, memoized API.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, login, logout } = useAuthFacade();
 * ```
 *
 */

import { useAuthStore } from '@/modules/auth/store';
import type { User } from '@/modules/auth/store';

export interface AuthFacade {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Derived
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  isVerified: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

/**
 * Composes auth-related state from authStore into a single facade.
 * All selectors use individual primitives to avoid re-render storms.
 */
export function useAuthFacade(): AuthFacade {
  // Primitive selectors — each subscribes independently (selector pattern)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const storeLogin = useAuthStore((s) => s.login);
  const storeRegister = useAuthStore((s) => s.register);
  const storeLogout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Derived values — cheap to compute, stable references
  const userId = user?.id ?? null;
  const username = user?.username ?? null;
  const displayName = user?.displayName ?? null;
  const avatarUrl = user?.avatarUrl ?? null;
  const isPremium = user?.isPremium ?? false;
  const isAdmin = user?.isAdmin ?? false;
  const isVerified = user?.isVerified ?? false;

  async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await storeLogin(email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  }

  async function register(email: string, username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await storeRegister(email, username, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  }

  async function logout() {
    await storeLogout();
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    userId,
    username,
    displayName,
    avatarUrl,
    isPremium,
    isAdmin,
    isVerified,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };
}
