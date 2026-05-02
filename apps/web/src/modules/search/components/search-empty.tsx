/**
 * SearchEmpty — empty state for search results when no matches found.
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { EmptyState } from '@/shared/components/ui';

interface SearchEmptyProps {
  /** The query string that returned no results. */
  query?: string;
}

/**
 * Empty state shown when a search query returns no results.
 * No CTA button — user should modify their search term.
 */
export function SearchEmpty({ query }: SearchEmptyProps): React.ReactNode {
  return (
    <EmptyState
      title="No results found"
      message={
        query
          ? `No results found for "${query}". Try different keywords.`
          : 'Try different keywords to find what you are looking for.'
      }
      icon={<MagnifyingGlassIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}
