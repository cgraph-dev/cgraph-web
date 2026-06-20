import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { PulseDotsProps } from './types';

const STAGGER_DELAYS = [0, 0.26, 0.52, 0.78, 1.04] as const;

export const PulseDots = memo(function PulseDots({
  filled,
  tier,
  score,
  prefersReducedMotion,
  compact = false,
}: PulseDotsProps) {
  const isDim = tier === 'Newcomer';

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        compact ? 'mb-3 px-[1rem]' : 'mb-4 px-[1.2rem]'
      )}
    >
      {/* Star dots */}
      <div className={cn('flex items-center', compact ? 'gap-1' : 'gap-1.5')}>
        {Array.from({ length: 5 }, (_, i) => {
          const isOn = i < filled;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center justify-center rounded-full transition-transform duration-200',
                compact ? 'h-4 w-4' : 'h-5 w-5',
                !isOn && 'border border-white/[0.055] bg-white/[0.025]',
              )}
              style={
                isOn
                  ? {
                      background:
                        'linear-gradient(145deg, #c4b8ff 0%, #7c6ef5 40%, #4a3bc8 100%)',
                      boxShadow:
                        '0 0 10px rgba(124,110,245,0.6), 0 0 20px rgba(124,110,245,0.18), inset 0 1.5px 0 rgba(255,255,255,0.22)',
                      animation: prefersReducedMotion
                        ? 'none'
                        : 'pc-dot-pulse 2.8s ease-in-out infinite',
                      animationDelay: `${STAGGER_DELAYS[i]}s`,
                    }
                  : undefined
              }
            >
              <svg
                viewBox="0 0 16 16"
                className={cn('relative z-[1]', compact ? 'h-1.5 w-1.5' : 'h-[7px] w-[7px]')}
                fill={isOn ? 'rgba(255,255,255,0.9)' : 'rgba(45,54,72,0.2)'}
              >
                <path d="M8 1L10 6H15L11 9L13 14L8 11L3 14L5 9L1 6H6Z" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Tier label + score */}
      <div className="text-right">
        <div
          className={cn(
            'font-bold tracking-[0.03em]',
            compact ? 'text-[10px]' : 'text-[11px]',
            isDim ? 'text-[#222c3c]' : 'text-[#7c6ef5]',
          )}
          style={{ fontFamily: "'Inter', system-ui" }}
        >
          {tier}
        </div>
        <div
          className={cn(
            'mt-px tracking-[0.05em] text-[#222c3c]',
            compact ? 'text-[8px]' : 'text-[9px]'
          )}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Score <span className="text-[#3d4d62]">{score}</span>
        </div>
      </div>
    </div>
  );
});
