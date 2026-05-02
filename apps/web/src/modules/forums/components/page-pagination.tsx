/**
 * Page Pagination — Classic forum page navigation
 *
 * Displays: « 1 2 3 ... 42 »
 * Supports: page jumping, "Page X of Y" indicator
 * Works with cursor pagination under the hood (page → cursor translation).
 */

import { motion } from 'motion/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export function PagePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PagePaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {/* Previous */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.95 }}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
          currentPage <= 1
            ? 'cursor-not-allowed text-gray-600'
            : 'text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white'
        )}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </motion.button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-600">
            …
          </span>
        ) : (
          <motion.button
            key={page}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(page)}
            className={cn(
              'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white'
            )}
          >
            {page}
          </motion.button>
        )
      )}

      {/* Next */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.95 }}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
          currentPage >= totalPages
            ? 'cursor-not-allowed text-gray-600'
            : 'text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white'
        )}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </motion.button>

      {/* Page indicator */}
      <span className="ml-3 text-xs text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}

export default PagePagination;
