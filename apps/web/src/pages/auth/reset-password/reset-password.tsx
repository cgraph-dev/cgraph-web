/**
 * Reset Password Page - Main Component
 *
 * Handles password reset with token validation.
 * Features strength meter and confirmation.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/shared/components/ui';
import { TurnstileWidget, isTurnstileEnabled } from '@/modules/auth/components/turnstile-widget';

import type { ResetState } from './types';
import { calculatePasswordStrength } from './utils';
import { ValidatingView, ExpiredView, SuccessView } from './state-views';
import { ResetPasswordForm } from './reset-password-form';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<ResetState>('validating');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const captchaRequired = isTurnstileEnabled();

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit =
    strength.score >= 4 && passwordsMatch && !isLoading && (!captchaRequired || !!turnstileToken);

  // The backend validates reset tokens when the new password is submitted.
  useEffect(() => {
    if (!token) {
      setState('expired');
      return;
    }

    setState('form');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!token) {
        throw new Error('Reset link is missing or invalid.');
      }

      const result = await apiClient.auth.resetPassword(
        token,
        password,
        confirmPassword,
        turnstileToken
      );

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      setState('success');
    } catch (error: unknown) {
      setTurnstileToken(null);
      setCaptchaResetSignal((value) => value + 1);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    switch (state) {
      case 'validating':
        return <ValidatingView />;
      case 'expired':
      case 'error':
        return <ExpiredView />;
      case 'success':
        return <SuccessView onContinue={() => navigate('/login')} />;
      case 'form':
        return (
          <ResetPasswordForm
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            strength={strength}
            passwordsMatch={passwordsMatch}
            canSubmit={canSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onToggleShowConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            onSubmit={handleSubmit}
            captcha={
              <TurnstileWidget onTokenChange={setTurnstileToken} resetSignal={captchaResetSignal} />
            }
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial from-primary-500/10 absolute -right-1/2 -top-1/2 h-full w-full rounded-full to-transparent" />
        <div className="bg-gradient-radial from-purple-500/10 absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">{renderContent()}</div>
      </GlassCard>
    </div>
  );
}
