/**
 * ThemedBorderCard Component
 *
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
 * Renders Lottie animations when a border has a lottieFile URL.
 */

import { motion } from 'motion/react';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { LottieBorderRenderer } from '@/lib/lottie/lottie-border-renderer';
import { RARITY_COLORS } from '@/data/avatar-borders';
import type { ThemedBorderCardProps } from './types';
import { SIZE_CONFIG } from './constants';
import { getBorderAnimation } from './animations';
import { CornerBrackets } from './corner-brackets';
import { tweens, loop } from '@/lib/animation-presets';

/** Avatar size in px for each card size */
const AVATAR_PX: Record<string, number> = { sm: 48, md: 64, lg: 96 };

/**
 * Themed Border Card display component.
 */
export default function ThemedBorderCard({
  border,
  isSelected,
  onSelect,
  showAnimation = true,
  size = 'md',
  allowPreview = true,
}: ThemedBorderCardProps) {
  const config = SIZE_CONFIG[size];
  const rarityColor = RARITY_COLORS[border.rarity] ?? RARITY_COLORS.common;
  const isLocked = !border.unlocked && !allowPreview;
  const canInteract = !isLocked;

  const borderAnimation = getBorderAnimation(border, showAnimation);

  return (
    <motion.button
      onClick={() => canInteract && onSelect()}
      className={`relative ${config.container} group flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-300 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${
        isSelected ? 'ring-2 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'hover:ring-1 hover:ring-white/20'
      } border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)]`}
      whileHover={canInteract ? { y: -1 } : {}}
      whileTap={canInteract ? { y: 0 } : {}}
    >
      {/* Corner brackets for selection */}
      {isSelected && <CornerBrackets color={border.colors[0] || '#fff'} />}

      {/* Avatar preview with animated border — Lottie or CSS fallback */}
      {border.lottieFile && showAnimation ? (
        <LottieBorderRenderer
          lottieUrl={border.lottieFile}
          avatarSize={Math.round((AVATAR_PX[size] ?? 64) * 0.65)}
          borderWidth={Math.round((AVATAR_PX[size] ?? 64) * 0.18)}
          fallbackColor={border.colors[0]}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--token-bg-secondary)]">
            <span className="text-2xl">👤</span>
          </div>
        </LottieBorderRenderer>
      ) : (
        <motion.div
          className={`${config.avatar} relative overflow-visible rounded-full`}
          style={{
            background: `linear-gradient(135deg, ${border.colors.join(', ')})`,
            padding: '3px',
            ...borderAnimation.style,
          }}
          animate={borderAnimation.animate}
          transition={borderAnimation.transition}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--token-bg-secondary)]">
            <span className="text-2xl">👤</span>
          </div>
        </motion.div>
      )}

      {/* Border name */}
      <span className={`${config.text} w-full truncate text-center font-medium text-white/60`}>
        {border.name}
      </span>

      {/* Rarity badge */}
      <div
        className={`${config.badge} rounded-full py-0.5 font-semibold uppercase tracking-wider ${rarityColor.bg} ${rarityColor.text}`}
      >
        {border.rarity}
      </div>

      {/* Lock badge — small corner indicator so the animated preview stays visible */}
      {!border.unlocked && (
        <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
          <LockClosedIcon className="h-3 w-3 text-[var(--token-text-muted)]" />
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && border.unlocked && (
        <motion.div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: border.colors[0] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckIcon className="h-3 w-3 text-[var(--token-bg-primary)]" />
        </motion.div>
      )}

      {/* Premium indicator */}
      {border.isPremium && border.unlocked && (
        <motion.div
          className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={loop(tweens.ambient)}
        >
          <SparklesIcon className="h-3 w-3 text-[var(--token-bg-primary)]" />
        </motion.div>
      )}
    </motion.button>
  );
}
