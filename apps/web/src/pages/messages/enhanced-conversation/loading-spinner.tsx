/**
 * LoadingSpinner - conversation loading state
 */

import { motion } from 'motion/react';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * Loading Spinner — loading placeholder.
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--token-bg-primary)]">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={loop(tweens.slow)}
      />
    </div>
  );
}
