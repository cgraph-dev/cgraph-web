import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import {
  FAVORITES_KEY,
  RECENT_KEY,
  LEGACY_FAVORITES_KEY,
  LEGACY_RECENT_KEY,
  MAX_FAVORITES,
  MAX_RECENT,
} from './constants';
import type { GifResult } from './types';

const logger = createLogger('useGifStorage');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGifResult(value: unknown): value is GifResult {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.url === 'string' &&
    typeof value.previewUrl === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    (value.source === 'klipy' || value.source === 'tenor' || value.source === 'giphy')
  );
}

function parseStoredGifs(value: string | null): GifResult[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter(isGifResult) : [];
}

function readWithLegacyMigration(key: string, legacyKey: string): GifResult[] {
  const currentValue = localStorage.getItem(key);
  if (currentValue) {
    return parseStoredGifs(currentValue);
  }

  const legacyValue = localStorage.getItem(legacyKey);
  const migrated = parseStoredGifs(legacyValue);
  if (migrated.length > 0) {
    localStorage.setItem(key, JSON.stringify(migrated));
  }
  if (legacyValue !== null) {
    localStorage.removeItem(legacyKey);
  }
  return migrated;
}

/** Use Gif Storage.
 */
export function useGifStorage() {
  const [favorites, setFavorites] = useState<GifResult[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<GifResult[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedFavorites = readWithLegacyMigration(FAVORITES_KEY, LEGACY_FAVORITES_KEY);
      const storedRecent = readWithLegacyMigration(RECENT_KEY, LEGACY_RECENT_KEY);
      if (storedFavorites.length > 0) setFavorites(storedFavorites);
      if (storedRecent.length > 0) setRecentlyUsed(storedRecent);
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
