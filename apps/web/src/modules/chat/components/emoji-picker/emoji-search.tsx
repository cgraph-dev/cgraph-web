/**
 * Search input component for emoji picker
 */

import { Search, X } from 'lucide-react';
import { IconButton } from '@/components/ui/button';

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
          aria-label="Search emoji"
          className="peer w-full rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] py-2 pl-9 pr-9 text-sm text-[var(--token-text-primary)] transition-colors placeholder:text-[var(--token-text-muted)] focus:border-[var(--token-interactive-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--token-interactive-primary)]"
        />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--token-text-muted)] transition-colors peer-focus:text-[var(--token-interactive-primary)]" />
        {searchQuery && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            <IconButton
              icon={<X />}
              label="Clear emoji search"
              size="sm"
              onClick={() => onSearchChange('')}
              className="h-8 w-8 border-transparent shadow-none"
            />
          </span>
        )}
      </div>
    </div>
  );
}
