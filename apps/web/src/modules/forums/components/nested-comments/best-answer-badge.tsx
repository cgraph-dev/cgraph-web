import { motion } from 'motion/react';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';

/**
 */
/**
 * Best Answer Badge component.
 */
export function BestAnswerBadge() {
  return (
    <motion.div
      className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={springs.wobbly}
    >
      <CheckBadgeIcon className="h-4 w-4 text-white" />
      <span className="text-xs font-bold text-white">Best Answer</span>
    </motion.div>
  );
}
