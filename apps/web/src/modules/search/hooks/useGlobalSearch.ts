/**
 * Global Search Hook
 *
 * Hook for command-palette-style global search with keyboard shortcuts.
 *
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchStore } from '../store';

/**
 * Hook for global search (command palette style)
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    search,
    loadMore,
    clearResults,
    query,
    setQuery,
    isLoading,
    isLoadingMore,
    hasMore,
    users,
    groups,
    forums,
  } = useSearchStore();

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    clearResults();
    setQuery('');
  }, [clearResults, setQuery]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [close, isOpen, open]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return {
    isOpen,
    query,
    isLoading,
    results: { users, groups, forums },
    open,
    close,
    toggle,
    setQuery,
    search,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}
