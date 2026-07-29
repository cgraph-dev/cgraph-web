/**
 * ConversationListHeader component
 */

import { Plus, Search } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import type { FilterType } from './types';
import { FILTER_OPTIONS } from './constants';

interface ConversationListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onNewChat: () => void;
}

/**
 */
/**
 * Conversation List Header component.
 */
export function ConversationListHeader({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onNewChat,
}: ConversationListHeaderProps) {
  return (
    <div className="border-b border-[var(--token-border-muted)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">Messages</h2>
        <IconButton
          icon={<Plus />}
          label="New conversation"
          size="sm"
          variant="primary"
          className="h-9 min-h-9 w-9 min-w-9 p-0"
          onClick={onNewChat}
        />
      </div>

      <div className="cgraph-search-field relative">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search messages"
          className="cgraph-field w-full pl-10 pr-4 text-sm"
        />
        <Search
          aria-hidden="true"
          className="cgraph-search-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        />
      </div>

      <div className="cgraph-segmented mt-3 flex w-full">
        {FILTER_OPTIONS.map((f) => (
          <button
            type="button"
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            aria-pressed={filter === f.id}
            data-active={filter === f.id || undefined}
            className="min-w-0 flex-1 px-2 text-xs font-medium"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
