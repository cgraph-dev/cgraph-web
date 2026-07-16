/** Password-reset token consumption page. */
import { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  type TurnstileWidgetHandle,
} from '@/modules/auth/components/turnstile-widget';
import { useAuthStore } from '@/modules/auth/store';
import { validatePassword } from '@/modules/auth/utils/password-validation';
import { PasswordToggleButton } from './register/password-toggle-button';

type ResetView = 'form' | 'invalid' | 'success';

/** Replaces a password after the backend validates the reset token. */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const clearError = useAuthStore((state) => state.clearError);
  const requestError = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [view, setView] = useState<ResetView>(token ? 'form' : 'invalid');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const captchaRequired = isTurnstileEnabled();
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;
  const canSubmit =
    token.length > 0 &&
    passwordValidation.isValid &&
    passwordsMatch &&
    !isLoading &&
    (!captchaRequired || !!turnstileToken);
  const error = validationError ?? requestError;

  const clearFormError = () => {
    setValidationError(null);
    clearError();
  };

  const submit = async () => {
    clearFormError();

    if (!token) {
      setView('invalid');
      return;
    }

    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.errors[0] ?? 'Enter a valid password.');
      return;
    }

    if (!passwordsMatch) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (captchaRequired && !turnstileToken) {
      setValidationError('Complete the verification challenge to continue.');
      return;
    }

    const result = await resetPassword(
      token,
      password,
      passwordConfirmation,
      turnstileToken
    );

    if (result.ok) {
      setView('success');
      return;
    }

    setTurnstileToken(null);
    captchaRef.current?.reset();

    if (result.code === 'invalid_reset_token') {
      setView('invalid');
    }
  };

  if (view === 'invalid') {
    return (
      <ResetStatus
        icon={<AlertCircle className="h-12 w-12 text-red-400" aria-hidden />}
        title="Reset link unavailable"
        description="This password reset link is invalid, expired, or has already been used."
        actionHref="/forgot-password"
        actionLabel="Request a new link"
      />
    );
  }

  if (view === 'success') {
    return (
      <ResetStatus
        icon={<CheckCircle2 className="h-12 w-12 text-green-400" aria-hidden />}
        title="Password reset"
        description="Your password is updated and previous sessions are signed out. Sign in again with your new password."
        actionHref="/login"
        actionLabel="Continue to login"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <KeyRound className="mx-auto mb-4 h-10 w-10 text-primary-400 lg:mx-0" aria-hidden />
        <h2 className="text-2xl font-bold text-white">Create a new password</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Choose a strong password you have not used for this account.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      <form action={submit} className="space-y-5">
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          show={showPassword}
          autoComplete="new-password"
          onChange={(value) => {
            setPassword(value);
            clearFormError();
          }}
          onToggle={() => setShowPassword((current) => !current)}
        />

        {password ? (
          <div className="text-xs leading-5" aria-live="polite">
            {passwordValidation.isValid ? (
              <p className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Password meets all requirements.
              </p>
            ) : (
              <ul className="space-y-1 text-gray-400">
                {passwordValidation.errors.map((passwordError) => (
                  <li key={passwordError}>{passwordError}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={passwordConfirmation}
          show={showPasswordConfirmation}
          autoComplete="new-password"
          onChange={(value) => {
            setPasswordConfirmation(value);
            clearFormError();
          }}
          onToggle={() => setShowPasswordConfirmation((current) => !current)}
        />

        {passwordConfirmation && !passwordsMatch ? (
          <p className="text-xs text-red-400">Passwords do not match.</p>
        ) : null}

        <TurnstileWidget
          ref={captchaRef}
          onTokenChange={(captchaToken) => {
            setTurnstileToken(captchaToken);
            if (captchaToken) setValidationError(null);
          }}
        />

        <SubmitButton
          pendingText="Resetting password..."
          className="auth-cta-button w-full py-3"
          disabled={!canSubmit}
        >
          Reset password
        </SubmitButton>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to login
      </Link>
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  show: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({
  id,
  label,
  value,
  show,
  autoComplete,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          maxLength={72}
          autoComplete={autoComplete}
          className="matrix-input w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />
        <PasswordToggleButton show={show} onToggle={onToggle} />
      </div>
    </div>
  );
}

interface ResetStatusProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

function ResetStatus({ icon, title, description, actionHref, actionLabel }: ResetStatusProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">{icon}</div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>
      <Link
        to={actionHref}
        className="auth-cta-button inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium text-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
