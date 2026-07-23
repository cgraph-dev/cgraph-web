/**
 * User registration page.
 */
import { durations } from '@cgraph-dev/animation-constants';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { OAuthButtonGroup } from '@/modules/auth/components/o-auth-buttons';
import { TurnstileWidget, isTurnstileEnabled } from '@/modules/auth/components/turnstile-widget';
import { prefersReducedMotion } from '@/modules/auth/components/auth-effects';
import { LogoIcon } from '@/components/logo';
import { createLogger } from '@/lib/logger';
import { useRegisterForm } from './register/useRegisterForm';
import { AuthErrorAlert } from './register/auth-error-alert';
import { RegisterFormFields } from './register/register-form-fields';

const logger = createLogger('Register');

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
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

// Header variant: NO opacity so TextScramble/GlitchText are visible immediately
const headerVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: { duration: durations.smooth.ms / 1000, ease: 'easeOut' as const },
  },
};

/**
 * Register component.
 */
export default function Register() {
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();
  const form = useRegisterForm();
  const captchaRequired = isTurnstileEnabled();

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
        <h2 className="text-3xl font-bold text-white">Create your account</h2>
        <p className="mt-2 text-foreground-muted">Join the community and start connecting</p>
      </motion.div>

      <AuthErrorAlert error={form.displayError} />

      {/* Register Form with staggered animations */}
      <form action={form.formAction} className="space-y-5">
        <RegisterFormFields
          showPassword={form.showPassword}
          setShowPassword={form.setShowPassword}
          showConfirmPassword={form.showConfirmPassword}
          setShowConfirmPassword={form.setShowConfirmPassword}
          email={form.email}
          setEmail={form.setEmail}
          username={form.username}
          setUsername={form.setUsername}
          isLoading={form.isLoading}
          isSubmitDisabled={captchaRequired && !form.turnstileToken}
          captcha={
            <TurnstileWidget
              onTokenChange={form.setTurnstileToken}
              resetSignal={form.captchaResetSignal}
            />
          }
        />
      </form>

      {/* Phone registration option */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center">
        <Link to="/register/phone" className="text-sm text-primary-400 hover:text-primary-300">
          Register with phone number instead
        </Link>
      </motion.div>

      {/* Configured OAuth providers are discovered from the backend. */}
      <motion.div variants={reduced ? {} : itemVariants}>
        <OAuthButtonGroup
          onSuccess={() => navigate('/messages')}
          onError={(err) => logger.error('OAuth error:', err)}
        />
      </motion.div>

      {/* Sign In Link with matrix styling */}
      <motion.p
        variants={reduced ? {} : itemVariants}
        className="text-center text-foreground-muted"
      >
        Already have an account?{' '}
        <Link to="/login" className="matrix-link font-medium">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
