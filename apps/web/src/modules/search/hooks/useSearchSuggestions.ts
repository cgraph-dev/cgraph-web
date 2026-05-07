import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';

function parseStringArray(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? parsed : [];
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.searchRecent);
    if (stored) {
      try {
        setRecentSearches(parseStringArray(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Generate suggestions based on input
  function updateSuggestions(query: string) {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    // Filter recent searches that match the query
    const matchingRecent = recentSearches.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(matchingRecent.slice(0, 5));
  }

  function clearSuggestions() {
    setSuggestions([]);
  }

  function addRecentSearch(query: string) {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.searchRecent, JSON.stringify(updated));
      return updated;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEYS.searchRecent);
  }

  function removeRecentSearch(query: string) {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem(STORAGE_KEYS.searchRecent, JSON.stringify(updated));
      return updated;
    });
  }

  return {
    suggestions,
    recentSearches,
    updateSuggestions,
    clearSuggestions,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
