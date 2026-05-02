/**
 * Settings route definitions (protected)
 *
 */

import { Route } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/feedback/route-error-boundary';
import { Settings, E2EEVerification, KeyVerification } from '../lazyPages';

/** All settings-related protected routes */
export function SettingsRoutes() {
  return (
    <>
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
      {/* ARCHIVED: settings/theme route — moved to /me/appearance */}
      {/* ARCHIVED: settings/titles route — moved to /me/appearance/identity */}
      {/* ARCHIVED: settings/badges route — moved to /me/appearance/identity */}
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
    </>
  );
}
