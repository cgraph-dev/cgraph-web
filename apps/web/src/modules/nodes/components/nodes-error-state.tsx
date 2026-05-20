import { cn } from '@/lib/utils';

interface NodesErrorStateProps {
  readonly title: string;
  readonly error?: unknown;
  readonly actionLabel?: string;
  readonly className?: string;
  readonly onRetry?: () => void;
}

function getNodesErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Please try again.';
}

/** Render a retryable Nodes failure state. */
export function NodesErrorState({
  title,
  error,
  actionLabel = 'Retry',
  className,
  onRetry,
}: NodesErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-center',
        className
      )}
    >
      <p className="text-sm font-semibold text-red-100">{title}</p>
      <p className="mt-1 text-sm text-red-100/70">{getNodesErrorMessage(error)}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-300/25 bg-red-100/10 px-4 py-2 text-sm font-semibold text-red-50 transition-colors hover:bg-red-100/15"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
