/**
 * ThemedBorderCard Component
 *
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
 * Renders Lottie animations when a border has a lottieFile URL.
 */

import { motion } from 'motion/react';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { getAvatarBorderDisplayTypeById, RARITY_COLORS } from '@/data/avatar-borders';
import type { ThemedBorderCardProps } from './types';
import { SIZE_CONFIG } from './constants';
import { CornerBrackets } from './corner-brackets';
import { tweens, loop } from '@/lib/animation-presets';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import type { AvatarBorderConfig } from '@/types/avatar-borders';

const PREVIEW_SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 42, md: 56, lg: 76 };
type RendererBorderConfig = AvatarBorderConfig & { imageUrl?: string };

function renderAvatarPlaceholder() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-[#071d35] shadow-inner shadow-black/40">
      <span className="absolute left-1/2 top-[22%] h-[30%] w-[30%] -translate-x-1/2 rounded-full bg-sky-500" />
      <span className="absolute bottom-[15%] left-1/2 h-[34%] w-[58%] -translate-x-1/2 rounded-t-full bg-sky-500" />
    </div>
  );
}

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
  const rendererBorder: RendererBorderConfig = {
    id: border.id,
    type: getAvatarBorderDisplayTypeById(border.id),
    name: border.name,
    description: border.description,
    theme: border.theme,
    rarity: border.rarity,
    unlockType: border.unlocked ? 'default' : 'subscription',
    primaryColor: border.colors[0] ?? '#38bdf8',
    secondaryColor: border.colors[1],
    accentColor: border.colors[2] ?? border.colors[0] ?? '#38bdf8',
    isPremium: border.isPremium,
    previewUrl: border.previewUrl,
    imageUrl: border.imageUrl,
    lottieUrl: border.lottieFile,
    tags: [],
  };

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

      <AvatarBorderRenderer
        border={rendererBorder}
        size={PREVIEW_SIZE_PX[size]}
        interactive={false}
        reducedMotion={!showAnimation}
      >
        {renderAvatarPlaceholder()}
      </AvatarBorderRenderer>

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
