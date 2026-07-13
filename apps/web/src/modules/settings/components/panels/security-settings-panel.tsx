/**
 * Security settings panel.
 */
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { useTwoFactor, type TwoFactorSetup } from '@/modules/auth/hooks';
import { useAuthStore } from '@/modules/auth/store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GlassCard,
  Input,
} from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

type TwoFactorDialog = 'setup' | 'disable' | null;

/**
 */
/**
 * Security Settings Panel component.
 */
export function SecuritySettingsPanel() {
  const { user } = useAuthStore();
  const {
    status: twoFactorStatus,
    error: twoFactorError,
    clearError: clearTwoFactorError,
    isLoadingStatus,
    isMutating,
    refreshStatus,
    startSetup,
    enable,
    disable,
  } = useTwoFactor();
  const [twoFactorDialog, setTwoFactorDialog] = useState<TwoFactorDialog>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const closeTwoFactorDialog = () => {
    if (isMutating) return;

    clearTwoFactorError();
    setTwoFactorDialog(null);
    setSetup(null);
    setVerificationCode('');
    setFormError(null);
  };

  const startTwoFactorAction = async () => {
    clearTwoFactorError();
    setFormError(null);

    if (twoFactorStatus?.enabled) {
      setTwoFactorDialog('disable');
      return;
    }

    const nextSetup = await startSetup();
    if (nextSetup) {
      setSetup(nextSetup);
      setVerificationCode('');
      setTwoFactorDialog('setup');
    }
  };

  const submitTwoFactorSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!setup) return;

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setFormError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setFormError(null);
    if (await enable(setup, code)) {
      closeTwoFactorDialog();
    }
  };

  const submitTwoFactorDisable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = verificationCode.trim();
    if (!code) {
      setFormError('Enter an authenticator or backup code.');
      return;
    }

    setFormError(null);
    if (await disable(code)) {
      closeTwoFactorDialog();
    }
  };

  const twoFactorStatusMessage =
    twoFactorStatus === null
      ? isLoadingStatus
        ? 'Checking your two-factor security status'
        : 'Two-factor status could not be loaded'
      : twoFactorStatus.enabled
        ? `Two-factor authentication is enabled. ${twoFactorStatus.backupCodesRemaining} backup codes remaining.`
        : 'Add an extra layer of security';

  const twoFactorActionLabel = twoFactorStatus?.enabled ? 'Disable' : 'Enable';
  const twoFactorActionDisabled = twoFactorStatus === null || isLoadingStatus || isMutating;

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
              {twoFactorStatusMessage}
            </p>
          </div>
          {twoFactorStatus === null && twoFactorError ? (
            <button
              type="button"
              className="aurora-social-button rounded-xl px-5 py-2 text-sm font-bold text-[var(--token-text-primary)] hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => void refreshStatus()}
              disabled={isLoadingStatus || isMutating}
            >
              Retry status
            </button>
          ) : (
            <button
              type="button"
              className={`rounded-xl px-5 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                twoFactorStatus?.enabled ? 'aurora-social-button-danger' : 'aurora-social-button'
              }`}
              onClick={() => void startTwoFactorAction()}
              disabled={twoFactorActionDisabled}
            >
              {isMutating ? 'Working...' : twoFactorActionLabel}
            </button>
          )}
        </div>
        {twoFactorError && twoFactorDialog === null && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {twoFactorError}
          </p>
        )}
      </GlassCard>

      <Dialog open={twoFactorDialog === 'setup'} onOpenChange={closeTwoFactorDialog}>
        <DialogContent ariaLabel="Set up two-factor authentication">
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan this code with an authenticator app, then enter its current 6-digit code to
              confirm setup.
            </DialogDescription>
          </DialogHeader>

          {setup && (
            <form onSubmit={submitTwoFactorSetup} className="space-y-4">
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG value={setup.qrCodeUri} size={176} level="M" includeMargin={false} />
              </div>
              <Input
                label="Manual setup key"
                value={setup.secret}
                readOnly
                autoComplete="off"
                aria-label="Manual setup key"
              />
              <div>
                <p className="text-sm font-medium text-[var(--token-text-secondary)]">Backup codes</p>
                <p className="mt-1 text-sm text-[var(--token-text-muted)]">
                  Store these once. Each can recover your account if your authenticator is unavailable.
                </p>
                <ul
                  aria-label="Backup codes"
                  className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[var(--token-card-border)] p-3 font-mono text-sm text-[var(--token-text-primary)]"
                >
                  {setup.backupCodes.map((backupCode) => (
                    <li key={backupCode}>{backupCode}</li>
                  ))}
                </ul>
              </div>
              <Input
                id="two-factor-setup-code"
                label="Authenticator code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                error={formError ?? twoFactorError ?? undefined}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeTwoFactorDialog} disabled={isMutating}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isMutating}>
                  Enable two-factor authentication
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={twoFactorDialog === 'disable'} onOpenChange={closeTwoFactorDialog}>
        <DialogContent ariaLabel="Disable two-factor authentication">
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter a current authenticator code or a backup code to confirm this change.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitTwoFactorDisable} className="space-y-4">
            <Input
              id="two-factor-disable-code"
              label="Authenticator or backup code"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              autoComplete="one-time-code"
              error={formError ?? twoFactorError ?? undefined}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeTwoFactorDialog} disabled={isMutating}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={isMutating}>
                Disable two-factor authentication
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
