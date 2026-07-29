import type { ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';

interface InlineLoadingSpinnerProps {
  decorative?: boolean;
}

function SpinnerMark(): ReactElement {
  return (
    <LoaderCircle
      className="h-6 w-6 text-[var(--token-interactive-primary)] motion-safe:animate-spin"
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

export function InlineLoadingSpinner({
  decorative = false,
}: InlineLoadingSpinnerProps): ReactElement {
  if (decorative) {
    return (
      <span className="inline-flex" aria-hidden="true">
        <SpinnerMark />
      </span>
    );
  }

  return (
    <span role="status" aria-label="Loading" className="inline-flex">
      <SpinnerMark />
    </span>
  );
}
