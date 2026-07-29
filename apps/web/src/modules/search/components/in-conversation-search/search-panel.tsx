/**
 * InConversationSearchPanel — Slide-in search panel for message search.
 *
 * Opens from the right side of a conversation view. Provides:
 * - Debounced search input
 * - Filter chips (sender, date, type)
 * - Virtualized result list with highlighted matches
 * - "Jump to" navigation that scrolls conversation to the matching message
 *
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animations/transitions';
import { useConversationSearch } from '../../hooks/useConversationSearch';
import { FilterChips } from './filter-chips';
import { SearchResultItem } from './search-result-item';

interface InConversationSearchPanelProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  participants?: Array<{ id: string; username: string; display_name: string }>;
}

/**
 * In-conversation search panel component.
 */
export function InConversationSearchPanel({
  conversationId,
  isOpen,
  onClose,
  onJumpToMessage,
  participants = [],
}: InConversationSearchPanelProps) {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    total,
    hasMore,
    fetchMore,
    reset,
  } = useConversationSearch(conversationId);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      reset();
    }
  }, [isOpen, reset]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Infinite scroll for results
  function handleScroll() {
    const el = listRef.current;
    if (!el || !hasMore || isLoading) return;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100) {
      fetchMore();
    }
  }

  function handleJumpTo(messageId: string) {
      onJumpToMessage(messageId);
      onClose();
    }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={springs.default}
          className="cgraph-pane absolute inset-y-0 right-0 z-30 flex w-80 flex-col lg:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--token-card-border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Search Messages</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Search input */}
          <div className="px-3 py-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in this conversation..."
                className="themed-search-input peer w-full rounded-xl py-2 pl-10 pr-10 text-sm backdrop-blur-xl transition-all duration-200 focus:outline-none"
              />
              <MagnifyingGlassIcon className="themed-search-icon pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200" />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="themed-search-clear absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips filters={filters} onFiltersChange={setFilters} participants={participants} />

          {/* Results count */}
          {query.length >= 2 && (
            <div className="border-b border-[var(--token-card-border)] px-4 py-1.5">
              <span className="text-[11px] text-gray-500">
                {isLoading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
              </span>
            </div>
          )}

          {/* Result list */}
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
            {results.length === 0 && query.length >= 2 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-600" />
                <p className="mt-2 text-sm text-gray-500">No messages found</p>
                <p className="mt-1 text-xs text-gray-600">Try different keywords or filters</p>
              </div>
            ) : (
              <div className="p-1">
                {results.map((message) => (
                  <SearchResultItem
                    key={message.id}
                    message={message}
                    query={query}
                    onJumpTo={handleJumpTo}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
