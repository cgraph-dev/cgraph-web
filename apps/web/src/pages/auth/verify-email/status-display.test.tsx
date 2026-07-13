import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import StatusDisplay from './status-display';

describe('StatusDisplay', () => {
  it('does not promise mailbox delivery after a non-enumerating resend response', () => {
    render(
      <MemoryRouter>
        <StatusDisplay
          state="pending"
          isResending={false}
          isCheckingVerificationStatus={false}
          resendSuccess
          resendEmail="member@example.com"
          resendError={null}
          resendCooldownSeconds={0}
          isResendEmailEditable
          onResendEmailChange={vi.fn()}
          onCheckVerificationStatus={vi.fn()}
          onResend={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Verification request received')).toBeInTheDocument();
    expect(
      screen.getByText(/If an unverified CGraph account matches this address/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('New verification email sent!')).not.toBeInTheDocument();
  });

  it('disables duplicate resend attempts during the server-provided cooldown', () => {
    render(
      <MemoryRouter>
        <StatusDisplay
          state="pending"
          isResending={false}
          isCheckingVerificationStatus={false}
          resendSuccess={false}
          resendEmail="member@example.com"
          resendError={null}
          resendCooldownSeconds={75}
          isResendEmailEditable={false}
          onResendEmailChange={vi.fn()}
          onCheckVerificationStatus={vi.fn()}
          onResend={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Resend available in 1:15' })).toBeDisabled();
    expect(screen.getByText('Another verification request is available in 1:15.')).toBeInTheDocument();
  });

  it('lets a signed-in pending account request a fresh status check', async () => {
    const onCheckVerificationStatus = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StatusDisplay
          state="pending"
          isResending={false}
          isCheckingVerificationStatus={false}
          resendSuccess={false}
          resendEmail="member@example.com"
          resendError={null}
          resendCooldownSeconds={0}
          isResendEmailEditable={false}
          onResendEmailChange={vi.fn()}
          onCheckVerificationStatus={onCheckVerificationStatus}
          onResend={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Check verification status' }));

    expect(onCheckVerificationStatus).toHaveBeenCalledTimes(1);
  });

  it('announces a verification status check while the auth refresh is pending', () => {
    render(
      <MemoryRouter>
        <StatusDisplay
          state="pending"
          isResending={false}
          isCheckingVerificationStatus
          resendSuccess={false}
          resendEmail="member@example.com"
          resendError={null}
          resendCooldownSeconds={0}
          isResendEmailEditable={false}
          onResendEmailChange={vi.fn()}
          onCheckVerificationStatus={vi.fn()}
          onResend={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Checking verification status' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Checking your account status.');
  });

  it('does not show a status recheck for public recovery', () => {
    render(
      <MemoryRouter>
        <StatusDisplay
          state="pending"
          isResending={false}
          isCheckingVerificationStatus={false}
          resendSuccess={false}
          resendEmail="recovery@example.com"
          resendError={null}
          resendCooldownSeconds={0}
          isResendEmailEditable
          onResendEmailChange={vi.fn()}
          onCheckVerificationStatus={vi.fn()}
          onResend={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: 'Check verification status' })).not.toBeInTheDocument();
  });
});
