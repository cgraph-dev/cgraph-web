/**
 * Premium tier badge on theme card.
 */
import { motion } from 'motion/react';
import { TIER_COLORS, type ProfileThemeConfig } from '@/data/profileThemes';
import { CATEGORY_ICONS } from './constants';

interface TierBadgeProps {
  theme: ProfileThemeConfig;
}

/**
 * Tier Badge component.
 */
export default function TierBadge({ theme }: TierBadgeProps) {
  const tierColor = TIER_COLORS[theme.tier];

  return (
    <div className="flex items-start justify-between">
      <motion.div
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tierColor.bg} ${tierColor.text} border ${tierColor.border} `}
        style={{
          boxShadow: `0 0 10px ${tierColor.glow}`,
        }}
        whileHover={{ opacity: 0.9 }}
      >
        {theme.tier}
      </motion.div>

      {/* Category icon */}
      <motion.div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-lg backdrop-blur-sm">
        {CATEGORY_ICONS[theme.category] ?? ''}
      </motion.div>
    </div>
  );
}
