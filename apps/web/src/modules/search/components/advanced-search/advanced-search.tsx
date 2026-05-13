/**
 * AdvancedSearch Component - Collapsible search form with filters
 */
import { useState} from 'react';
import { useForumStore } from '@/modules/forums/store';
import { cn } from '@/lib/utils';
import type { AdvancedSearchFilters, AdvancedSearchProps } from './types';
import { defaultFilters } from './constants';
import { SearchBar } from './search-bar';
import { FilterPanel } from './filter-panel';

/**
 * Advanced Search component.
 */
export default function AdvancedSearch({
  onSearch,
  isLoading = false,
  className = '',
  defaultExpanded = false,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { forums } = useForumStore();

  const updateFilter = <K extends keyof AdvancedSearchFilters>(key: K, value: AdvancedSearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }

  function handleSearch() {
    if (!filters.keywords.trim() && !filters.author.trim()) {
      return;
    }
    onSearch(filters);
  }

  function handleReset() {
    setFilters(defaultFilters);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)]',
        className
      )}
    >
      <SearchBar
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        handleKeyPress={handleKeyPress}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isLoading={isLoading}
      />

      {isExpanded && (
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          handleSearch={handleSearch}
          handleReset={handleReset}
          isLoading={isLoading}
          forums={forums}
        />
      )}
    </div>
  );
}

export { AdvancedSearch };
