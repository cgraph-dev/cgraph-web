import type { InputHTMLAttributes, PropsWithChildren } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Settings from '../settings';

const authState = {
  isAuthenticated: true,
  user: { id: 'user-1' },
};

const preferenceState = {
  bootstrapPreferences: vi.fn(),
  isBootstrapping: false,
  result: {},
  error: null,
  lastBootstrappedUserId: 'user-1',
};

vi.mock('motion/react', () => {
  const cleanProps = (props: Record<string, unknown>) => {
    const {
      animate: _animate,
      initial: _initial,
      exit: _exit,
      layoutId: _layoutId,
      transition: _transition,
      whileTap: _whileTap,
      ...domProps
    } = props;
    return domProps;
  };

  return {
    AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
    motion: {
      button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
        <button {...cleanProps(props)}>{children}</button>
      ),
      div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
        <div {...cleanProps(props)}>{children}</div>
      ),
    },
  };
});

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock('@/modules/settings/store/preferenceOrchestrator', () => ({
  isPreferenceBootstrapReady: () => true,
  usePreferenceOrchestrator: (selector: (state: typeof preferenceState) => unknown) =>
    selector(preferenceState),
}));

vi.mock('@/components/ui/glass-search-input', () => ({
  GlassSearchInput: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/modules/settings/components/account-settings', () => ({
  AccountSettings: () => <div data-testid="settings-panel-account">Account settings</div>,
}));

vi.mock('@/pages/settings/app-theme-settings', () => ({
  default: () => <div data-testid="settings-panel-app-theme">App theme settings</div>,
}));

vi.mock('@/pages/settings/connected-accounts', () => ({
  ConnectedAccounts: () => <div>Connected accounts</div>,
}));

vi.mock('@/pages/settings/delete-account', () => ({
  default: () => <div>Delete account</div>,
}));

vi.mock('@/pages/settings/data-export', () => ({
  default: () => <div>Data export</div>,
}));

vi.mock('@/modules/settings/components/panels', () => ({
  SecuritySettingsPanel: () => <div>Security settings</div>,
  NotificationSettingsPanel: () => <div>Notification settings</div>,
  LanguageSettingsPanel: () => <div>Language settings</div>,
  SessionsSettingsPanel: () => <div>Sessions settings</div>,
  PrivacySettingsPanel: () => <div>Privacy settings</div>,
  DndSchedulePanel: () => <div>DND schedule</div>,
  DataStoragePanel: () => <div>Data storage</div>,
}));

vi.mock('@/modules/settings/components/panels/advanced-settings-panel', () => ({
  AdvancedSettingsPanel: () => <div>Advanced settings</div>,
}));

vi.mock('@/modules/settings/components/panels/stickers-emoji-settings-panel', () => ({
  StickersEmojiSettingsPanel: () => <div>Stickers emoji settings</div>,
}));

vi.mock('@/modules/settings/components/panels/calls-settings-panel', () => ({
  CallsSettingsPanel: () => <div>Calls settings</div>,
}));

vi.mock('@/modules/settings/components/panels/notification-profiles-panel', () => ({
  NotificationProfilesPanel: () => <div>Notification profiles</div>,
}));

vi.mock('@/modules/settings/components/panels/notification-profile-editor', () => ({
  NotificationProfileEditor: () => <div>Notification profile editor</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderSettingsRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/me/settings"
          element={
            <>
              <Settings />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/me/settings/:section"
          element={
            <>
              <Settings />
              <LocationProbe />
            </>
          }
        />
        <Route path="/me/appearance/:category" element={<div>Profile cosmetics page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Settings navigation', () => {
  it('opens app appearance settings from the base settings route by keyboard', async () => {
    renderSettingsRoute('/me/settings');
    const user = userEvent.setup();

    const appearanceButton = screen.getByText('App theme and interface style').closest('button');
    expect(appearanceButton).toBeTruthy();

    appearanceButton!.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/me/settings/appearance');
    expect(screen.getByTestId('settings-panel-app-theme')).toBeInTheDocument();
    expect(screen.queryByText('Profile cosmetics page')).not.toBeInTheDocument();
  });

  it('recovers an invalid settings section to the account panel', async () => {
    renderSettingsRoute('/me/settings/legacy-theme-picker');

    expect(screen.getByTestId('settings-panel-account')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/me/settings/account');
    });
  });
});
