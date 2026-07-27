/**
 * MessageSearch Component
 *
 * Main search modal orchestrating state and sub-components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { MessageSearchProps, MessageSearchResult, SearchFilters } from './types';
import {
  loadRecentSearches,
  saveRecentSearch,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
  searchMessages,
} from './utils';
import { SearchHeader } from './search-header';
import { SearchFiltersPanel } from './search-filters-panel';
import { SearchResults } from './search-results';

/**
 * Message search modal component
 */
export function MessageSearch({
  isOpen,
  onClose,
  onResultClick,
  conversationId,
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeControllerRef = useRef<AbortController | null>(null);

  /**
   * Merge `conversationId` (scoping the search to the open thread) into the
   * sibling filter panel so one "sender / date / type" object flows through.
   */
  const effectiveFilters = useMemo<SearchFilters>(
    () => (conversationId ? { ...filters, conversationId } : filters),
    [filters, conversationId]
  );

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Call the backend MeiliSearch endpoint; stale requests are aborted.
   * Short queries (< `SEARCH_MIN_CHARS`) short-circuit so the composer
   * gets instant feedback without the server returning a 400.
   */
  const performSearch = useCallback(
    async (query: string): Promise<void> => {
      const trimmed = query.trim();

      // Abort any in-flight request — the latest keystroke wins.
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }

      if (trimmed.length < SEARCH_MIN_CHARS) {
        setResults([]);
        setIsLoading(false);
        setSearchError(null);
        return;
      }

      const controller = new AbortController();
      activeControllerRef.current = controller;
      setIsLoading(true);
      setSearchError(null);

      try {
        const next = await searchMessages(trimmed, effectiveFilters, controller.signal);
        if (controller.signal.aborted) return;
        setResults(next);
        setRecentSearches((current) => saveRecentSearch(trimmed, current));
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError('Search failed. Try again.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [effectiveFilters]
  );

  // Handle search input change with debounce
  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void performSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  // Abort any in-flight request when the modal unmounts.
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Re-run search when filters change while a query is already active.
  useEffect(() => {
    if (searchQuery.trim().length >= SEARCH_MIN_CHARS) {
      void performSearch(searchQuery);
    }
  }, [effectiveFilters, performSearch, searchQuery]);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // Jump to message
  const handleJumpToMessage = (targetConversationId: string, messageId: string) => {
    if (onResultClick) {
      onResultClick(targetConversationId, messageId);
    }
    onClose();
  };

  // Handle recent search click
  const handleRecentSearchClick = (term: string): void => {
    setSearchQuery(term);
    void performSearch(term);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ariaLabel="Search messages"
        className="flex max-h-[70vh] max-w-lg flex-col overflow-hidden p-0"
      >
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onClose={onClose}
            inputRef={inputRef}
          />

          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />

          {searchError && (
            <div
              role="alert"
              className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300"
            >
              {searchError}
            </div>
          )}

          <SearchResults
            isLoading={isLoading}
            searchQuery={searchQuery}
            results={results}
            recentSearches={recentSearches}
            onJumpToMessage={handleJumpToMessage}
            onRecentSearchClick={handleRecentSearchClick}
          />
      </DialogContent>
    </Dialog>
  );
}

export default MessageSearch;
