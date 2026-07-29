import { Search, SlidersHorizontal } from 'lucide-react';
import { Input, Select } from '@/components/ui/input';

interface SortOption {
  readonly value: string;
  readonly label: string;
}

interface ExploreFilterBarProps {
  readonly search: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly sort: string;
  readonly sortLabel: string;
  readonly sortOptions: readonly SortOption[];
  readonly onSearchChange: (value: string) => void;
  readonly onSortChange: (value: string) => void;
}

/** Shared search and sort controls for community discovery routes. */
export function ExploreFilterBar({
  search,
  searchLabel,
  searchPlaceholder,
  sort,
  sortLabel,
  sortOptions,
  onSearchChange,
  onSortChange,
}: ExploreFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label={searchLabel}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        leftIcon={<Search className="h-5 w-5" />}
        className="text-sm"
        fullWidth
      />

      <div className="relative shrink-0">
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--token-text-muted)]" />
        <Select
          aria-label={sortLabel}
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          options={sortOptions}
          className="w-full appearance-none pl-9 pr-8 text-sm sm:w-auto"
        />
      </div>
    </div>
  );
}
