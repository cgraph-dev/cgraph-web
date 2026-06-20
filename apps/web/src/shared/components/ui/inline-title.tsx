/**
 * InlineTitle — renders a user's equipped title with rarity-based styling.
 *
 * Resolves a title ID to its display name and gradient via the shared UI adapter.
 * Supports inline (next to username) and standalone rendering.
 */

import { memo } from 'react';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';
import { cn } from '@/lib/utils';
import { getTitleDisplay, isRareTitle } from './cosmetic-display';

interface InlineTitleProps {
  titleId: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-2.5 py-1',
  md: 'text-base px-3 py-1.5',
  lg: 'text-lg px-4 py-2',
  xl: 'text-xl px-5 py-2.5',
} as const;

const IMAGE_SIZE_CLASSES = {
  xs: 'h-8 w-36',
  sm: 'h-10 w-48',
  md: 'h-14 w-64',
  lg: 'h-16 w-72',
  xl: 'h-20 w-80',
} as const;

export const InlineTitle = memo(function InlineTitle({
  titleId,
  size = 'sm',
  className,
}: InlineTitleProps) {
  if (!titleId) return null;

  const display = getTitleDisplay(titleId);
  if (!display) return null;

  const isSpecial = isRareTitle(titleId);

  if (display.imageUrl) {
    return (
      <span
        className={cn('inline-flex items-center align-middle', IMAGE_SIZE_CLASSES[size], className)}
        title={display.name}
      >
        <img
          src={display.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
          loading="lazy"
        />
        <span className="sr-only">{display.name}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-semibold uppercase tracking-wide',
        'relative overflow-hidden',
        SIZE_CLASSES[size],
        isSpecial
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300'
          : 'bg-purple-500/15 text-purple-300',
        display.gradient,
        className
      )}
    >
      <LottieAssetRenderer
        path={display.lottieUrl}
        fallbackPath="/lottie/effects/placeholder.json"
        label={`${display.name} title animation`}
        className="pointer-events-none absolute inset-[-65%] opacity-45"
        fallback={null}
      />
      {isSpecial && <span className="relative z-10 mr-0.5 text-[10px]">✦</span>}
      <span className="relative z-10">{display.name}</span>
    </span>
  );
});
