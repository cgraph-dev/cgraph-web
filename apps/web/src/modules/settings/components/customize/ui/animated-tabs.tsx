
import { memo } from 'react';
import { motion } from 'motion/react';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { uiSprings as springs } from './constants';
import type { AnimatedTabsProps } from './types';

export const AnimatedTabs = memo(function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  colorPreset = 'purple',
  layoutId = 'activeTab',
}: AnimatedTabsProps) {
  const colors = themeColors[colorPreset];

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <motion.button
            key={tab.id}
            className={`relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-[var(--token-text-primary)]'
                : 'text-[var(--token-text-muted)] hover:text-[var(--token-text-secondary)]'
            }`}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 1 }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
                  boxShadow: `0 0 20px ${colors.glow}`,
                }}
                transition={springs.smooth}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 [&_svg]:text-current">
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});
