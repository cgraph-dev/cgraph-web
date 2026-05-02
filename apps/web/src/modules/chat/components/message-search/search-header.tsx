import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SearchHeaderProps } from './types';

/**
 * Search header with input field
 */
export function SearchHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onClose,
  inputRef,
}: SearchHeaderProps) {
  return (
    <div className="border-b border-[var(--token-card-border)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Search Messages</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
          <XMarkIcon className="h-5 w-5 text-white/60" />
        </button>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in messages..."
          className="peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2.5 pl-10 pr-10 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:border-primary-500/40 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/20 transition-colors hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchHeader;
