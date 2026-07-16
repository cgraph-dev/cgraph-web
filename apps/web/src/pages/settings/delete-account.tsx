import { useEffect, useRef, useState } from 'react';
import type { AccountDeletionResponse } from '@cgraph-dev/api-client';
import { CheckCircle2, LoaderCircle, Trash2, TriangleAlert } from 'lucide-react';
import { Button, Dialog, DialogContent } from '@/shared/components/ui';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/modules/auth/store';

type CleanupStatus = 'idle' | 'running' | 'complete' | 'failed';

function formatServerTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatGracePeriod(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Request permanent account anonymization through the server-owned lifecycle. */
export function DeleteAccount() {
  const logout = useAuthStore((state) => state.logout);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState<AccountDeletionResponse | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus>('idle');
  const [error, setError] = useState('');

  const canSubmit = password.length > 0 && confirmation === 'DELETE' && !isSubmitting;

  useEffect(() => {
    if (isConfirming && !accepted && !isSubmitting) {
      passwordRef.current?.focus();
    }
  }, [accepted, isConfirming, isSubmitting]);

  const openConfirmation = () => {
    setPassword('');
    setConfirmation('');
    setAccepted(null);
    setCleanupStatus('idle');
    setError('');
    setIsConfirming(true);
  };

  const closeConfirmation = () => {
    if (isSubmitting) return;

    setIsConfirming(false);
    setPassword('');
    setConfirmation('');
    setAccepted(null);
    setCleanupStatus('idle');
    setError('');
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError('');
    let requestAccepted = false;

    try {
      const result = await apiClient.accountDeletion.request({ password });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      requestAccepted = true;
      setAccepted(result.data);
      setPassword('');
      setConfirmation('');
      setCleanupStatus('running');

      await logout();
      setCleanupStatus('complete');
    } catch {
      if (requestAccepted) {
        setCleanupStatus('failed');
      } else {
        setError('The request could not be submitted. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const keepFocusInConfirmation = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Tab') return;

    const lastControl = canSubmit ? submitRef.current : cancelRef.current;

    if (event.shiftKey && document.activeElement === passwordRef.current) {
      event.preventDefault();
      lastControl?.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      passwordRef.current?.focus();
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="delete-account-heading">
      <header>
        <h1
          id="delete-account-heading"
          className="text-2xl font-bold text-[var(--token-text-primary)]"
        >
          Delete account
        </h1>
        <p className="mt-1 text-sm text-[var(--token-text-muted)]">
          Request permanent anonymization of your CGraph account.
        </p>
      </header>

      <div className="border-y border-red-500/25 py-5">
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
              What happens after the request
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--token-text-secondary)]">
              <li>Your account is deactivated and active sessions are signed out.</li>
              <li>
                CGraph permanently anonymizes the account after the grace period returned by the
                server.
              </li>
              <li>
                Messages may remain under an anonymized identity to preserve conversation
                integrity.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-l-2 border-[var(--token-interactive-primary)] pl-4">
        <h2 className="text-sm font-semibold text-[var(--token-text-primary)]">
          Recovery during the grace period
        </h2>
        <p className="mt-1 text-sm text-[var(--token-text-muted)]">
          Successfully signing in before the server-provided deadline cancels the pending
          anonymization. There is no separate cancellation button.
        </p>
      </div>

      <Button
        ref={triggerRef}
        type="button"
        variant="danger"
        animated={false}
        leftIcon={<Trash2 aria-hidden="true" />}
        onClick={openConfirmation}
        className="!border-red-500/40 !bg-red-600 !text-white !shadow-none !backdrop-blur-none hover:!bg-red-500"
      >
        Request account deletion
      </Button>

      <Dialog
        open={isConfirming}
        onOpenChange={(open) => {
          if (!open) closeConfirmation();
        }}
      >
        <DialogContent
          ariaLabelledBy="delete-account-dialog-title"
          ariaDescribedBy="delete-account-dialog-description"
          className="!max-w-lg !rounded-lg !border-red-500/30 !bg-[var(--token-bg-primary)] !p-5 sm:!p-6"
        >
          <div aria-busy={isSubmitting}>
            <h2
              id="delete-account-dialog-title"
              className="text-lg font-semibold text-[var(--token-text-primary)]"
            >
              Confirm account deletion
            </h2>
            <p
              id="delete-account-dialog-description"
              className="mt-1 text-sm text-[var(--token-text-secondary)]"
            >
              Enter your current password and type DELETE. The server request is sent before local
              account data is cleared.
            </p>

            {accepted ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3" role="status" aria-live="polite">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[var(--token-text-primary)]">
                      {accepted.already_pending
                        ? 'Deletion request was already pending'
                        : 'Deletion request accepted'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--token-text-muted)]">
                      {accepted.message}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-3 border-y border-[var(--token-card-border)] py-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--token-text-muted)]">Requested</dt>
                    <dd className="mt-1 font-medium text-[var(--token-text-primary)]">
                      <time dateTime={accepted.requested_at}>
                        {formatServerTime(accepted.requested_at)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--token-text-muted)]">Permanent anonymization</dt>
                    <dd className="mt-1 font-medium text-[var(--token-text-primary)]">
                      <time dateTime={accepted.hard_delete_at}>
                        {formatServerTime(accepted.hard_delete_at)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--token-text-muted)]">Server grace period</dt>
                    <dd className="mt-1 font-medium text-[var(--token-text-primary)]">
                      {formatGracePeriod(accepted.grace_period_days)}
                    </dd>
                  </div>
                </dl>

                {cleanupStatus === 'failed' ? (
                  <p className="text-sm text-red-300" role="alert">
                    The request was accepted, but local sign-out did not finish. Reload the app to
                    clear this session.
                  </p>
                ) : (
                  <p
                    className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]"
                    role="status"
                    aria-live="polite"
                  >
                    {cleanupStatus === 'running' && (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {cleanupStatus === 'complete'
                      ? 'Local account data cleared.'
                      : 'Signing out and clearing local account data...'}
                  </p>
                )}
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={handleDelete}
                onKeyDown={keepFocusInConfirmation}
                noValidate
              >
                <fieldset className="space-y-4" disabled={isSubmitting}>
                  <div>
                    <label
                      htmlFor="delete-account-password"
                      className="text-sm font-medium text-[var(--token-text-primary)]"
                    >
                      Current password
                    </label>
                    <input
                      ref={passwordRef}
                      id="delete-account-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-describedby="delete-account-password-help"
                      className="mt-2 w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2.5 text-[var(--token-text-primary)] outline-none placeholder:text-[var(--token-text-muted)] focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/30"
                    />
                    <p
                      id="delete-account-password-help"
                      className="mt-1.5 text-xs text-[var(--token-text-secondary)]"
                    >
                      Your password is required before the request can be accepted.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="delete-account-confirmation"
                      className="text-sm font-medium text-[var(--token-text-primary)]"
                    >
                      Type DELETE to confirm
                    </label>
                    <input
                      id="delete-account-confirmation"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2.5 font-mono text-[var(--token-text-primary)] outline-none placeholder:text-[var(--token-text-muted)] focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/30"
                    />
                  </div>
                </fieldset>

                {error && (
                  <p
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button
                    ref={cancelRef}
                    type="button"
                    variant="ghost"
                    animated={false}
                    onClick={closeConfirmation}
                    disabled={isSubmitting}
                    className="!shadow-none !backdrop-blur-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    ref={submitRef}
                    type="submit"
                    variant="danger"
                    animated={false}
                    disabled={!canSubmit}
                    leftIcon={
                      isSubmitting ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 aria-hidden="true" />
                      )
                    }
                    className="!border-red-500/40 !bg-red-600 !text-white !shadow-none !backdrop-blur-none hover:!bg-red-500"
                  >
                    {isSubmitting ? 'Submitting request...' : 'Request deletion'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default DeleteAccount;
