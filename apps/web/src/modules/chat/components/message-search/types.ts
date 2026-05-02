import type { RefObject } from 'react';

/**
 * Individual search result
 */
export interface MessageSearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  highlightedContent: string;
  createdAt: string;
  messageType: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  conversationId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: string;
}

export interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick?: (conversationId: string, messageId: string) => void;
  conversationId?: string;
  className?: string;
}

export interface SearchResultCardProps {
  result: MessageSearchResult;
  onJumpToMessage: (conversationId: string, messageId: string) => void;
}

export interface SearchFiltersPanelProps {
  filters: SearchFilters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFiltersChange: (filters: SearchFilters) => void;
}

export interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export interface SearchResultsProps {
  isLoading: boolean;
  searchQuery: string;
  results: MessageSearchResult[];
  recentSearches: string[];
  onJumpToMessage: (conversationId: string, messageId: string) => void;
  onRecentSearchClick: (term: string) => void;
}
