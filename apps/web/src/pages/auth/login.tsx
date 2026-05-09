/**
 * User login page.
 */
import { durations } from '@cgraph/animation-constants';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  OAuthButtonGroup,
  useConfiguredOAuthProviders,
} from '@/modules/auth/components/o-auth-buttons';
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
import { tweens } from '@/lib/animation-presets';

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

export default function Login() {
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();
  const { t } = useTranslation('auth');
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();
  const oauthProviders = useConfiguredOAuthProviders();

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
    handleWalletConnect,
    walletConnectors,
  } = useLoginForm();
  const hasWalletConnector = (type: 'injected' | 'walletconnect' | 'coinbase') =>
    walletConnectors.some((connector) => connector.type === type);

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

      {/* Error Alert — reused from register */}
      <AuthErrorAlert error={error} />

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

          {oauthProviders.hasProviders && (
            <>
              {/* Divider with matrix styling */}
              <motion.div variants={reduced ? {} : itemVariants} className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-[var(--token-card-border)]/50 w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent px-4 text-gray-500 backdrop-blur-sm">
                    {t('login.or_continue_with')}
                  </span>
                </div>
              </motion.div>

              {/* OAuth Buttons with matrix hover effects */}
              <motion.div variants={reduced ? {} : itemVariants}>
                <OAuthButtonGroup
                  providers={oauthProviders.providers}
                  variant="icon"
                  onSuccess={() => navigate('/messages')}
                  onError={(err) => logger.error('OAuth error:', err)}
                />
              </motion.div>
            </>
          )}

          {/* Wallet Login — multi-wallet selector */}
          <motion.div variants={reduced ? {} : itemVariants} className="space-y-2">
            {hasWalletConnector('injected') && (
              <motion.button
                onClick={() => handleWalletConnect('injected')}
                disabled={isLoading}
                whileHover={
                  reduced || isLoading
                    ? {}
                    : {
                        scale: 1.02,
                        borderColor:
                          'color-mix(in srgb, var(--color-brand-purple) 50%, transparent)',
                      }
                }
                whileTap={reduced || isLoading ? {} : { scale: 0.98 }}
                className="hover:bg-[var(--token-card-bg)]/80 hover:border-violet-500/30 group flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-3 font-medium text-white transition-all duration-300 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)]"
              >
                <motion.svg
                  className="h-5 w-5"
                  viewBox="0 0 40 40"
                  fill="none"
                  whileHover={reduced ? {} : { rotate: 360 }}
                  transition={tweens.smooth}
                >
                  <path
                    d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
                    fill="#627EEA"
                  />
                  <path
                    d="M20.498 5V16.0875L29.995 20.2L20.498 5Z"
                    fill="white"
                    fillOpacity="0.602"
                  />
                  <path d="M20.498 5L11 20.2L20.498 16.0875V5Z" fill="white" />
                  <path
                    d="M20.498 27.4525V35.0025L30 21.815L20.498 27.4525Z"
                    fill="white"
                    fillOpacity="0.602"
                  />
                  <path d="M20.498 35.0025V27.4512L11 21.815L20.498 35.0025Z" fill="white" />
                  <path
                    d="M20.498 25.8363L29.995 20.2L20.498 16.09V25.8363Z"
                    fill="white"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M11 20.2L20.498 25.8363V16.09L11 20.2Z"
                    fill="white"
                    fillOpacity="0.602"
                  />
                </motion.svg>
                <span>{t('login.connect_wallet')}</span>
              </motion.button>
            )}

            {hasWalletConnector('walletconnect') && (
              <motion.button
                onClick={() => handleWalletConnect('walletconnect')}
                disabled={isLoading}
                whileHover={
                  reduced || isLoading
                    ? {}
                    : { scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }
                }
                whileTap={reduced || isLoading ? {} : { scale: 0.98 }}
                className="hover:bg-[var(--token-card-bg)]/80 group flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:border-blue-500/30 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.09 8.52c3.26-3.19 8.54-3.19 11.8 0l.39.38a.4.4 0 0 1 0 .58l-1.34 1.31a.21.21 0 0 1-.3 0l-.54-.53a5.82 5.82 0 0 0-8.24 0l-.58.56a.21.21 0 0 1-.3 0L5.65 9.52a.4.4 0 0 1 0-.58l.44-.42Zm14.58 2.71 1.19 1.17a.4.4 0 0 1 0 .58l-5.38 5.27a.43.43 0 0 1-.59 0l-3.82-3.74a.11.11 0 0 0-.15 0l-3.82 3.74a.43.43 0 0 1-.59 0L2.13 13a.4.4 0 0 1 0-.58l1.2-1.17a.43.43 0 0 1 .58 0l3.82 3.74a.11.11 0 0 0 .15 0l3.82-3.74a.43.43 0 0 1 .59 0l3.82 3.74a.11.11 0 0 0 .15 0l3.82-3.74a.43.43 0 0 1 .59 0Z"
                    fill="#3B99FC"
                  />
                </svg>
                <span>WalletConnect</span>
              </motion.button>
            )}

            {hasWalletConnector('coinbase') && (
              <motion.button
                onClick={() => handleWalletConnect('coinbase')}
                disabled={isLoading}
                whileHover={
                  reduced || isLoading
                    ? {}
                    : { scale: 1.02, borderColor: 'rgba(0, 82, 255, 0.5)' }
                }
                whileTap={reduced || isLoading ? {} : { scale: 0.98 }}
                className="hover:bg-[var(--token-card-bg)]/80 group flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:border-blue-600/30 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#0052FF" />
                  <path
                    d="M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-2.25 5.25h4.5v4.5h-4.5v-4.5Z"
                    fill="white"
                  />
                </svg>
                <span>Coinbase Wallet</span>
              </motion.button>
            )}
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
