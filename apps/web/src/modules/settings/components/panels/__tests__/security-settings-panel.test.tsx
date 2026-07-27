import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockUser, passwordChange, twoFactor } = vi.hoisted(() => ({
  mockUser: {
    id: 'user-1',
    username: 'testuser',
    emailVerifiedAt: null as string | null,
  },
  twoFactor: {
    status: null as {
      enabled: boolean;
      enabledAt: string | null;
      backupCodesRemaining: number;
    } | null,
    error: null as string | null,
    isLoadingStatus: false,
    isMutating: false,
    refreshStatus: vi.fn(),
    startSetup: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    clearError: vi.fn(),
  },
  passwordChange: {
    error: null as string | null,
    isChanging: false,
    clearError: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => ({ user: mockUser })),
}));

vi.mock('@/modules/auth/hooks', () => ({
  usePasswordChange: vi.fn(() => passwordChange),
  useTwoFactor: vi.fn(() => twoFactor),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    children,
    isLoading,
    variant: _variant,
    animated: _animated,
    ...props
  }: Record<string, unknown> & {
    children?: React.ReactNode;
    isLoading?: boolean;
    animated?: boolean;
  }) => (
    <button {...props}>{isLoading ? 'Loading...' : children}</button>
  ),
  Dialog: ({
    open,
    children,
  }: Record<string, unknown> & { open?: boolean; children?: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({
    children,
    ariaLabel,
  }: Record<string, unknown> & { children?: React.ReactNode; ariaLabel?: string }) => (
    <div aria-label={ariaLabel}>{children}</div>
  ),
  DialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  GlassCard: ({
    children,
    variant: _variant,
    ...rest
  }: Record<string, unknown> & { children?: React.ReactNode }) => (
    <div data-testid="glass-card" {...rest}>
      {children}
    </div>
  ),
  Input: ({
    label,
    error,
    ...props
  }: Record<string, unknown> & { label?: string; error?: string }) => (
    <label>
      {label}
      <input {...props} />
      {error && <span role="alert">{error}</span>}
    </label>
  ),
}));

import { SecuritySettingsPanel } from '../security-settings-panel';

function renderPanel() {
  return render(
    <MemoryRouter>
      <SecuritySettingsPanel />
    </MemoryRouter>
  );
}

describe('SecuritySettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.emailVerifiedAt = null;
    twoFactor.status = {
      enabled: false,
      enabledAt: null,
      backupCodesRemaining: 0,
    };
    twoFactor.error = null;
    twoFactor.isLoadingStatus = false;
    twoFactor.isMutating = false;
    passwordChange.error = null;
    passwordChange.isChanging = false;
  });

  it('loads the authoritative two-factor status on mount', async () => {
    renderPanel();

    await waitFor(() => {
      expect(twoFactor.refreshStatus).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the Security heading and password section', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('submits the password contract only after confirmation matches', async () => {
    passwordChange.changePassword.mockResolvedValueOnce(true);
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'CurrentPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => {
      expect(passwordChange.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123!',
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      });
    });
  });

  it('does not submit mismatched new passwords', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'CurrentPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'DifferentPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(passwordChange.changePassword).not.toHaveBeenCalled();
    expect(screen.getByText('New passwords do not match.')).toBeInTheDocument();
  });

  it('keeps the dialog open and presents a backend password error', async () => {
    passwordChange.error = 'Current password is incorrect';
    passwordChange.changePassword.mockResolvedValueOnce(false);
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'WrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => {
      expect(passwordChange.changePassword).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
  });

  it('renders enabled two-factor state from the server status, not cached user data', () => {
    twoFactor.status = {
      enabled: true,
      enabledAt: '2026-07-13T12:00:00Z',
      backupCodesRemaining: 6,
    };

    renderPanel();

    expect(
      screen.getByText('Two-factor authentication is enabled. 6 backup codes remaining.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument();
  });

  it('does not expose a mutable control until the server status is available', () => {
    twoFactor.status = null;
    twoFactor.isLoadingStatus = true;

    renderPanel();

    expect(screen.getByText('Checking your two-factor security status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable' })).toBeDisabled();
  });

  it('retries a failed two-factor status load', () => {
    twoFactor.status = null;
    twoFactor.error = 'Unable to load security status';

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Retry status' }));

    expect(twoFactor.refreshStatus).toHaveBeenCalledTimes(2);
  });

  it('starts setup explicitly and submits the backend setup payload with the user code', async () => {
    const setup = {
      secret: 'SECRET-KEY',
      qrCodeUri: 'otpauth://totp/CGraph:test@example.com?secret=SECRET-KEY',
      backupCodes: ['ABCD-1234', 'EFGH-5678'],
    };
    twoFactor.startSetup.mockResolvedValueOnce(setup);
    twoFactor.enable.mockResolvedValueOnce(true);

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));

    await waitFor(() => {
      expect(twoFactor.startSetup).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('qr-code')).toHaveTextContent(setup.qrCodeUri);
    expect(screen.getByText('ABCD-1234')).toBeInTheDocument();
    expect(screen.getByText('EFGH-5678')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Authenticator code'), {
      target: { value: '123456' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable two-factor authentication' })
    );

    await waitFor(() => {
      expect(twoFactor.enable).toHaveBeenCalledWith(setup, '123456');
    });
  });

  it('does not send an invalid setup code to the backend owner', async () => {
    twoFactor.startSetup.mockResolvedValueOnce({
      secret: 'SECRET-KEY',
      qrCodeUri: 'otpauth://totp/CGraph:test@example.com?secret=SECRET-KEY',
      backupCodes: ['ABCD-1234'],
    });

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('Authenticator code'), {
      target: { value: '12345' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable two-factor authentication' })
    );

    expect(twoFactor.enable).not.toHaveBeenCalled();
    expect(
      screen.getByText('Enter the 6-digit code from your authenticator app.')
    ).toBeInTheDocument();
  });

  it('requires a confirmation code before disabling two-factor authentication', async () => {
    twoFactor.status = {
      enabled: true,
      enabledAt: '2026-07-13T12:00:00Z',
      backupCodesRemaining: 6,
    };
    twoFactor.disable.mockResolvedValueOnce(true);

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('Authenticator or backup code'), {
      target: { value: 'ABCD-1234' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Disable two-factor authentication' })
    );

    await waitFor(() => {
      expect(twoFactor.disable).toHaveBeenCalledWith('ABCD-1234');
    });
  });

  it('routes an unverified account to its authenticated verification flow', () => {
    renderPanel();

    expect(screen.getByText('Email Verification')).toBeInTheDocument();
    expect(screen.getByText('Verify your email address')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Verify' })).toHaveAttribute('href', '/verify-email');
  });

  it('renders email verified state with checkmark', () => {
    mockUser.emailVerifiedAt = '2025-06-01T00:00:00Z';

    renderPanel();

    expect(screen.getByText('Your email is verified')).toBeInTheDocument();
    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Verify' })).not.toBeInTheDocument();
  });

  it('renders Active Sessions section with its owned route', () => {
    renderPanel();

    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    const link = screen.getByText('View Sessions');
    expect(link.getAttribute('href')).toBe('/me/settings/sessions');
  });

  it('renders four Security cards', () => {
    renderPanel();

    expect(screen.getAllByTestId('glass-card')).toHaveLength(4);
  });
});
