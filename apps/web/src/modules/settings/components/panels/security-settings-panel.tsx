/**
 * Security settings panel.
 */
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { usePasswordChange, useTwoFactor, type TwoFactorSetup } from '@/modules/auth/hooks';
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
    error: passwordChangeError,
    isChanging: isChangingPassword,
    clearError: clearPasswordChangeError,
    changePassword,
  } = usePasswordChange();
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

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

  const openPasswordDialog = () => {
    clearPasswordChangeError();
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setPasswordFormError(null);
    setIsPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    if (isChangingPassword) return;

    clearPasswordChangeError();
    setPasswordFormError(null);
    setIsPasswordDialogOpen(false);
  };

  const submitPasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordFormError('Enter your current password.');
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setPasswordFormError('New passwords do not match.');
      return;
    }

    setPasswordFormError(null);
    await changePassword({
      currentPassword,
      password: newPassword,
      passwordConfirmation,
    });
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
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">Security</h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Passwords, verification, and active session controls.
          </p>
        </div>
      </div>

      {/* Password */}
      <GlassCard variant="default" className="mb-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Password</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">Change your password</p>
          </div>
          <Button
            variant="secondary"
            animated={false}
            onClick={openPasswordDialog}
            disabled={isChangingPassword}
          >
            Change
          </Button>
        </div>
      </GlassCard>

      <Dialog open={isPasswordDialogOpen} onOpenChange={closePasswordDialog}>
        <DialogContent ariaLabel="Change password">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Confirm your current password, then choose a new one. You will be signed out after
              the change is complete.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitPasswordChange} className="space-y-4">
            <Input
              id="current-password"
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <Input
              id="new-password"
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              id="confirm-new-password"
              label="Confirm new password"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              autoComplete="new-password"
              error={passwordFormError ?? passwordChangeError ?? undefined}
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={closePasswordDialog}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isChangingPassword}>
                Change password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2FA */}
      <GlassCard variant="default" className="mb-3 p-5">
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
            <Button
              variant="secondary"
              animated={false}
              onClick={() => void refreshStatus()}
              disabled={isLoadingStatus || isMutating}
            >
              Retry status
            </Button>
          ) : (
            <Button
              variant={twoFactorStatus?.enabled ? 'danger' : 'secondary'}
              animated={false}
              onClick={() => void startTwoFactorAction()}
              disabled={twoFactorActionDisabled}
              isLoading={isMutating}
            >
              {twoFactorActionLabel}
            </Button>
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
      <GlassCard variant="default" className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Email Verification</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              {user?.emailVerifiedAt ? 'Your email is verified' : 'Verify your email address'}
            </p>
          </div>
          {!user?.emailVerifiedAt && (
            <Link to="/verify-email" className="cgraph-control cgraph-control-secondary px-4 py-2 text-sm font-medium">
              Verify
            </Link>
          )}
          {user?.emailVerifiedAt && (
            <span className="text-sm font-bold text-primary-400">✓ Verified</span>
          )}
        </div>
      </GlassCard>

      {/* Active Sessions */}
      <GlassCard variant="default" className="mt-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--token-text-primary)]">Active Sessions</h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              Manage your logged-in devices and sessions
            </p>
          </div>
          <Link to="/me/settings/sessions" className="cgraph-control cgraph-control-secondary px-4 py-2 text-sm font-medium">
            View Sessions
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}
