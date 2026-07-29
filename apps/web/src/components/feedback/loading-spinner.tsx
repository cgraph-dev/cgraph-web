import type { ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineLoadingSpinnerProps {
  readonly decorative?: boolean;
  readonly label?: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

function SpinnerMark({ size }: { readonly size: keyof typeof SIZE_CLASSES }): ReactElement {
  return (
    <LoaderCircle
      className={cn(
        SIZE_CLASSES[size],
        'text-[var(--token-interactive-primary)] motion-safe:animate-spin'
      )}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

export function InlineLoadingSpinner({
  decorative = false,
  label = 'Loading',
  size = 'md',
}: InlineLoadingSpinnerProps): ReactElement {
  if (decorative) {
    return (
      <span className="inline-flex" aria-hidden="true">
        <SpinnerMark size={size} />
      </span>
    );
  }

  return (
    <span role="status" aria-label={label} className="inline-flex">
      <SpinnerMark size={size} />
    </span>
  );
}
