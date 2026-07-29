import { LoaderCircle } from 'lucide-react';

function SpinnerMark({ className }: { className: string }) {
  return (
    <LoaderCircle
      className={`${className} text-[var(--token-interactive-primary)] motion-safe:animate-spin`}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

export function InlineLoadingSpinner() {
  return (
    <span role="status" aria-label="Loading" className="inline-flex">
      <SpinnerMark className="h-6 w-6" />
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--token-bg-primary)]"
      role="status"
      aria-label="Loading CGraph"
    >
      <div className="flex flex-col items-center gap-4">
        <SpinnerMark className="h-10 w-10" />
        <span className="text-lg font-semibold text-[var(--token-text-secondary)]">
          CGraph
        </span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
