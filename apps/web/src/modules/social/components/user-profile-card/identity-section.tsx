import { memo } from 'react';
import { type TargetAndTransition, type Transition, motion } from 'motion/react';
import { durations } from '@cgraph-dev/animation-constants';

import { cn } from '@/lib/utils';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';

import { BadgeGem } from './badge-gem';
import type { IdentityProps } from './types';
function getTitleAnimationProps(
  animationType: string,
  color: string
): { animate?: TargetAndTransition; transition?: Transition; style?: React.CSSProperties } {
  switch (animationType) {
    case 'fade':
      return {
        animate: { opacity: [0.6, 1, 0.6] },
        transition: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'glow':
      return {
        animate: {
          textShadow: [
            `0 0 2px ${color}`,
            `0 0 8px ${color}, 0 0 16px ${color}`,
            `0 0 2px ${color}`,
          ],
        },
        transition: { duration: durations.ambient.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'pulse':
      return {
        animate: {
          textShadow: [
            `0 0 4px ${color}`,
            `0 0 8px ${color}, 0 0 12px ${color}`,
            `0 0 4px ${color}`,
          ],
        },
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'shimmer':
      return {
        animate: { backgroundPosition: ['200% center', '-200% center'] },
        transition: { duration: durations.cinematic.ms / 1000, repeat: Infinity, ease: 'linear' },
        style: {
          backgroundImage: `linear-gradient(90deg, ${color} 0%, rgba(255,255,255,0.6) 50%, ${color} 100%)`,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        },
      };
    case 'rainbow':
      return {
        animate: { filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] },
        transition: { duration: 4, repeat: Infinity, ease: 'linear' },
      };
    case 'glitch':
      return {
        animate: {
          x: [0, -1, 1, -0.5, 0.5, 0],
          filter: [
            'none',
            'drop-shadow(1px 0 #ff0000) drop-shadow(-1px 0 #00ffff)',
            'drop-shadow(-1px 0 #ff0000) drop-shadow(1px 0 #00ffff)',
            'none',
          ],
        },
        transition: { duration: durations.slower.ms / 1000, repeat: Infinity, repeatDelay: 2 },
      };
    case 'wave':
      return {
        animate: { y: [0, -2, 0, 2, 0] },
        transition: { duration: durations.ambient.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'bounce':
      return {
        animate: { y: [0, -3, 0] },
        transition: { duration: durations.dramatic.ms / 1000, repeat: Infinity, ease: 'easeOut' },
      };
    case 'neon-flicker':
      return {
        animate: {
          opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1],
          textShadow: [
            `0 0 4px ${color}, 0 0 6px ${color}`,
            `0 0 2px ${color}`,
            `0 0 4px ${color}, 0 0 6px ${color}`,
          ],
        },
        transition: {
          duration: durations.loop.ms / 1000,
          repeat: Infinity,
          times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
        },
      };
    default:
      return {};
  }
}
function TitlePill({
  title,
  accentColor,
  titleColor,
  titleAnimationType,
  titleGradient,
  titleLottieUrl,
  titleImageUrl,
}: {
  title: string | null;
  accentColor: string;
  titleColor?: string;
  titleAnimationType?: string;
  titleGradient?: string;
  titleLottieUrl?: string;
  titleImageUrl?: string;
}): React.ReactElement {
  const hasTitle = title !== null;
  const pillColor = hasTitle ? (titleColor ?? accentColor) : accentColor;

  const animProps: ReturnType<typeof getTitleAnimationProps> =
    !hasTitle || !titleAnimationType || titleAnimationType === 'none'
      ? {}
      : getTitleAnimationProps(titleAnimationType, pillColor);

  const {
    style: animStyle,
    animate,
    transition,
  } = animProps;

  // For shimmer, inline style handles colors; otherwise use gradient classes or inline color
  const useGradientClasses = hasTitle && titleGradient && titleAnimationType !== 'shimmer';

  return (
    <div
      className={cn(
        'relative mb-[10px] inline-flex items-center overflow-hidden rounded-full px-[10px] py-[3px]',
        hasTitle ? 'border' : 'border border-white/[0.04] bg-white/[0.025]'
      )}
      style={
        hasTitle
          ? {
              background: `linear-gradient(135deg, color-mix(in srgb, ${pillColor} 14%, transparent) 0%, color-mix(in srgb, ${pillColor} 6%, transparent) 100%)`,
              borderColor: `color-mix(in srgb, ${pillColor} 18%, transparent)`,
              boxShadow: `0 0 12px color-mix(in srgb, ${pillColor} 8%, transparent)`,
            }
          : undefined
      }
    >
      {hasTitle && titleImageUrl ? (
        <img
          src={titleImageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-40%] h-[180%] w-[180%] object-contain opacity-55"
          loading="lazy"
        />
      ) : hasTitle ? (
        <LottieAssetRenderer
          path={titleLottieUrl ?? '/lottie/effects/placeholder.json'}
          fallbackPath="/lottie/effects/placeholder.json"
          label={`${title} title animation`}
          className="pointer-events-none absolute inset-[-65%] opacity-45"
          fallback={null}
        />
      ) : null}
      <motion.span
        className={cn(
          'relative z-10 text-[10px] font-bold uppercase tracking-[0.05em]',
          useGradientClasses ? titleGradient : undefined
        )}
        style={{
          ...(!useGradientClasses && { color: hasTitle ? pillColor : '#3d4d62' }),
          fontFamily: "'Inter', system-ui",
          ...animStyle,
        }}
        animate={animate}
        transition={transition}
      >
        {title ?? 'No Title'}
      </motion.span>
    </div>
  );
}
export const IdentitySection = memo(function IdentitySection({
  title,
  titleColor,
  titleAnimationType,
  titleGradient,
  titleLottieUrl,
  titleImageUrl,
  bio,
  badges,
  accentColor,
  compact,
}: IdentityProps) {
  return (
    <div className="px-[1.1rem] pt-[11px] text-center">
      <TitlePill
        title={title}
        accentColor={accentColor}
        titleColor={titleColor}
        titleAnimationType={titleAnimationType}
        titleGradient={titleGradient}
        titleLottieUrl={titleLottieUrl}
        titleImageUrl={titleImageUrl}
      />

      {!compact && (
        <p
          className={cn(
            'mb-[13px] px-1 text-[0.78rem] font-normal leading-[1.7]',
            bio ? 'text-[#8896b0]' : 'italic text-[#3d4d62]'
          )}
          style={{ fontFamily: "'Inter', system-ui" }}
        >
          {bio || 'Add a bio.'}
        </p>
      )}

      {badges.length > 0 && (
        <div className={cn('mb-1 flex items-center justify-center', compact ? 'gap-1.5' : 'gap-2.5')}>
          {badges.slice(0, compact ? 3 : badges.length).map((badge) => (
            <BadgeGem key={badge.id} badge={badge} prefersReducedMotion={compact} />
          ))}
        </div>
      )}
    </div>
  );
});
