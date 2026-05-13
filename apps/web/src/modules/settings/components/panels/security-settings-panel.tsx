/**
 * Security settings panel.
 */
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

/**
 */
/**
 * Security Settings Panel component.
 */
export function SecuritySettingsPanel() {
  const { user } = useAuthStore();

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-start gap-3">
        <div className="aurora-page-icon p-3">
          <ShieldCheckIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-primary-300/75 mb-1 text-[11px] font-black uppercase tracking-[0.24em]">
            Account Protection
          </p>
          <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Security
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Passwords, verification, and session controls styled to match the Social Aurora shell.
          </p>
        </div>
      </div>

      {/* Password */}
      <GlassCard variant="default" className="aurora-social-panel mb-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Password</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">Change your password</p>
          </div>
          <button className="aurora-social-button rounded-xl px-5 py-2 text-sm font-bold text-[var(--token-text-primary)] hover:scale-[1.02] active:scale-[0.98]">
            Change
          </button>
        </div>
      </GlassCard>

      {/* 2FA */}
      <GlassCard variant="default" className="aurora-social-panel mb-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              {user?.twoFactorEnabled
                ? 'Two-factor authentication is enabled'
                : 'Add an extra layer of security'}
            </p>
          </div>
          <button
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              user?.twoFactorEnabled ? 'aurora-social-button-danger' : 'aurora-social-button'
            }`}
          >
            {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </GlassCard>

      {/* Email Verification */}
      <GlassCard variant="default" className="aurora-social-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Email Verification</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              {user?.emailVerifiedAt ? 'Your email is verified' : 'Verify your email address'}
            </p>
          </div>
          {!user?.emailVerifiedAt && (
            <button className="aurora-social-button rounded-xl px-5 py-2 text-sm font-bold text-[var(--token-text-primary)] hover:scale-[1.02] active:scale-[0.98]">
              Verify
            </button>
          )}
          {user?.emailVerifiedAt && (
            <span className="text-sm font-bold text-primary-400">✓ Verified</span>
          )}
        </div>
      </GlassCard>

      {/* Active Sessions */}
      <GlassCard variant="default" className="aurora-social-panel mt-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Active Sessions</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              Manage your logged-in devices and sessions
            </p>
          </div>
          <Link
            to="/me/settings/sessions"
            className="aurora-social-button rounded-xl px-5 py-2 text-sm font-bold text-[var(--token-text-primary)] hover:scale-[1.02] active:scale-[0.98]"
          >
            View Sessions
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}
