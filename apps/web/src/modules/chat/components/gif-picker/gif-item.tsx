import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import type { GifItemProps } from './types';

/**
 * Gif Item component.
 */
export function GifItem({ gif, onSelect, isFavorite, onToggleFavorite }: GifItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const selectGif = () => onSelect(gif);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select GIF ${gif.title}`}
      className="relative cursor-pointer overflow-hidden rounded-lg bg-[var(--token-bg-secondary)]"
      style={{ aspectRatio: gif.width / gif.height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={selectGif}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectGif();
        }
      }}
    >
      {/* Skeleton loader */}
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-[var(--token-card-bg)]" />}

      {/* GIF Image */}
      <img
        src={isHovered ? gif.url : gif.previewUrl}
        alt={gif.title}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Hover overlay with favorite button */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/40">
          <button
            type="button"
            aria-label={isFavorite ? 'Remove GIF from favorites' : 'Add GIF to favorites'}
            aria-pressed={isFavorite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(gif);
            }}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 transition-colors hover:bg-black/70"
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-4 w-4 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
