import { render, screen } from '@testing-library/react';
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
          resendSuccess
          resendEmail="member@example.com"
          resendError={null}
          isResendEmailEditable
          onResendEmailChange={vi.fn()}
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
});
