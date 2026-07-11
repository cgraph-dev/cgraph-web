/**
 * Layout component for customization pages.
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { FADE_IN } from '@/lib/animations/transitions';
import { useThemeEnhanced } from '@/providers/theme-enhanced';

/**
 * CustomizeLayout Component
 *
 * Three-panel layout for the customization hub:
 * - Left sidebar: Category navigation
 * - Center: Customization controls
 * - Right: Live preview panel
 */

/**
 * Customize Layout — page layout wrapper.
 */
export default function CustomizeLayout() {
  const { theme } = useThemeEnhanced();
  const glassClass = theme.category === 'light' ? '' : 'backdrop-blur-[8px]';

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className={`flex h-full w-full overflow-hidden bg-[var(--token-bg-primary)] ${glassClass}`}
    >
      {/* Main content area - child routes will render here */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
