/**
 * Reusable 5-star rating component for call quality feedback.
 *
 * Interactive star icons with hover preview, click to select,
 * and keyboard navigation (arrow keys + Enter). Fully accessible
 * with aria-label and role attributes.
 */
import { type ReactNode, useState, useCallback } from 'react';

interface CallQualityStarsProps {
  /** Current selected rating (0 = none selected). */
  readonly rating: number;
  /** Callback when user selects a rating. */
  readonly onRate: (rating: number) => void;
  /** Whether the component is disabled. */
  readonly disabled?: boolean;
}

const STAR_COUNT = 5;

/**
 * Five-star rating input with hover preview and keyboard support.
 */
export function CallQualityStars(props: CallQualityStarsProps): ReactNode {
  const { rating, onRate, disabled = false } = props;
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = useCallback(
    (star: number): void => {
      if (!disabled) setHoverRating(star);
    },
    [disabled]
  );

  const handleMouseLeave = useCallback((): void => {
    setHoverRating(0);
  }, []);

  const handleClick = useCallback(
    (star: number): void => {
      if (!disabled) onRate(star);
    },
    [disabled, onRate]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, star: number): void => {
      if (disabled) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onRate(star);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = Math.min(star + 1, STAR_COUNT);
        onRate(next);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        const prev = Math.max(star - 1, 1);
        onRate(prev);
      }
    },
    [disabled, onRate]
  );

  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rate call quality 1 to 5 stars"
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === rating}
            aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            tabIndex={starValue === rating || (rating === 0 && starValue === 1) ? 0 : -1}
            disabled={disabled}
            className="focus-visible:ring-ring rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
          >
            <svg
              className={`h-8 w-8 transition-colors ${
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40 fill-none'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
