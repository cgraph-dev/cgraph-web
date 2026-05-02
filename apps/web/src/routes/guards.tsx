/**
 * Route Guards
 *
 * Authentication and authorization wrappers for React Router routes.
 * Each guard checks auth state and redirects accordingly.
 *
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { routeLogger } from '@/lib/logger';

/**
 * Requires authentication — redirects to /login if unauthenticated.
 * Never blocks: if already authenticated, renders instantly.
 * If not authenticated, redirects immediately (checkAuth will
 * re-authenticate in the background if a valid token exists).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  routeLogger.debug('ProtectedRoute state:', { isAuthenticated, isLoading });

  // During rehydration, show nothing (or a global spinner) rather than redirecting
  if (isLoading) {
    return null; // Or return <LoadingOverlay />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Public-only route — redirects authenticated users to /messages.
 * Never blocks: renders children immediately for unauthenticated users.
 * If the user is authenticated (e.g. after hydration), redirects to /messages.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  routeLogger.debug('PublicRoute isAuthenticated:', isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }
  return <>{children}</>;
}

/**
 * Requires admin role — redirects non-admins to /messages.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.isAdmin) {
    return <Navigate to="/messages" replace />;
  }
  return <>{children}</>;
}

/**
 * Redirects to the authenticated user's public profile page.
 * Shows nothing while the user object is loading.
 */
export function ProfileRedirectRoute() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.id) {
    return <Navigate to={`/user/${user.id}`} replace />;
  }
  // Render nothing while waiting for user data — avoids visible spinner
  return null;
}
