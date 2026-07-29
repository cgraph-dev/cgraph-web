import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'motion/react';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { staggerConfigs } from '@/lib/animation-presets';
import { GlassCard } from '@/shared/components/ui';
import { SearchResultItem } from './search-result-item';
import type { SearchResult } from './types';

const resultContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.fast.staggerChildren },
  },
};

const resultItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

interface SearchResultsProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly query: string;
  readonly results: readonly SearchResult[];
  readonly suggestions: readonly string[];
  readonly selectedIndex: number;
  readonly primaryColor: string;
  readonly onResultClick: (result: SearchResult) => void;
  readonly onSuggestionClick: (suggestion: string) => void;
}

export function SearchResults({
  isOpen,
  isLoading,
  query,
  results,
  suggestions,
  selectedIndex,
  primaryColor,
  onResultClick,
  onSuggestionClick,
}: SearchResultsProps) {
  const showDropdown = isOpen && (query.length >= 2 || suggestions.length > 0);

  return (
    <AnimatePresence>
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 right-0 z-50 mt-2"
        >
          <GlassCard variant="frosted" className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : results.length > 0 ? (
              <motion.div
                className="divide-y divide-[var(--token-border-subtle)]"
                variants={resultContainer}
                initial="hidden"
                animate="show"
              >
                {results.map((result, index) => (
                  <motion.div key={result.id} variants={resultItem}>
                    <SearchResultItem
                      result={result}
                      index={index}
                      isSelected={index === selectedIndex}
                      primaryColor={primaryColor}
                      onClick={() => onResultClick(result)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : query.length >= 2 ? (
              <NoResultsState query={query} />
            ) : suggestions.length > 0 ? (
              <SuggestionsState suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
            ) : null}
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 p-4 text-[var(--token-text-secondary)]">
      <InlineLoadingSpinner label="Searching forums" />
      <p className="text-sm">Searching...</p>
    </div>
  );
}

function NoResultsState({ query }: { readonly query: string }) {
  return (
    <div className="p-6 text-center text-[var(--token-text-secondary)]">
      <MagnifyingGlassIcon className="mx-auto mb-2 h-10 w-10 opacity-50" />
      <p>No results found for "{query}"</p>
      <p className="mt-1 text-sm text-[var(--token-text-muted)]">
        Try different keywords or filters
      </p>
    </div>
  );
}

function SuggestionsState({
  suggestions,
  onSuggestionClick,
}: {
  readonly suggestions: readonly string[];
  readonly onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div>
      <div className="px-3 py-2 text-xs uppercase text-[var(--token-text-muted)]">
        Recent Searches
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          onClick={() => onSuggestionClick(suggestion)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-[var(--token-text-primary)] transition-colors hover:bg-[var(--token-interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--token-focus-ring)]"
        >
          <ClockIcon className="h-4 w-4 text-[var(--token-text-muted)]" aria-hidden="true" />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
