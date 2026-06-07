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
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1 py-0.5',
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
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
      {display.imageUrl ? (
        <img
          src={display.imageUrl}
          alt=""
          className="pointer-events-none absolute inset-x-[-20%] bottom-[-55%] h-[150%] w-[140%] object-contain opacity-65"
          loading="lazy"
        />
      ) : (
        <LottieAssetRenderer
          path={display.lottieUrl}
          fallbackPath="/lottie/effects/placeholder.json"
          label={`${display.name} title animation`}
          className="pointer-events-none absolute inset-[-65%] opacity-45"
          fallback={null}
        />
      )}
      {isSpecial && <span className="relative z-10 mr-0.5 text-[10px]">✦</span>}
      <span className="relative z-10">{display.name}</span>
    </span>
  );
});
