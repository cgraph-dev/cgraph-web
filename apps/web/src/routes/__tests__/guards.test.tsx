import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
const { authState } = vi.hoisted(() => {
  const authState = {
    isAuthenticated: false,
    user: null as {
      id: string;
      username?: string | null;
      email?: string;
      emailVerifiedAt?: string | null;
      onboardingCompleted?: boolean;
      isAdmin?: boolean;
    } | null,
  };
  return { authState };
});
vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => authState),
}));

vi.mock('react-router-dom', async () => {
  const actual: Record<string, unknown> = { React: null };
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

vi.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

import { ProtectedRoute, PublicRoute, AdminRoute, ProfileRedirectRoute } from '../guards';
beforeEach(() => {
  authState.isAuthenticated = false;
  authState.user = null;
  window.history.replaceState({}, '', '/');
});

describe('Route Guards', () => {
  describe('ProtectedRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected</div>
        </ProtectedRoute>
      );
      const nav = screen.getByTestId('navigate');
      expect(nav).toHaveAttribute('data-to', '/login');
    });

    it('renders children when authenticated', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', email: 'user@example.com', emailVerifiedAt: 'verified' };
      render(
        <ProtectedRoute>
          <div data-testid="content">Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByTestId('content')).toHaveTextContent('Protected Content');
    });

    it('redirects authenticated users to verify-email before app routes', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', email: 'new@example.com', emailVerifiedAt: null };

      render(
        <ProtectedRoute>
          <div>Protected</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveAttribute(
        'data-to',
        '/verify-email?email=new%40example.com'
      );
    });

    it('redirects authenticated users to onboarding after email verification', () => {
      authState.isAuthenticated = true;
      authState.user = {
        id: 'u1',
        email: 'new@example.com',
        emailVerifiedAt: 'verified',
        onboardingCompleted: false,
      };

      render(
        <ProtectedRoute>
          <div>Protected</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/onboarding');
    });

    it('allows the onboarding route while onboarding is incomplete', () => {
      window.history.replaceState({}, '', '/onboarding');
      authState.isAuthenticated = true;
      authState.user = {
        id: 'u1',
        email: 'new@example.com',
        emailVerifiedAt: 'verified',
        onboardingCompleted: false,
      };

      render(
        <ProtectedRoute>
          <div data-testid="content">Onboarding</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Onboarding');
    });

    it('leaves onboarding after a fresh profile read confirms completion', () => {
      window.history.replaceState({}, '', '/onboarding');
      authState.isAuthenticated = true;
      authState.user = {
        id: 'u1',
        email: 'new@example.com',
        emailVerifiedAt: 'verified',
        onboardingCompleted: true,
      };

      render(
        <ProtectedRoute>
          <div>Onboarding</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/messages');
    });
  });

  describe('PublicRoute', () => {
    it('renders children when unauthenticated', () => {
      render(
        <PublicRoute>
          <div data-testid="public">Public</div>
        </PublicRoute>
      );
      expect(screen.getByTestId('public')).toBeInTheDocument();
    });

    it('redirects to /messages when authenticated and release gates are satisfied', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', email: 'user@example.com', emailVerifiedAt: 'verified' };
      render(
        <PublicRoute>
          <div>Public</div>
        </PublicRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/messages');
    });

    it('redirects authenticated public-route users to verify-email first', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', email: 'new@example.com', emailVerifiedAt: null };

      render(
        <PublicRoute>
          <div>Public</div>
        </PublicRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveAttribute(
        'data-to',
        '/verify-email?email=new%40example.com'
      );
    });
  });

  describe('AdminRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(
        <AdminRoute>
          <div>Admin</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('redirects to /messages when authenticated but not admin', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1' };
      render(
        <AdminRoute>
          <div>Admin</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/messages');
    });

    it('renders children when authenticated as admin', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', isAdmin: true };
      render(
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  describe('ProfileRedirectRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(<ProfileRedirectRoute />);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('redirects to user profile when user has id', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-42', username: 'tricker' };
      render(<ProfileRedirectRoute />);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/tricker');
    });

    it('falls back to user id when username is missing', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-42', username: null };
      render(<ProfileRedirectRoute />);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/user/user-42');
    });

    it('renders nothing when authenticated but user has no id', () => {
      authState.isAuthenticated = true;
      authState.user = null;
      const { container } = render(<ProfileRedirectRoute />);
      // Component returns null while waiting for user data
      expect(container.innerHTML).toBe('');
    });
  });
});
