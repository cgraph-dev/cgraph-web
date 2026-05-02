/**
 * Search input component for emoji picker
 */

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EmojiSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function EmojiSearch({ searchQuery, onSearchChange }: EmojiSearchProps) {
  return (
    <div className="border-b border-[var(--token-card-border)] p-3">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emojis..."
          className="peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2 pl-9 pr-8 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:border-primary-500/40 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
