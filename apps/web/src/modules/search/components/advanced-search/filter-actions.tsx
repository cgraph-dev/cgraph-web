/**
 * FilterActions – reset / results-per-page / search button row
 */
import Button from '@/components/ui/button';
import type { AdvancedSearchFilters } from '@/modules/search/components/advanced-search/types';

interface FilterActionsProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
  handleSearch: () => void;
  handleReset: () => void;
  isLoading: boolean;
}

const RESULTS_PER_PAGE_OPTIONS = [10, 25, 50] as const satisfies readonly AdvancedSearchFilters['resultsPerPage'][];

function parseResultsPerPage(value: string): AdvancedSearchFilters['resultsPerPage'] | null {
  const parsed = Number(value);
  const match = RESULTS_PER_PAGE_OPTIONS.find((option) => option === parsed);
  return match ?? null;
}

/**
 * Filter Actions component.
 */
export function FilterActions({
  filters,
  updateFilter,
  handleSearch,
  handleReset,
  isLoading,
}: FilterActionsProps) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--token-card-border)] pt-4">
      <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-200">
        Reset filters
      </button>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          Results per page:
          <select
            value={filters.resultsPerPage}
            onChange={(e) => {
              const nextValue = parseResultsPerPage(e.target.value);
              if (nextValue) {
                updateFilter('resultsPerPage', nextValue);
              }
            }}
            className="rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-2 py-1 text-gray-200"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <Button onClick={handleSearch} disabled={isLoading}>
          Search
        </Button>
      </div>
    </div>
  );
}
