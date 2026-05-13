/**
 * TitlesSection Component
 *
 * Displays the titles selection list with animations.
 */

import { durations } from '@cgraph/animation-constants';
import { useState } from 'react';
import { motion } from 'motion/react';
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import type { Title } from '../types';
import type { TitleAnimationType } from '@/data/titlesCollection';

export interface TitlesSectionProps {
  titles: Title[];
  selectedTitle: string | null;
  previewingTitle: string | null;
  onEquip: (titleId: string, title: Title) => void;
}

/**
 * Animated title text component with all 11 animation types
 */
function AnimatedTitleText({
  name,
  animationType,
  gradient,
}: {
  name: string;
  animationType: TitleAnimationType;
  gradient: string;
}) {
  // Base text styling
  const baseClass = `text-lg font-bold ${gradient}`;

  // Animation variants for different title animations
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'fade':
        return {
          animate: { opacity: [0.5, 1, 0.5] },
          transition: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'glow':
        return {
          animate: {
            textShadow: [
              '0 0 4px currentColor',
              '0 0 20px currentColor, 0 0 40px currentColor',
              '0 0 4px currentColor',
            ],
          },
          transition: {
            duration: durations.ambient.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'pulse':
        return {
          animate: {
            textShadow: [
              '0 0 10px currentColor',
              '0 0 20px currentColor, 0 0 30px currentColor',
              '0 0 10px currentColor',
            ],
          },
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'shimmer':
        return {
          animate: {
            backgroundPosition: ['200% center', '-200% center'],
          },
          transition: { duration: durations.cinematic.ms / 1000, repeat: Infinity, ease: 'linear' },
          style: {
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%), ${gradient}`,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          },
        };
      case 'rainbow':
        return {
          animate: {
            filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'linear' },
        };
      case 'typing':
        return {
          animate: { width: ['0%', '100%', '100%', '0%'] },
          transition: { duration: 4, repeat: Infinity, times: [0, 0.4, 0.6, 1] },
          style: { overflow: 'hidden', whiteSpace: 'nowrap' as const },
        };
      case 'glitch':
        return {
          animate: {
            x: [0, -2, 2, -1, 1, 0],
            filter: [
              'none',
              'drop-shadow(2px 0 #ff0000) drop-shadow(-2px 0 #00ffff)',
              'drop-shadow(-2px 0 #ff0000) drop-shadow(2px 0 #00ffff)',
              'none',
            ],
          },
          transition: { duration: durations.slower.ms / 1000, repeat: Infinity, repeatDelay: 2 },
        };
      case 'wave':
        return {
          animate: { y: [0, -4, 0, 4, 0] },
          transition: {
            duration: durations.ambient.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'bounce':
        return {
          animate: { y: [0, -8, 0] },
          transition: { duration: durations.dramatic.ms / 1000, repeat: Infinity, ease: 'easeOut' },
        };
      case 'neon-flicker':
        return {
          animate: {
            opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1],
            textShadow: [
              '0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor',
              '0 0 4px currentColor',
              '0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor',
            ],
          },
          transition: {
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
          },
        };
      case 'none':
      default:
        return {};
    }
  };

  const animProps: Record<string, unknown> = getAnimationVariants();

  return (
    <motion.h4 className={baseClass} {...animProps}>
      {name}
    </motion.h4>
  );
}

/**
 */
/**
 * Titles Section section component.
 */
export function TitlesSection({
  titles,
  selectedTitle,
  previewingTitle,
  onEquip,
}: TitlesSectionProps) {
  const [showAnimations, setShowAnimations] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <label className="group flex cursor-pointer items-center gap-3">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={showAnimations}
              onChange={(e) => setShowAnimations(e.target.checked)}
              className="peer sr-only"
            />
            <div className="aurora-social-toggle h-4 w-8 rounded-full border-0 backdrop-blur-md" />
            <div className="aurora-social-toggle-thumb absolute left-[2px] top-[2px] h-3 w-3 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-tight text-[var(--token-text-muted)] transition-colors group-hover:text-[var(--token-text-secondary)]">
            SHOW ANIMATIONS
          </span>
        </label>
        <div className="rounded-full border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] px-3 py-1 text-[10px] font-bold tracking-widest text-[var(--token-text-muted)] backdrop-blur-md">
          {titles.length} TITLES
        </div>
      </div>

      <div className="space-y-3">
        {titles.map((title, index) => {
          const isSelected = selectedTitle === title.id;
          const isPreviewing = previewingTitle === title.id;
          const isActive = isSelected || isPreviewing;

          return (
            <motion.div
              key={title.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 + 0.1 }}
            >
              <div
                onClick={() => onEquip(title.id, title)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-500 ${
                  isActive
                    ? 'border-primary-400/30 from-primary-500/18 via-violet-500/14 to-primary-400/10 ring-primary-500/20 bg-gradient-to-r ring-2'
                    : 'aurora-social-option hover:bg-white/6 hover:border-white/15'
                }`}
              >
                {/* Visual backdrop for active item */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    {showAnimations ? (
                      <AnimatedTitleText
                        name={title.name}
                        animationType={title.animationType}
                        gradient={title.gradient}
                      />
                    ) : (
                      <h4 className={`text-xl font-bold ${title.gradient}`}>{title.name}</h4>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-[var(--token-text-muted)]">
                        {title.animationType.toUpperCase()} ANIMATION
                      </span>
                      {!title.unlocked && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--token-text-muted)]">
                          <LockClosedIcon className="h-3 w-3" />
                          {title.unlockRequirement?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {title.unlocked ? (
                      isSelected ? (
                        <div className="bg-[var(--token-interactive-primary)]/20 flex h-10 w-10 items-center justify-center rounded-full text-[var(--token-interactive-primary)]">
                          <CheckCircleIconSolid className="h-6 w-6" />
                        </div>
                      ) : (
                        <Button
                          variant="glass"
                          className="aurora-social-button h-10 rounded-xl px-6 font-bold tracking-tight text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEquip(title.id, title);
                          }}
                        >
                          EQUIP
                        </Button>
                      )
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${
                            isPreviewing
                              ? 'border-primary-400/30 from-primary-500/18 via-violet-500/14 to-primary-400/10 bg-gradient-to-r text-primary-200'
                              : 'aurora-social-option text-white/55 group-hover:text-white/75'
                          }`}
                        >
                          <EyeIcon className="h-4 w-4" />
                          {isPreviewing ? 'PREVIEWING' : 'PREVIEW'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {titles.length === 0 && (
          <div className="py-12 text-center text-[var(--token-text-muted)]">
            No titles found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
