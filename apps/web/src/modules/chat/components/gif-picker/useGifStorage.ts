import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { FAVORITES_KEY, RECENT_KEY, MAX_FAVORITES, MAX_RECENT } from './constants';
import type { GifResult } from './types';

const logger = createLogger('useGifStorage');

/** Use Gif Storage.
 */
export function useGifStorage() {
  const [favorites, setFavorites] = useState<GifResult[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<GifResult[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      const storedRecent = localStorage.getItem(RECENT_KEY);
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedRecent) setRecentlyUsed(JSON.parse(storedRecent));
    } catch (error) {
      logger.warn('Failed to load GIF preferences:', error);
    }
  }, []);

  // Save favorites
  const saveFavorites = (newFavorites: GifResult[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  // Save recent
  const saveRecent = (newRecent: GifResult[]) => {
    setRecentlyUsed(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
  };

  // Toggle favorite
  const toggleFavorite = (gif: GifResult) => {
    const isFav = favorites.some((f) => f.id === gif.id);
    if (isFav) {
      saveFavorites(favorites.filter((f) => f.id !== gif.id));
    } else {
      saveFavorites([gif, ...favorites].slice(0, MAX_FAVORITES));
    }
  };

  // Add to recent
  const addToRecent = (gif: GifResult) => {
    const newRecent = [gif, ...recentlyUsed.filter((g) => g.id !== gif.id)].slice(0, MAX_RECENT);
    saveRecent(newRecent);
  };

  // Check if favorite
  const isFavorite = (gifId: string) => favorites.some((f) => f.id === gifId);

  return {
    favorites,
    recentlyUsed,
    toggleFavorite,
    addToRecent,
    isFavorite,
  };
}
