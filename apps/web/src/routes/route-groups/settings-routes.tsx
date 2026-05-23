/**
 * Settings route definitions (protected)
 *
 */

import { Route, Navigate } from 'react-router-dom';
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
      <Route
        path="settings/:section/:detail"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route path="settings/appearance" element={<Navigate to="/me/appearance/themes" replace />} />
      <Route
        path="settings/customization"
        element={<Navigate to="/me/appearance/identity" replace />}
      />
      <Route path="settings/billing" element={<Navigate to="/me/subscription" replace />} />
      <Route
        path="settings/subscription-manage"
        element={<Navigate to="/me/subscription" replace />}
      />
      {/* ARCHIVED: settings/theme route - moved to /me/appearance */}
      {/* ARCHIVED: settings/titles route - moved to /me/appearance/identity */}
      {/* ARCHIVED: settings/badges route - moved to /me/appearance/identity */}
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
