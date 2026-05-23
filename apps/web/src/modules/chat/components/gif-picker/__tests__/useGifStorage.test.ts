import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  FAVORITES_KEY,
  LEGACY_FAVORITES_KEY,
  LEGACY_RECENT_KEY,
  RECENT_KEY,
} from '../constants';
import { useGifStorage } from '../useGifStorage';
import type { GifResult } from '../types';

const favoriteGif: GifResult = {
  id: 'favorite-gif',
  title: 'Favorite GIF',
  url: 'https://example.com/favorite.gif',
  previewUrl: 'https://example.com/favorite-preview.gif',
  width: 320,
  height: 180,
  source: 'klipy',
};

const recentGif: GifResult = {
  id: 'recent-gif',
  title: 'Recent GIF',
  url: 'https://example.com/recent.gif',
  previewUrl: 'https://example.com/recent-preview.gif',
  width: 320,
  height: 180,
  source: 'klipy',
};

describe('useGifStorage', () => {
  beforeEach(() => {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(RECENT_KEY);
    localStorage.removeItem(LEGACY_FAVORITES_KEY);
    localStorage.removeItem(LEGACY_RECENT_KEY);
  });

  it('migrates legacy GIF preference keys to schema-versioned keys', async () => {
    localStorage.setItem(LEGACY_FAVORITES_KEY, JSON.stringify([favoriteGif]));
    localStorage.setItem(LEGACY_RECENT_KEY, JSON.stringify([recentGif]));

    const { result } = renderHook(() => useGifStorage());

    await waitFor(() => {
      expect(result.current.favorites).toEqual([favoriteGif]);
      expect(result.current.recentlyUsed).toEqual([recentGif]);
    });

    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')).toEqual([favoriteGif]);
    expect(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')).toEqual([recentGif]);
    expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_RECENT_KEY)).toBeNull();
  });

  it('persists future GIF changes only to schema-versioned keys', async () => {
    const { result } = renderHook(() => useGifStorage());

    act(() => {
      result.current.toggleFavorite(favoriteGif);
      result.current.addToRecent(recentGif);
    });

    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')).toEqual([favoriteGif]);
    expect(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')).toEqual([recentGif]);
    expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_RECENT_KEY)).toBeNull();
  });
});
