import { memo } from 'react';

import { cn } from '@/lib/utils';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';

import { BADGE_RARITY_CONFIG } from './constants';
import type { ProfileBadge } from './types';

interface BadgeGemProps {
  badge: ProfileBadge;
  prefersReducedMotion?: boolean;
}

const HOVER_BY_RARITY: Record<string, string> = {
  legendary: 'hover:scale-[1.14] hover:-translate-y-[5px]',
  epic: 'hover:scale-[1.14] hover:-translate-y-1',
  rare: 'hover:scale-[1.14] hover:-translate-y-1',
};

function getFaceAnimation(rarity: string, noAnim: boolean): string | undefined {
  if (noAnim) return undefined;
  switch (rarity) {
    case 'legendary':
      return 'pc-gem-gold-glow 2.6s ease-in-out infinite';
    case 'epic':
      return 'pc-gem-epic-glow 3s ease-in-out infinite';
    case 'rare':
      return 'pc-gem-rare-glow 4.5s ease-in-out infinite';
    default:
      return undefined;
  }
}

export const BadgeGem = memo(function BadgeGem({ badge, prefersReducedMotion }: BadgeGemProps) {
  const config = BADGE_RARITY_CONFIG[badge.rarity];
  const isDim = badge.rarity === 'dim';
  const isLegendary = badge.rarity === 'legendary';
  const isEpic = badge.rarity === 'epic';
  const noAnim = isDim || !!prefersReducedMotion;

  return (
    <div
      className={cn('group/gem relative', isDim && 'opacity-[0.16]')}
      data-badge-id={badge.id}
      style={!noAnim && config.animation ? { animation: config.animation } : undefined}
      title={badge.tooltipLabel ?? badge.name}
    >
      {/* Crystal face */}
      <div
        className={cn(
          'relative flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-xl border',
          'transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          HOVER_BY_RARITY[badge.rarity]
        )}
        style={{
          background: config.faceBg,
          borderColor: config.borderColor,
          animation: getFaceAnimation(badge.rarity, noAnim),
        }}
      >
        {/* Specular highlight (top 52%) */}
        {!isDim && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[52%]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)',
              borderRadius: '12px 12px 50% 50%',
            }}
          />
        )}

        {/* Epic scan gradient sweep */}
        {isEpic && !prefersReducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, transparent 30%, rgba(124,110,245,0.12) 50%, transparent 70%)',
              backgroundSize: '250% 250%',
              animation: 'pc-gem-epic-scan 2.8s ease-in-out infinite',
            }}
          />
        )}

        {/* Crystal facet lines */}
        {!isDim && (
          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(145deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%), linear-gradient(245deg, transparent 40%, rgba(255,255,255,0.3) 48%, transparent 56%)',
            }}
          />
        )}

        {/* Badge art, animation, and fallback icon */}
        {badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt=""
            className="relative z-[3] h-[34px] w-[34px] object-contain drop-shadow-lg"
            loading="lazy"
          />
        ) : badge.animationType === 'lottie' && badge.lottieUrl ? (
          <LottieAssetRenderer
            path={badge.lottieUrl}
            fallbackPath="/lottie/effects/placeholder.json"
            label={`${badge.name} animation`}
            className="pointer-events-none absolute inset-[-28%] z-[2] opacity-75"
            fallback={null}
          />
        ) : null}
        {!badge.imageUrl && (
          <span className="relative z-[3] select-none text-[18px] leading-none">{badge.icon}</span>
        )}
      </div>

      {/* Legendary orbiting particle */}
      {isLegendary && !prefersReducedMotion && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[4]"
          style={{ animation: 'pc-gem-orbit 2.6s linear infinite' }}
        >
          <div
            className="h-[5px] w-[5px] rounded-full"
            style={{
              background: 'radial-gradient(circle, #e8a020, transparent)',
              boxShadow: '0 0 6px 1px rgba(232,160,32,0.5)',
            }}
          />
        </div>
      )}
    </div>
  );
});
