import { forwardRef, useImperativeHandle } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captchaReset = vi.hoisted(() => vi.fn());

vi.mock('@/modules/auth/components/turnstile-widget', () => ({
  isTurnstileEnabled: () => true,
  TurnstileWidget: forwardRef(function MockTurnstileWidget(
    { onTokenChange }: { onTokenChange: (token: string | null) => void },
    ref
  ) {
    useImperativeHandle(ref, () => ({ reset: captchaReset }));
    return (
      <button type="button" onClick={() => onTokenChange('captcha-token')}>
        Complete challenge
      </button>
    );
  }),
}));

import { useAuthStore } from '@/modules/auth/store';
import ResetPassword from './reset-password';

function renderResetPassword(path = '/reset-password?token=reset-token') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPassword />
    </MemoryRouter>
  );
}

async function completeForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('New password'), 'NewPassword123!');
  await user.type(screen.getByLabelText('Confirm password'), 'NewPassword123!');
  await user.click(screen.getByRole('button', { name: 'Complete challenge' }));
  await user.click(screen.getByRole('button', { name: 'Reset password' }));
}

describe('ResetPassword', () => {
  beforeEach(() => {
    captchaReset.mockClear();
    useAuthStore.setState({ error: null, isLoading: false });
  });

  it('does not submit when the route has no reset token', () => {
    const resetPassword = vi.fn();
    useAuthStore.setState({ resetPassword });

    renderResetPassword('/reset-password');

    expect(screen.getByRole('heading', { name: 'Reset link unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('keeps a retryable server failure visible and resets the captcha', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn(async () => {
      useAuthStore.setState({ error: 'Password service is temporarily unavailable' });
      return {
        ok: false as const,
        status: 503,
        code: null,
        message: 'Password service is temporarily unavailable',
      };
    });
    useAuthStore.setState({ resetPassword });

    renderResetPassword();
    await completeForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password service is temporarily unavailable'
    );
    expect(screen.getByRole('heading', { name: 'Create a new password' })).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith(
      'reset-token',
      'NewPassword123!',
      'NewPassword123!',
      'captcha-token'
    );
    expect(captchaReset).toHaveBeenCalledTimes(1);
  });

  it('moves a rejected reset token to the invalid-link state', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      code: 'invalid_reset_token',
      message: 'Invalid or expired reset token',
    });
    useAuthStore.setState({ resetPassword });

    renderResetPassword();
    await completeForm(user);

    expect(
      await screen.findByRole('heading', { name: 'Reset link unavailable' })
    ).toBeInTheDocument();
  });

  it('shows the relogin boundary after a successful reset', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue({ ok: true });
    useAuthStore.setState({ resetPassword });

    renderResetPassword();
    await completeForm(user);

    expect(await screen.findByRole('heading', { name: 'Password reset' })).toBeInTheDocument();
    expect(screen.getByText(/previous sessions are signed out/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to login' })).toHaveAttribute(
      'href',
      '/login'
    );

    await waitFor(() => expect(resetPassword).toHaveBeenCalledTimes(1));
  });
});
