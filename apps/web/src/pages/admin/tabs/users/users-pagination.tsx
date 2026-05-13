/**
 * Admin users pagination component (cursor-based).
 */
interface UsersPaginationProps {
  hasNext: boolean;
  onLoadMore: () => void;
  totalCount: number;
  loadedCount: number;
}

/**
 * Users Pagination component.
 */
export function UsersPagination({
  hasNext,
  onLoadMore,
  totalCount,
  loadedCount,
}: UsersPaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-[var(--token-card-border)]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {loadedCount} of {totalCount} users
      </p>
      {hasNext && (
        <button
          onClick={onLoadMore}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-[var(--token-card-bg)]"
        >
          Load more
        </button>
      )}
    </div>
  );
}
