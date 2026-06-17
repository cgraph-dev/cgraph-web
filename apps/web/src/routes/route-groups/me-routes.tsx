/**
 * Me hub route definitions (protected)
 *
 * Mounts at /me with MePage as layout element.
 * Nested routes delegate to existing page components.
 */

import { Route, Navigate } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/feedback/route-error-boundary';
import {
  MePage,
  Customize,
  NodesWalletPage,
  NodesShopPage,
  PremiumPage,
  InviteFriends,
  Settings,
  E2EEVerification,
  KeyVerification,
  DiscoverySettings,
} from '../lazyPages';
import { ProfileRedirectRoute } from '../guards';

/** All Me hub related protected routes */
export function MeRoutes() {
  return (
    <Route
      path="me"
      element={
        <RouteErrorBoundary routeName="Me">
          <MePage />
        </RouteErrorBoundary>
      }
    >
      {/* Identity */}
      <Route path="profile" element={<ProfileRedirectRoute />} />
      <Route path="appearance" element={<Navigate to="/me/appearance/identity" replace />} />
      <Route
        path="appearance/:category"
        element={
          <RouteErrorBoundary routeName="Appearance">
            <Customize />
          </RouteErrorBoundary>
        }
      />

      {/* Economy */}
      <Route
        path="wallet"
        element={
          <RouteErrorBoundary routeName="Wallet">
            <NodesWalletPage />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="wallet/shop"
        element={
          <RouteErrorBoundary routeName="Node Shop">
            <NodesShopPage />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="subscription"
        element={
          <RouteErrorBoundary routeName="Subscription">
            <PremiumPage />
          </RouteErrorBoundary>
        }
      />

      {/* Social */}
      <Route
        path="invites"
        element={
          <RouteErrorBoundary routeName="Invites">
            <InviteFriends />
          </RouteErrorBoundary>
        }
      />

      {/* Preferences */}
      <Route
        path="settings"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/:section"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/:section/:detail"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/app-theme"
        element={<Navigate to="/me/settings/appearance" replace />}
      />
      <Route
        path="settings/discovery"
        element={
          <RouteErrorBoundary routeName="Discovery Settings">
            <DiscoverySettings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/security/e2ee/:userId"
        element={
          <RouteErrorBoundary routeName="E2EE Verification">
            <E2EEVerification />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/security/verify-key/:userId"
        element={
          <RouteErrorBoundary routeName="Key Verification">
            <KeyVerification />
          </RouteErrorBoundary>
        }
      />
    </Route>
  );
}
