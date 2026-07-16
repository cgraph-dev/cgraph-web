import { forwardRef, useImperativeHandle } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captchaReset = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'forgot_password.title': 'Forgot password?',
        'forgot_password.subtitle': "No worries, we'll send you reset instructions.",
        'forgot_password.email': 'Email address',
        'forgot_password.submit': 'Reset password',
        'forgot_password.back_to_login': 'Back to login',
        'forgot_password.try_another': 'try another email address',
      })[key] ?? key,
  }),
}));

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
import ForgotPassword from './forgot-password';

function renderForgotPassword() {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
}

async function completeForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email address'), 'member@example.com');
  await user.click(screen.getByRole('button', { name: 'Complete challenge' }));
  await user.click(screen.getByRole('button', { name: 'Reset password' }));
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    captchaReset.mockClear();
    useAuthStore.setState({ error: null, isLoading: false });
  });

  it('uses non-enumerating success copy', async () => {
    const user = userEvent.setup();
    const requestPasswordReset = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ requestPasswordReset });

    renderForgotPassword();
    await completeForm(user);

    expect(await screen.findByRole('heading', { name: 'Request received' })).toBeInTheDocument();
    expect(screen.getByText(/If a CGraph account matches/i)).toBeInTheDocument();
    expect(screen.queryByText(/We've sent a password reset link/i)).not.toBeInTheDocument();
    expect(requestPasswordReset).toHaveBeenCalledWith('member@example.com', 'captcha-token');
  });

  it('keeps a delivery failure visible and resets the captcha', async () => {
    const user = userEvent.setup();
    const requestPasswordReset = vi.fn(async () => {
      useAuthStore.setState({ error: 'Password email service is unavailable' });
      throw new Error('Password email service is unavailable');
    });
    useAuthStore.setState({ requestPasswordReset });

    renderForgotPassword();
    await completeForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password email service is unavailable'
    );
    expect(captchaReset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Forgot password?' })).toBeInTheDocument();
  });
});
