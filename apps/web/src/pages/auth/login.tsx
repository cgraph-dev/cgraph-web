/**
 * User login page.
 */
import { durations } from '@cgraph-dev/animation-constants';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { OAuthButtonGroup } from '@/modules/auth/components/o-auth-buttons';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  type TurnstileWidgetHandle,
} from '@/modules/auth/components/turnstile-widget';
import { prefersReducedMotion } from '@/modules/auth/components/auth-effects';
import { AuthErrorAlert } from '@/pages/auth/register/auth-error-alert';
import { useLoginForm } from '@/pages/auth/login/useLoginForm';
import { LoginFormFields } from '@/pages/auth/login/login-form-fields';
import { TwoFactorForm } from '@/pages/auth/login/two-factor-form';
import { LogoIcon } from '@/components/logo';
import { SubmitButton } from '@/components/ui/submit-button';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Login');

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slower.ms / 1000, ease: 'easeOut' as const },
  },
};

// Header variant: NO opacity animation so TextScramble/GlitchText are visible immediately
const headerVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: { duration: durations.smooth.ms / 1000, ease: 'easeOut' as const },
  },
};

/**
 * Login component.
 */
export default function Login() {
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();
  const { t } = useTranslation('auth');
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    loginStep,
    twoFactorToken,
    handleSubmit,
    handleVerifyTwoFactor,
    handleBackToCredentials,
  } = useLoginForm();

  const submitWithCaptcha = async () => {
    if (captchaRequired && !turnstileToken) {
      return;
    }

    const ok = await handleSubmit(turnstileToken);

    if (!ok) {
      captchaRef.current?.reset();
    }
  };

  return (
    <motion.div
      className="space-y-4"
      variants={reduced ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Logo with matrix glow */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:hidden">
        <a href="https://www.cgraph.org" className="group inline-flex items-center gap-3">
          <div>
            <LogoIcon size={192} color="gradient" showGlow={false} />
          </div>
        </a>
      </motion.div>

      {/* Header with cyberpunk text effect */}
      <motion.div variants={reduced ? {} : headerVariants} className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">{t('login.title')}</h2>
        <p className="mt-2 text-gray-400">{t('login.subtitle')}</p>
      </motion.div>

      {/* Credential-step error alert; 2FA renders its scoped error inside the code form. */}
      {loginStep === 'credentials' ? <AuthErrorAlert error={error} /> : null}

      {loginStep === '2fa' && twoFactorToken ? (
        /* Two-Factor Verification Form */
        <TwoFactorForm
          twoFactorToken={twoFactorToken}
          isLoading={isLoading}
          error={error}
          onVerify={handleVerifyTwoFactor}
          onBack={handleBackToCredentials}
          itemVariants={reduced ? undefined : itemVariants}
          reduced={reduced}
        />
      ) : (
        <>
          {/* Login Form with staggered animations */}
          <form action={submitWithCaptcha} className="space-y-6">
            <LoginFormFields
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              itemVariants={reduced ? undefined : itemVariants}
              reduced={reduced}
            />

            <motion.div variants={reduced ? {} : itemVariants}>
              <TurnstileWidget ref={captchaRef} onTokenChange={setTurnstileToken} />
            </motion.div>

            <motion.div variants={reduced ? {} : itemVariants}>
              <SubmitButton
                pendingText={t('login.signing_in')}
                className="auth-cta-button w-full py-3"
                disabled={isLoading || (captchaRequired && !turnstileToken)}
              >
                <span>{t('login.submit')}</span>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </SubmitButton>
            </motion.div>
          </form>

          <motion.div variants={reduced ? {} : itemVariants} className="text-center">
            <Link to="/login/phone" className="text-sm text-primary-400 hover:text-primary-300">
              Continue with phone number instead
            </Link>
          </motion.div>

          {/* Configured OAuth providers are discovered from the backend. */}
          <motion.div variants={reduced ? {} : itemVariants}>
            <OAuthButtonGroup
              onSuccess={() => navigate('/messages')}
              onError={(err) => logger.error('OAuth error:', err)}
            />
          </motion.div>

          {/* Sign Up Link with matrix styling */}
          <motion.p variants={reduced ? {} : itemVariants} className="text-center text-gray-400">
            {t('login.no_account')}{' '}
            <Link to="/register" className="matrix-link font-medium">
              {t('login.sign_up')}
            </Link>
          </motion.p>
        </>
      )}
    </motion.div>
  );
}
