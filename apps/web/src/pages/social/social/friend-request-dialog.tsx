import { type FormEvent, useEffect, useState } from 'react';
import { AtSign, UserPlus, X } from 'lucide-react';

import { Button, IconButton } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';

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
  const normalizedIdentifier = normalizeIdentifier(identifier);
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
      <DialogContent
        ariaLabelledBy="friend-request-title"
        ariaDescribedBy="friend-request-description"
      >
        <DialogHeader className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="cgraph-section-surface flex h-10 w-10 shrink-0 items-center justify-center text-[var(--token-interactive-primary)]"
              data-cgraph-material="recessed"
              aria-hidden="true"
            >
              <UserPlus className="h-5 w-5" />
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
          <IconButton
            icon={<X />}
            onClick={() => onOpenChange(false)}
            className="h-11 w-11 shrink-0"
            label="Close add friend"
          />
        </DialogHeader>

        <form className="pt-4" onSubmit={handleSubmit}>
          <Input
            id="friend-identifier"
            type="text"
            label="Friend identifier"
            value={identifier}
            onChange={(event) => {
              clearError();
              setIdentifier(event.target.value);
            }}
            placeholder="Handle, UID, email, or ID"
            leftIcon={<AtSign className="h-4 w-4" />}
            size="lg"
            autoComplete="off"
            autoFocus
          />

          {error ? (
            <p
              className="cgraph-section-surface mt-3 border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
              data-cgraph-material="recessed"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} animated={false}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              leftIcon={<UserPlus />}
              animated={false}
            >
              {isSubmitting ? 'Sending...' : 'Send request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
