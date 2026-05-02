import { useState, useEffect } from 'react';

const STORAGE_KEY = 'forumSearchHistory';
const MAX_HISTORY_ITEMS = 10;

/** Use Search History.
 */
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem(STORAGE_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  /**
   * Add a search query to history
   */
  const addToHistory = (searchQuery: string) => {
    setSearchHistory((prev) => {
      const newHistory = [searchQuery, ...prev.filter((h) => h !== searchQuery)].slice(
        0,
        MAX_HISTORY_ITEMS
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  /**
   * Generate suggestions from history
   */
  const getSuggestions = (partial: string, limit = 5): string[] => {
    if (!partial) return searchHistory.slice(0, limit);
    return searchHistory
      .filter((h) => h.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, limit);
  };

  /**
   * Clear all history
   */
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    searchHistory,
    addToHistory,
    getSuggestions,
    clearHistory,
  };
}
