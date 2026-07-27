import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Heart, Search, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { http } from '@/lib/api-client';
import { GIF_CATEGORIES } from './constants';
import { normalizeGifSearchResponse } from './utils';
import { GifItem } from './gif-item';
import { CategoryButton } from './category-button';
import { EmptyState } from './empty-state';
import { useGifStorage } from './useGifStorage';
import type { GifPickerProps, GifResult } from './types';
import { tweens, loop } from '@/lib/animation-presets';

const logger = createLogger('GifPicker');

export function GifPicker({ onSelect, onClose, isOpen, className }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const { favorites, recentlyUsed, toggleFavorite, addToRecent, isFavorite } = useGifStorage();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const fetchGifs = useCallback(async (query: string) => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await http.get('/api/v1/gifs/search', {
        params: { q: query || 'trending', limit: 30 },
        signal: request.signal,
      });

      if (request.signal.aborted) return;
      setGifs(normalizeGifSearchResponse(response.data).gifs);
    } catch (error) {
      if (request.signal.aborted) return;
      logger.warn('GIF search failed:', error);
      setGifs([]);
      setLoadError('GIF search is temporarily unavailable.');
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchGifs(searchQuery);
        setShowFavorites(false);
        setShowRecent(false);
      } else if (!showFavorites && !showRecent) {
        const category = GIF_CATEGORIES.find((c) => c.id === activeCategory);
        fetchGifs(category?.searchTerm || '');
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, activeCategory, fetchGifs, showFavorites, showRecent]);

  function handleCategoryChange(categoryId: string) {
    setActiveCategory(categoryId);
    setSearchQuery('');
    setShowFavorites(false);
    setShowRecent(false);
  }

  function handleSelect(gif: GifResult) {
    addToRecent(gif);
    onSelect(gif);
    onClose();
  }

  const displayGifs = useMemo(() => {
    if (showFavorites) return favorites;
    if (showRecent) return recentlyUsed;
    return gifs;
  }, [showFavorites, showRecent, favorites, recentlyUsed, gifs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const positionClassName = className ?? 'absolute';

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label="GIF picker"
        data-cgraph-material="floating"
        data-cgraph-surface="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          'z-50 w-full max-w-[420px] overflow-hidden border',
          positionClassName
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--token-card-border)] px-4 py-3">
          <h2 className="font-semibold text-[var(--token-text-primary)]">Choose a GIF</h2>
          <IconButton
            icon={<X />}
            label="Close GIF picker"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 flex-none"
          />
        </div>

        <div className="border-b border-[var(--token-card-border)] px-4 py-3">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search KLIPY..."
              aria-label="Search GIFs"
              className="peer w-full rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-[var(--token-text-primary)] transition-colors placeholder:text-[var(--token-text-muted)] focus:border-[var(--token-interactive-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--token-interactive-primary)]"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--token-text-muted)] transition-colors peer-focus:text-[var(--token-interactive-primary)]" />
          </div>
        </div>

        <div className="flex gap-2 border-b border-[var(--token-card-border)] px-4 py-2">
          <Button
            onClick={() => {
              setShowFavorites(!showFavorites);
              setShowRecent(false);
            }}
            variant={showFavorites ? 'secondary' : 'ghost'}
            size="sm"
            animated={false}
            leftIcon={<Heart />}
            aria-pressed={showFavorites}
            className="min-h-8 rounded-md border-transparent px-3 py-1.5 text-xs shadow-none"
          >
            Favorites ({favorites.length})
          </Button>
          <Button
            onClick={() => {
              setShowRecent(!showRecent);
              setShowFavorites(false);
            }}
            variant={showRecent ? 'secondary' : 'ghost'}
            size="sm"
            animated={false}
            leftIcon={<Clock />}
            aria-pressed={showRecent}
            className="min-h-8 rounded-md border-transparent px-3 py-1.5 text-xs shadow-none"
          >
            Recent ({recentlyUsed.length})
          </Button>
        </div>

        {!showFavorites && !showRecent && !searchQuery && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-[var(--token-card-border)] px-4 py-2">
            {GIF_CATEGORIES.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        )}

        <div className="scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-500 h-[350px] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={loop(tweens.slow)}
                className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
              />
            </div>
          ) : loadError && !showFavorites && !showRecent ? (
            <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-[var(--token-text-secondary)]">{loadError}</p>
              <Button
                onClick={() =>
                  void fetchGifs(
                    searchQuery.trim() ||
                      GIF_CATEGORIES.find((category) => category.id === activeCategory)?.searchTerm ||
                      ''
                  )
                }
                variant="secondary"
                size="sm"
                animated={false}
                className="h-9"
              >
                Retry
              </Button>
            </div>
          ) : displayGifs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <EmptyState type={showFavorites ? 'favorites' : showRecent ? 'recent' : 'search'} />
            </div>
          ) : (
            <div role="listbox" aria-label="GIF results" className="columns-2 gap-2 space-y-2">
              {displayGifs.map((gif) => (
                <GifItem
                  key={gif.id}
                  gif={gif}
                  onSelect={handleSelect}
                  isFavorite={isFavorite(gif.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--token-card-border)] px-4 py-2">
          <p className="text-center text-xs text-[var(--token-text-muted)]">
            Powered by{' '}
            <a
              href="https://klipy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--token-interactive-primary)] hover:underline"
            >
              KLIPY
            </a>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GifPicker;
