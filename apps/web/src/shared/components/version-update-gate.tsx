import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VersionUpdateGateProps {
  readonly onReload: () => void;
}

/** Blocks the app when the backend requires a newer compiled web release. */
export function VersionUpdateGate({ onReload }: VersionUpdateGateProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[var(--token-bg-primary)] p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="version-update-title"
      aria-describedby="version-update-description"
    >
      <section className="w-full max-w-sm rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-6 text-center shadow-2xl">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--token-bg-tertiary)] text-[var(--token-interactive-primary)]"
          aria-hidden="true"
        >
          <RefreshCw className="h-5 w-5" />
        </div>
        <h1 id="version-update-title" className="mt-4 text-lg font-semibold text-[var(--token-text-primary)]">
          Update required
        </h1>
        <p id="version-update-description" className="mt-2 text-sm text-[var(--token-text-secondary)]">
          Reload CGraph to continue.
        </p>
        <Button
          type="button"
          className="mt-6"
          leftIcon={<RefreshCw aria-hidden="true" />}
          onClick={onReload}
          autoFocus
        >
          Reload
        </Button>
      </section>
    </div>
  );
}
