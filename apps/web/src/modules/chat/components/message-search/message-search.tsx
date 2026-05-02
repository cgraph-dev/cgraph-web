/**
 * MessageSearch Component
 *
 * Main search modal orchestrating state and sub-components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import { FADE_IN } from '@/lib/animations/transitions';

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

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        {...FADE_IN}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--token-card-border)] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageSearch;
