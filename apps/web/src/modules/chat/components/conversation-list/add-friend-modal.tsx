import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { AtSymbolIcon, CheckCircleIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useFriendStore } from '@/modules/social/store';
import { FADE_IN } from '@/lib/animations/transitions';
import type { AddFriendModalProps } from './types';

function normalizeFriendIdentifier(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');
  const sendRequest = useFriendStore((state) => state.sendRequest);
  const isLoading = useFriendStore((state) => state.isLoading);
  const error = useFriendStore((state) => state.error);
  const clearError = useFriendStore((state) => state.clearError);

  const normalizedIdentifier = useMemo(() => normalizeFriendIdentifier(identifier), [identifier]);
  const canSubmit = normalizedIdentifier.length >= 2 && !isLoading;

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await sendRequest(normalizedIdentifier);
      setStatus('sent');
      setIdentifier('');
      HapticFeedback.success();
      toast.success('Friend request sent.');
    } catch {
      HapticFeedback.error();
    }
  }

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-400/20 bg-primary-500/10 text-primary-200">
                <UserPlusIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Friend</h2>
                <p className="text-sm text-white/45">Send a request by public handle or account ID.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/35 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close add friend"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {status === 'sent' ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
                Request sent
              </div>
              <p className="mt-2 text-emerald-100/70">
                You can send another request or close this window.
              </p>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/75">Friend identifier</span>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => {
                    setStatus('idle');
                    clearError();
                    setIdentifier(event.target.value);
                  }}
                  placeholder="@username, #UID, email, or user ID"
                  className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-3 pl-10 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/25 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
                  autoFocus
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors peer-focus:text-primary-300" />
              </div>
            </label>

            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2.5 text-sm font-semibold text-white/65 transition-colors hover:bg-[var(--token-card-bg)/0.65] hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={!canSubmit}
                className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </motion.button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
