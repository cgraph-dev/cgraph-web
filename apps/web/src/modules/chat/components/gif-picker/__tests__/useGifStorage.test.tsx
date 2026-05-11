import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { useGifStorage } from '../useGifStorage';
import type { GifResult } from '../types';

const sampleGif: GifResult = {
  id: 'gif-1',
  title: 'Release hardening dance',
  url: 'https://example.com/gif.gif',
  previewUrl: 'https://example.com/preview.gif',
  width: 320,
  height: 180,
  source: 'klipy',
};

describe('useGifStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads GIF favorites and recents from schema-versioned CGraph keys', async () => {
    localStorage.setItem('gif-favorites', JSON.stringify([{ ...sampleGif, id: 'legacy' }]));
    localStorage.setItem(STORAGE_KEYS.gifFavorites, JSON.stringify([sampleGif]));
    localStorage.setItem(STORAGE_KEYS.gifRecent, JSON.stringify([{ ...sampleGif, id: 'recent-1' }]));

    const { result } = renderHook(() => useGifStorage());

    await waitFor(() => {
      expect(result.current.favorites).toEqual([sampleGif]);
      expect(result.current.recentlyUsed).toEqual([{ ...sampleGif, id: 'recent-1' }]);
    });
  });

  it('persists GIF favorites and recents to schema-versioned CGraph keys', () => {
    const { result } = renderHook(() => useGifStorage());

    act(() => {
      result.current.toggleFavorite(sampleGif);
      result.current.addToRecent(sampleGif);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.gifFavorites) ?? '[]')).toEqual([
      sampleGif,
    ]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.gifRecent) ?? '[]')).toEqual([sampleGif]);
    expect(localStorage.getItem('gif-favorites')).toBeNull();
    expect(localStorage.getItem('recent-gifs')).toBeNull();
  });
});
