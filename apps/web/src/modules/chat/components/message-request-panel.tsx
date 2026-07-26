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
import { Button } from '@/components/ui/button';
import type { MessageRequestController } from '../hooks/use-message-request';

interface MessageRequestPanelProps {
  readonly request: MessageRequestController;
  readonly onDeleted: () => void;
}

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
        <Button
          variant="secondary"
          leftIcon={<RotateCw aria-hidden="true" />}
          className="min-h-11"
          onClick={request.retry}
        >
          Retry
        </Button>
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
            <Button
              variant="danger"
              leftIcon={<Ban aria-hidden="true" />}
              className="min-h-11"
              onClick={() => void request.block()}
              disabled={isProcessing}
            >
              Block
            </Button>
            <Button
              variant="danger"
              leftIcon={<Flag aria-hidden="true" />}
              className="min-h-11"
              onClick={() => void request.blockAndReport()}
              disabled={isProcessing}
            >
              Block &amp; report
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Trash2 aria-hidden="true" />}
              className="min-h-11"
              onClick={() => void handleDelete()}
              disabled={isProcessing}
            >
              Delete
            </Button>
            <Button
              variant="primary"
              leftIcon={<Check aria-hidden="true" />}
              className="min-h-11"
              onClick={() => void request.accept()}
              disabled={isProcessing}
              isLoading={activeAction === 'accept'}
            >
              Accept
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {!details.reportedAsSpam ? (
              <Button
                variant="danger"
                leftIcon={<Flag aria-hidden="true" />}
                className="min-h-11"
                onClick={() => void request.blockAndReport()}
                disabled={isProcessing}
              >
                Report spam
              </Button>
            ) : null}
            <Button
              variant="primary"
              leftIcon={<Unlock aria-hidden="true" />}
              className="min-h-11"
              onClick={() => void request.unblock()}
              disabled={isProcessing}
              isLoading={activeAction === 'unblock'}
            >
              Unblock &amp; accept
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
