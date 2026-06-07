/**
 * ProfileThemeCard Component
 *
 * Profile theme preview card with static themed surfaces,
 * tier badges, and selection states.
 */

import type React from 'react';
import { motion } from 'motion/react';
import { useRef } from 'react';
import type { ProfileThemeCardProps } from './types';
import TierBadge from './tier-badge';
import PreviewCard from './preview-card';
import LockOverlay from './lock-overlay';
import SelectedIndicator from './selected-indicator';
import type { ProfileThemeConfig } from '@/data/profileThemes';

function getStaticPatternStyle(theme: ProfileThemeConfig): React.CSSProperties {
  const accent = theme.accentPrimary;
  const secondary = theme.accentSecondary;

  switch (theme.surfacePattern) {
    case 'scanline':
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0 7px, rgba(255,255,255,0.06) 7px 8px), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
    case 'glass':
      return {
        backgroundImage: `radial-gradient(circle at 18% 12%, ${accent}55, transparent 32%), radial-gradient(circle at 82% 24%, ${secondary}45, transparent 30%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
    case 'terminal-grid':
      return {
        backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
        backgroundSize: '18px 18px, 18px 18px, auto',
      };
    case 'canopy':
      return {
        backgroundImage: `radial-gradient(ellipse at 25% 10%, ${secondary}45, transparent 35%), linear-gradient(115deg, transparent 0 42%, ${accent}22 42% 46%, transparent 46% 100%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
    case 'starfield':
      return {
        backgroundImage: `radial-gradient(circle at 22% 24%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 18%, ${secondary}aa 0 1px, transparent 1.5px), radial-gradient(circle at 58% 72%, ${accent}aa 0 1px, transparent 1.5px), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
    case 'petal-wash':
      return {
        backgroundImage: `radial-gradient(ellipse at 20% 18%, ${secondary}55, transparent 30%), radial-gradient(ellipse at 72% 70%, ${accent}44, transparent 32%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
    case 'forge':
      return {
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 18px), radial-gradient(circle at 50% 100%, ${accent}55, transparent 38%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      };
  }
}

/**
 * Profile Theme Card display component.
 */
export default function ProfileThemeCard({
  theme,
  isSelected,
  onSelect,
  allowPreview = true,
}: ProfileThemeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const isLocked = !theme.unlocked && !allowPreview;
  const canInteract = !isLocked;

  return (
    <motion.div
      ref={cardRef}
      onClick={() => canInteract && onSelect()}
      role="button"
      tabIndex={canInteract ? 0 : -1}
      onKeyDown={(e) => e.key === 'Enter' && canInteract && onSelect()}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl transition-all duration-300 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed'} ${isSelected ? 'shadow-2xl ring-2 ring-[var(--token-interactive-primary)]' : 'hover:ring-1 hover:ring-[var(--token-card-border)]'} `}
      whileHover={canInteract ? { scale: 1, y: -4 } : {}}
      whileTap={canInteract ? { scale: 1 } : {}}
      style={{
        boxShadow: isSelected && theme.glowEnabled ? `0 0 30px ${theme.glowColor}60` : undefined,
      }}
    >
      {/* Static themed surface */}
      {theme.previewImage ? (
        <img
          src={theme.previewImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            ...getStaticPatternStyle(theme),
            backgroundColor: theme.backgroundGradient[0],
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/35" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accentPrimary}, transparent)`,
        }}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        <TierBadge theme={theme} />
        <PreviewCard theme={theme} />
      </div>

      {/* Lock overlay */}
      <LockOverlay theme={theme} />

      {/* Selected indicator */}
      {isSelected && <SelectedIndicator theme={theme} />}
    </motion.div>
  );
}
