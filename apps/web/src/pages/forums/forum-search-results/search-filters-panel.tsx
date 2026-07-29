import type { ForumSearchFilters } from '@/modules/forums/store/forumStore.types';

const TYPE_OPTIONS: ReadonlyArray<{
  readonly value: NonNullable<ForumSearchFilters['type']>;
  readonly label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'thread', label: 'Threads' },
  { value: 'post', label: 'Posts' },
  { value: 'comment', label: 'Comments' },
];

const SORT_OPTIONS: ReadonlyArray<{
  readonly value: NonNullable<ForumSearchFilters['sort']>;
  readonly label: string;
}> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_votes', label: 'Most Votes' },
];

function isSortOption(value: string): value is NonNullable<ForumSearchFilters['sort']> {
  return SORT_OPTIONS.some((option) => option.value === value);
}

interface SearchFiltersPanelProps {
  readonly filters: ForumSearchFilters;
  readonly onFiltersChange: (filters: ForumSearchFilters) => void;
}

export function SearchFiltersPanel({ filters, onFiltersChange }: SearchFiltersPanelProps) {
  const updateFilter = <K extends keyof ForumSearchFilters>(
    key: K,
    value: ForumSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1.5" role="group" aria-label="Result type">
        {TYPE_OPTIONS.map((option) => {
          const isActive = (filters.type ?? 'all') === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFilter('type', option.value)}
              aria-pressed={isActive}
              className={`cgraph-control px-3 py-1 text-xs font-medium ${
                isActive
                  ? 'cgraph-control-primary'
                  : 'cgraph-control-ghost text-[var(--token-text-secondary)]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label htmlFor="forum-search-sort" className="sr-only">
        Sort results
      </label>
      <select
        id="forum-search-sort"
        value={filters.sort ?? 'relevance'}
        onChange={(e) => {
          if (isSortOption(e.target.value)) {
            updateFilter('sort', e.target.value);
          }
        }}
        className="rounded-lg border border-[var(--token-input-border)] bg-[var(--token-input-bg)] px-3 py-1 text-xs text-[var(--token-text-primary)] outline-none focus:border-[var(--token-interactive-primary)] focus:ring-2 focus:ring-[var(--token-focus-ring)]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label htmlFor="forum-search-date-from" className="sr-only">
          Results from date
        </label>
        <input
          id="forum-search-date-from"
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
          className="rounded-lg border border-[var(--token-input-border)] bg-[var(--token-input-bg)] px-2 py-1 text-xs text-[var(--token-text-primary)] outline-none focus:border-[var(--token-interactive-primary)] focus:ring-2 focus:ring-[var(--token-focus-ring)]"
        />
        <span className="text-xs text-[var(--token-text-muted)]" aria-hidden="true">
          to
        </span>
        <label htmlFor="forum-search-date-to" className="sr-only">
          Results to date
        </label>
        <input
          id="forum-search-date-to"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
          className="rounded-lg border border-[var(--token-input-border)] bg-[var(--token-input-bg)] px-2 py-1 text-xs text-[var(--token-text-primary)] outline-none focus:border-[var(--token-interactive-primary)] focus:ring-2 focus:ring-[var(--token-focus-ring)]"
        />
      </div>
    </div>
  );
}

export default SearchFiltersPanel;
