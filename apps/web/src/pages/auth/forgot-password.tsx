/** Password-reset request page. */
import { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoIcon } from '@/components/logo';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  type TurnstileWidgetHandle,
} from '@/modules/auth/components/turnstile-widget';
import { useAuthStore } from '@/modules/auth/store';

/** Requests a reset link without disclosing whether the account exists. */
export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const clearError = useAuthStore((state) => state.clearError);
  const requestError = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const captchaRequired = isTurnstileEnabled();
  const error = validationError ?? requestError;

  const submit = async () => {
    setValidationError(null);
    clearError();

    if (captchaRequired && !turnstileToken) {
      setValidationError('Complete the verification challenge to continue.');
      return;
    }

    try {
      await requestPasswordReset(email.trim(), turnstileToken);
      setIsSuccess(true);
    } catch {
      setTurnstileToken(null);
      captchaRef.current?.reset();
    }
  };

  const tryAnotherAddress = () => {
    clearError();
    setValidationError(null);
    setTurnstileToken(null);
    setIsSuccess(false);
    captchaRef.current?.reset();
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <MobileLogo />
        <div className="text-center lg:text-left">
          <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-green-400 lg:mx-0" aria-hidden />
          <h2 className="text-2xl font-bold text-white">Request received</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            If a CGraph account matches <span className="break-all text-white">{email}</span>,
            reset instructions will arrive shortly.
          </p>
        </div>

        <button type="button" onClick={tryAnotherAddress} className="matrix-link text-sm">
          {t('forgot_password.try_another')}
        </button>

        <BackToLogin label={t('forgot_password.back_to_login')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MobileLogo />
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white">{t('forgot_password.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">{t('forgot_password.subtitle')}</p>
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
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            {t('forgot_password.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setValidationError(null);
              clearError();
            }}
            required
            autoComplete="email"
            className="matrix-input w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="you@example.com"
          />
        </div>

        <TurnstileWidget
          ref={captchaRef}
          onTokenChange={(token) => {
            setTurnstileToken(token);
            if (token) setValidationError(null);
          }}
        />

        <SubmitButton
          pendingText="Sending..."
          className="auth-cta-button w-full py-3"
          disabled={isLoading || (captchaRequired && !turnstileToken)}
        >
          {t('forgot_password.submit')}
        </SubmitButton>
      </form>

      <BackToLogin label={t('forgot_password.back_to_login')} />
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="text-center lg:hidden">
      <a href="https://www.cgraph.org" className="inline-flex items-center">
        <LogoIcon size={144} color="gradient" showGlow={false} />
      </a>
    </div>
  );
}

function BackToLogin({ label }: { label: string }) {
  return (
    <Link
      to="/login"
      className="flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
