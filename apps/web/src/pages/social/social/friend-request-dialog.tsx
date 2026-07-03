import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AtSymbolIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useFriendStore } from '@/modules/social/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FriendRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeIdentifier(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;
}

export function FriendRequestDialog({ open, onOpenChange }: FriendRequestDialogProps) {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sendRequest = useFriendStore((state) => state.sendRequest);
  const error = useFriendStore((state) => state.error);
  const clearError = useFriendStore((state) => state.clearError);
  const normalizedIdentifier = useMemo(() => normalizeIdentifier(identifier), [identifier]);
  const canSubmit = normalizedIdentifier.length >= 2 && !isSubmitting;

  useEffect(() => {
    if (!open) return;
    setIdentifier('');
    setIsSubmitting(false);
    clearError();
  }, [clearError, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    clearError();
    try {
      await sendRequest(normalizedIdentifier);
      HapticFeedback.success();
      onOpenChange(false);
    } catch {
      HapticFeedback.error();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-request-title"
          aria-describedby="friend-request-description"
        >
          <DialogHeader className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/12 text-primary-300">
                <UserPlusIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div id="friend-request-title">
                  <DialogTitle>Add friend</DialogTitle>
                </div>
                <div id="friend-request-description">
                  <DialogDescription>
                    Enter a public handle, UID, email, or account ID.
                  </DialogDescription>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              aria-label="Close add friend"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-white/75" htmlFor="friend-identifier">
              Friend identifier
            </label>
            <div className="relative mt-2">
              <AtSymbolIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="friend-identifier"
                type="text"
                value={identifier}
                onChange={(event) => {
                  clearError();
                  setIdentifier(event.target.value);
                }}
                placeholder="@handle, #UID, email, or account ID"
                className="h-11 w-full rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/25"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-lg border border-[var(--token-border-muted)] px-4 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-11 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send request'}
              </button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
