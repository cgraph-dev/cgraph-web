/**
 * Login form input fields — email/username and password.
 *
 */

import { motion, type Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PasswordToggleButton } from '@/pages/auth/register/password-toggle-button';

interface LoginFormFieldsProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  itemVariants: Variants | undefined;
  reduced: boolean;
}

/**
 */
/**
 * Login Form Fields component.
 */
export function LoginFormFields({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  itemVariants,
  reduced: _reduced,
}: LoginFormFieldsProps) {
  const { t } = useTranslation('auth');
  return (
    <>
      <motion.div variants={itemVariants}>
        <label
          htmlFor="identifier"
          className="mb-2 block text-sm font-medium text-foreground-secondary"
        >
          {t('login.email_or_username')}
        </label>
        <motion.input
          id="identifier"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className="matrix-input w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-3 text-foreground placeholder-foreground-muted transition-all duration-300 hover:border-[color-mix(in_srgb,var(--color-brand-purple)_25%,transparent)] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          placeholder={t('login.email_placeholder')}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-foreground-secondary"
        >
          {t('login.password')}
        </label>
        <div className="relative">
          <motion.input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="matrix-input w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-3 pr-12 text-foreground placeholder-foreground-muted transition-all duration-300 hover:border-[color-mix(in_srgb,var(--color-brand-purple)_25%,transparent)] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="••••••••"
          />
          <PasswordToggleButton
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end">
        <Link to="/forgot-password" className="matrix-link text-sm">
          {t('forgot_password.title')}
        </Link>
      </motion.div>
    </>
  );
}
