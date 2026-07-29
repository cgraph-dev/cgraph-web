import type { ReactElement } from 'react';
import Skeleton from '@/components/ui/skeleton';

interface ConversationLoadingStateProps {
  readonly label?: string;
}

/** Stable loading geometry shared by routed conversation surfaces. */
export function ConversationLoadingState({
  label = 'Loading conversation',
}: ConversationLoadingStateProps): ReactElement {
  return (
    <div
      className="cgraph-workspace flex min-h-0 flex-1 flex-col bg-[var(--token-bg-primary)]"
      role="status"
      aria-label={label}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--token-card-border)] px-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton variant="text" width={160} />
          <Skeleton variant="text" width={88} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-5">
        <Skeleton shape="message" count={6} />
      </div>
      <footer className="shrink-0 border-t border-[var(--token-card-border)] p-3">
        <Skeleton variant="rectangular" height={44} />
      </footer>
    </div>
  );
}
