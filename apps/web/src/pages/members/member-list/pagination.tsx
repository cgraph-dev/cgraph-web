/**
 * Pagination component - cursor-based navigation controls
 */

interface PaginationProps {
  hasNextPage: boolean;
  onNext: () => void;
  isLoading?: boolean;
}

/**
 * Pagination component.
 */
export function Pagination({ hasNextPage, onNext, isLoading }: PaginationProps) {
  if (!hasNextPage) return null;

  return (
    <div className="border-border flex items-center justify-end border-t px-4 py-3">
      <button
        onClick={onNext}
        disabled={isLoading}
        className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
