/**
 * SearchBar Component - Search input with filter toggle button
 */
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/button';
import type { AdvancedSearchFilters } from './types';

interface SearchBarProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
  handleSearch: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isLoading: boolean;
}

export function SearchBar({
  filters,
  updateFilter,
  handleSearch,
  handleKeyPress,
  isExpanded,
  setIsExpanded,
  isLoading,
}: SearchBarProps) {
  return (
    <div className="border-b border-[var(--token-card-border)] p-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.keywords}
            onChange={(e) => updateFilter('keywords', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search keywords..."
            className="themed-search-input peer w-full rounded-xl py-3 pl-11 pr-4 text-sm backdrop-blur-xl transition-all duration-200 focus:outline-none"
          />
          <MagnifyingGlassIcon className="themed-search-icon pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-200" />
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading || (!filters.keywords.trim() && !filters.author.trim())}
          className="px-6"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-4 py-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-gray-200"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
