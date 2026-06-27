/**
 * DeleteAccount - Elite self-service account deletion with immersive visual feedback
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api as http } from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens, springs, entranceVariants } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

/**
 * Delete Account component.
 */
export function DeleteAccount() {
  const { logout } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [error, setError] = useState('');

  const canDelete = password.length > 0 && confirmText === 'DELETE';

  // Haptic feedback when validation is met
  useEffect(() => {
    if (canDelete) {
      HapticFeedback.selection();
    }
  }, [canDelete]);

  const handleDelete = async () => {
    if (!canDelete) return;
    HapticFeedback.heavy();
    setIsDeleting(true);
    setError('');

    try {
      await http.post('/api/v1/me/delete-account', { password });
      logout();
    } catch (err: unknown) {
      const errMsg =
        getErrorMessage(err) || 'Failed to delete account. Please check your password.';
      setError(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    HapticFeedback.light();
    setIsCancelling(true);
    setError('');
    setCancelMessage('');

    try {
      const response = await http.delete('/api/v1/me/delete-account');
      const message =
        typeof response.data?.message === 'string'
          ? response.data.message
          : 'Account deletion cancelled.';
      setCancelMessage(message);
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err) || 'No pending account deletion could be cancelled.';
      setError(errMsg);
    } finally {
      setIsCancelling(false);
    }
  };

  const consequences = [
    'All your chats, groups, and contacts will be permanently deleted.',
    'Your unique user ID and custom tags will be released.',
    'Any active subscriptions will be immediately terminated.',
    'There is a 30-day grace period where you can restore your account by logging back in.',
  ];

  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, y: -20 }}
      transition={tweens.standard}
      className="relative space-y-6"
    >
      {/* Immersive Background Aurora (Red-tinted) */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-red-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[300px] w-[300px] rounded-full bg-rose-500/5 blur-[100px]" />

      <div className="relative z-10">
        <h1 className="mb-1 bg-gradient-to-r from-red-400 via-rose-300 to-red-400 bg-clip-text text-2xl font-black text-transparent">
          Delete My Account
        </h1>
        <p className="text-sm font-medium text-[var(--token-text-muted)]">
          This action is permanent and cannot be undone
        </p>
      </div>

      <GlassCard className="relative z-10 overflow-hidden border border-red-500/20 bg-red-950/5 p-6 backdrop-blur-2xl">
        {/* Holographic Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ff0000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Danger accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        <div className="flex items-start gap-5">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px 0px rgba(239,68,68,0)',
                '0 0 20px 2px rgba(239,68,68,0.2)',
                '0 0 0px 0px rgba(239,68,68,0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 shadow-inner shadow-red-500/5 ring-1 ring-red-500/20"
          >
            <ExclamationTriangleIcon className="h-7 w-7" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-black tracking-tight text-red-400">Danger Zone</h2>
            <p className="mt-1 text-sm font-medium text-[var(--token-text-secondary)]">
              Once you initiate the deletion process, your account will be marked for removal.
            </p>

            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
              className="mt-6 space-y-3"
            >
              {consequences.map((text, i) => (
                <motion.li
                  key={i}
                  variants={entranceVariants.fadeRight}
                  className="flex items-start gap-3 text-sm text-[var(--token-text-muted)]"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i === 3 ? 'bg-yellow-500/60 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-red-500/60'}`}
                  />
                  <span className={i === 3 ? 'text-[var(--token-text-secondary)]' : ''}>
                    {i === 3 ? (
                      <>
                        There is a{' '}
                        <span className="font-bold text-[var(--token-text-primary)] underline decoration-yellow-500/30 underline-offset-4">
                          30-day grace period
                        </span>{' '}
                        where you can restore your account by logging back in.
                      </>
                    ) : (
                      text
                    )}
                  </span>
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-semibold text-yellow-100">Already scheduled deletion?</p>
              <p className="mt-1 text-xs text-yellow-100/70">
                You can cancel a pending deletion during the grace period.
              </p>
              <button
                type="button"
                onClick={handleCancelDeletion}
                disabled={isCancelling}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-yellow-100 transition-colors hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-yellow-100/20 border-t-yellow-100" />
                ) : (
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                )}
                Cancel Pending Deletion
              </button>
              {cancelMessage && (
                <p className="mt-3 text-xs font-bold text-green-300">{cancelMessage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          {!showConfirm ? (
            <motion.button
              whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                HapticFeedback.light();
                setShowConfirm(true);
              }}
              className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-red-500/20 px-6 py-3 text-sm font-black uppercase tracking-wider text-red-400 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all"
            >
              Start Deletion Process
            </motion.button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={springs.smooth}
                className="space-y-6 pt-4"
              >
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--token-text-muted)]">
                    Confirm Identity
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3.5 text-[var(--token-text-primary)] outline-none ring-0 transition-all placeholder:text-[var(--token-text-muted)] focus:border-red-500/40 focus:bg-red-500/[0.03] focus:shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--token-text-muted)]">
                    Security Key: <span className="font-mono text-red-500/60">DELETE</span>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3.5 font-mono text-[var(--token-text-primary)] outline-none ring-0 transition-all placeholder:text-[var(--token-text-muted)] focus:border-red-500/40 focus:bg-red-500/[0.03] focus:shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      HapticFeedback.light();
                      setShowConfirm(false);
                      setPassword('');
                      setConfirmText('');
                      setError('');
                    }}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--token-text-muted)] transition-all hover:scale-[1.02] hover:bg-[var(--token-bg-secondary)] hover:text-[var(--token-text-primary)] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={canDelete ? { boxShadow: '0 0 20px rgba(234,68,68,0.3)' } : {}}
                    whileTap={canDelete ? { scale: 0.88 } : {}}
                    onClick={handleDelete}
                    disabled={!canDelete || isDeleting}
                    className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-600 px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_8px_32px_rgba(220,38,38,0.3)] transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-20 disabled:shadow-none disabled:grayscale"
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Deleting...
                      </div>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                        Final Confirmation
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default DeleteAccount;
