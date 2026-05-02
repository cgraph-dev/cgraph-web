/**
 * Layout component for social pages.
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { FADE_IN } from '@/lib/animations/transitions';
import { useThemeEnhanced } from '@/providers/theme-context-enhanced';

/**
 * SocialLayout Component
 *
 * Layout for the Social Hub page:
 * - Top: Global search bar
 * - Left sidebar: Tab navigation (friends, notifications, discover)
 * - Main: Content area for selected tab
 */

/**
 * Social Layout — page layout wrapper.
 */
export default function SocialLayout() {
  const { theme } = useThemeEnhanced();
  const glassClass = theme.category === 'light' ? '' : 'backdrop-blur-[8px]';

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className={`flex h-full w-full flex-col overflow-hidden bg-[var(--token-bg-primary)] ${glassClass}`}
    >
      {/* Main content area - child routes will render here */}
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
