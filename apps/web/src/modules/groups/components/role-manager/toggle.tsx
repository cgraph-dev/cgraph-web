import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import type { ToggleProps } from './types';

/**
 */
/**
 * Toggle component.
 */
export function Toggle({ value, disabled = false, onChange }: ToggleProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      disabled={disabled}
      aria-pressed={value}
      onClick={() => onChange(!value)}
      className={`h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-[var(--token-card-bg)]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={springs.snappy}
        className="h-6 w-6 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  );
}
