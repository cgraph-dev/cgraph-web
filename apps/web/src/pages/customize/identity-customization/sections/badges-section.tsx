/**
 * BadgesSection Component
 *
 * Displays the badges selection grid with equipped badges management.
 */

import { motion } from 'motion/react';
import { LockClosedIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';
import type { Badge, Rarity } from '../types';
import { tweens } from '@/lib/animation-presets';

export interface BadgesSectionProps {
  badges: Badge[];
  equippedBadges: readonly string[];
  onToggle: (badgeId: string, badge: Badge) => void;
  getRarityColor: (rarity: Rarity) => string;
}

/**
 */
/**
 * Badges Section component.
 */
export function BadgesSection({
  badges,
  equippedBadges,
  onToggle,
  getRarityColor,
}: BadgesSectionProps) {
  const isMaxEquipped = equippedBadges.length >= 5;

  function renderBadgeIcon(badge: Badge, className: string) {
    if (badge.animationType === 'lottie' && badge.lottieUrl) {
      return (
        <span className={className}>
          <LottieAssetRenderer
            path={badge.lottieUrl}
            fallbackPath="/lottie/effects/placeholder.json"
            label={`${badge.name} animation`}
            className="pointer-events-none absolute inset-[-35%] z-0 opacity-70"
            fallback={null}
          />
          <span className="relative z-10 select-none leading-none">{badge.icon}</span>
        </span>
      );
    }

    return <span className={className}>{badge.icon}</span>;
  }

  return (
    <div>
      {/* Equipped Badges Display */}
      <GlassCard
        variant="holographic"
        className="aurora-social-panel mb-8 overflow-hidden rounded-2xl p-6 shadow-2xl backdrop-blur-3xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="border-primary-400/20 from-primary-500/16 via-violet-500/14 to-primary-400/8 ring-primary-400/10 flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-r text-primary-200 ring-1">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--token-text-primary)]">
                Equipped Badges
              </h3>
              <p className="text-xs text-[var(--token-text-muted)]">
                Select up to 5 badges to show on your profile
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
              isMaxEquipped
                ? 'bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)] ring-1 ring-yellow-500/30'
                : 'bg-white/6 text-white/60 ring-1 ring-white/10'
            }`}
          >
            <span>{equippedBadges.length} / 5</span>
            {isMaxEquipped && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] tracking-widest"
              >
                MAX
              </motion.span>
            )}
          </div>
        </div>

        {/* Progress bar for equipped badges */}
        <div className="relative mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-white/[0.05]">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isMaxEquipped
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                : 'bg-gradient-to-r from-primary-500 via-violet-500 to-primary-400 shadow-[0_0_12px_rgba(76,29,149,0.3)]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(equippedBadges.length / 5) * 100}%` }}
            transition={tweens.standard}
          />
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => {
            const badgeId = equippedBadges[index];
            const badge = badges.find((b) => b.id === badgeId);
            const isSlotFilled = !!badge;

            return (
              <motion.div
                key={index}
                className={`group relative flex aspect-square items-center justify-center rounded-2xl border transition-all duration-300 ${
                  isSlotFilled
                    ? 'border-primary-400/25 from-primary-500/14 via-violet-500/10 to-primary-400/8 bg-gradient-to-r shadow-[0_8px_16px_rgba(0,0,0,0.2)]'
                    : isMaxEquipped
                      ? 'border-dashed border-white/10 bg-white/5 opacity-40'
                      : 'border-dashed border-white/10 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]'
                }`}
                whileHover={isSlotFilled ? { y: -3, scale: 1.05 } : undefined}
                transition={tweens.fast}
              >
                {badge ? (
                  <>
                    {renderBadgeIcon(
                      badge,
                      'relative flex h-12 w-12 items-center justify-center text-4xl drop-shadow-lg'
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(badge.id, badge);
                      }}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/90 text-white opacity-0 shadow-xl transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    {/* Badge name tooltip */}
                    <div className="pointer-events-none absolute -bottom-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-opacity group-hover:opacity-100">
                      {badge.name}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-20 transition-opacity group-hover:opacity-40">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Open</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {isMaxEquipped && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center text-xs text-yellow-400/80"
          >
            ⚠️ Maximum badges equipped! Remove one to add another.
          </motion.p>
        )}
      </GlassCard>

      {/* Available Badges Grid */}
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge, index) => {
          const isEquipped = equippedBadges.includes(badge.id);
          const canEquip = badge.unlocked && !isEquipped && !isMaxEquipped;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <GlassCard
                variant={badge.unlocked ? 'crystal' : ('frosted' as const)}
                glow={isEquipped}
                glowColor={isEquipped ? 'rgba(76, 29, 149, 0.35)' : undefined}
                className={`relative p-4 transition-all ${
                  isEquipped ? 'ring-[var(--token-interactive-primary)]/50 ring-2' : ''
                } ${
                  canEquip
                    ? 'cursor-pointer'
                    : isEquipped
                      ? 'cursor-pointer'
                      : badge.unlocked && isMaxEquipped
                        ? 'cursor-not-allowed opacity-70'
                        : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => onToggle(badge.id, badge)}
              >
                {/* Max equipped indicator for available badges */}
                {badge.unlocked && !isEquipped && isMaxEquipped && (
                  <div className="absolute right-2 top-2 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                    MAX
                  </div>
                )}

                {/* Badge Icon */}
                <div className="mb-3 flex justify-center text-5xl">
                  {renderBadgeIcon(
                    badge,
                    'relative flex h-14 w-14 items-center justify-center text-5xl leading-none'
                  )}
                </div>

                {/* Badge Name */}
                <h4 className="mb-1 truncate text-center text-sm font-semibold text-[var(--token-text-primary)]">
                  {badge.name}
                </h4>

                {/* Badge Description */}
                <p className="mb-2 line-clamp-2 text-center text-xs text-[var(--token-text-muted)]">
                  {badge.description}
                </p>

                {/* Rarity */}
                <p className={`mb-2 text-center text-xs ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                </p>

                {/* Status */}
                {badge.unlocked ? (
                  isEquipped ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-primary-200">
                      <CheckCircleIconSolid className="h-4 w-4" />
                      <span>Equipped</span>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-primary-200">Click to equip</div>
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                    <LockClosedIcon className="mb-2 h-8 w-8 text-[var(--token-text-muted)]" />
                    <p className="px-2 text-center text-xs text-[var(--token-text-muted)]">
                      {badge.unlockRequirement}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}

        {badges.length === 0 && (
          <div className="col-span-3 py-12 text-center text-[var(--token-text-muted)]">
            No badges found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
