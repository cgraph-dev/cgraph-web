import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/ui/button';
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
    <div className="border-b border-[var(--product-line)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">Search messages</h2>
        <IconButton icon={<XMarkIcon />} label="Close search" size="sm" onClick={onClose} />
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in messages..."
          className="cgraph-field peer w-full pl-10 pr-10 text-sm"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        {searchQuery && (
          <IconButton
            icon={<XMarkIcon />}
            label="Clear search"
            size="sm"
            onClick={onClearSearch}
            className="absolute right-1 top-1/2 h-8 min-h-8 w-8 min-w-8 -translate-y-1/2"
          />
        )}
      </div>
    </div>
  );
}

export default SearchHeader;
