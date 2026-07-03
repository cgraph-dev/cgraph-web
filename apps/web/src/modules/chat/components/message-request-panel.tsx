import type { ReactNode } from 'react';
import {
  Ban,
  Check,
  Flag,
  LoaderCircle,
  RotateCw,
  ShieldAlert,
  Trash2,
  Unlock,
} from 'lucide-react';
import type { MessageRequestController } from '../hooks/use-message-request';

interface MessageRequestPanelProps {
  readonly request: MessageRequestController;
  readonly onDeleted: () => void;
}

const ACTION_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Conversation bottom panel for pending and blocked message requests.
 *
 * S1G keeps the normal composer unavailable until the request is accepted or
 * unblocked. CGraph preserves that behavior while using its validated REST
 * actions and route-local state.
 */
export function MessageRequestPanel({
  request,
  onDeleted,
}: MessageRequestPanelProps): ReactNode {
  const { status, details, activeAction, error } = request;
  const isProcessing = activeAction !== null;

  async function handleDelete(): Promise<void> {
    if (await request.deleteRequest()) {
      onDeleted();
    }
  }

  if (status === 'loading') {
    return (
      <section
        className="flex min-h-24 flex-shrink-0 items-center justify-center gap-3 border-t border-border bg-background px-4 py-5 text-sm text-muted-foreground"
        aria-live="polite"
        aria-busy="true"
      >
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        Checking conversation access
      </section>
    );
  }

  if (status === 'accepted' || status === 'rejected') {
    return null;
  }

  if (status === 'error' || !details) {
    return (
      <section
        className="flex min-h-24 flex-shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border bg-background px-4 py-4"
        role="alert"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Request state unavailable</p>
            <p className="truncate text-xs text-muted-foreground">
              {error ?? 'The conversation request could not be loaded.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`${ACTION_CLASS} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
          onClick={request.retry}
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    );
  }

  if (status !== 'pending' && status !== 'blocked') {
    return null;
  }

  const requesterName = details.requesterName;

  return (
    <section
      className="flex-shrink-0 border-t border-border bg-background px-4 py-4"
      aria-labelledby="message-request-title"
      aria-busy={isProcessing}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {details.requesterAvatar ? (
            <img
              src={details.requesterAvatar}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-hidden="true"
            >
              {requesterName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              id="message-request-title"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <ShieldAlert
                className="h-4 w-4 flex-shrink-0 text-amber-500"
                aria-hidden="true"
              />
              {status === 'blocked' ? 'Conversation blocked' : 'Review request carefully'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status === 'blocked'
                ? `Unblock ${requesterName} to accept this conversation.`
                : `Let ${requesterName} message you? They will not know you read their messages until you accept.`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {details.sharedGroupCount > 0
                ? `${details.sharedGroupCount} shared group${
                    details.sharedGroupCount === 1 ? '' : 's'
                  }`
                : 'No shared groups'}
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {status === 'pending' ? (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <button
              type="button"
              className={`${ACTION_CLASS} bg-secondary text-destructive hover:bg-destructive/10`}
              onClick={() => void request.block()}
              disabled={isProcessing}
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
              Block
            </button>
            <button
              type="button"
              className={`${ACTION_CLASS} bg-secondary text-destructive hover:bg-destructive/10`}
              onClick={() => void request.blockAndReport()}
              disabled={isProcessing}
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Block &amp; report
            </button>
            <button
              type="button"
              className={`${ACTION_CLASS} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
              onClick={() => void handleDelete()}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
            <button
              type="button"
              className={`${ACTION_CLASS} bg-primary text-primary-foreground hover:bg-primary/90`}
              onClick={() => void request.accept()}
              disabled={isProcessing}
            >
              {activeAction === 'accept' ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              Accept
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {!details.reportedAsSpam ? (
              <button
                type="button"
                className={`${ACTION_CLASS} bg-secondary text-destructive hover:bg-destructive/10`}
                onClick={() => void request.blockAndReport()}
                disabled={isProcessing}
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                Report spam
              </button>
            ) : null}
            <button
              type="button"
              className={`${ACTION_CLASS} bg-primary text-primary-foreground hover:bg-primary/90`}
              onClick={() => void request.unblock()}
              disabled={isProcessing}
            >
              {activeAction === 'unblock' ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Unlock className="h-4 w-4" aria-hidden="true" />
              )}
              Unblock &amp; accept
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
