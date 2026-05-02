/**
 * Animated toggle switch component used in settings pages.
 */

import { motion } from 'motion/react';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ToggleSwitch({ enabled, onToggle, disabled }: ToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      data-checked={enabled}
      className="aurora-social-toggle aurora-social-toggle--large relative h-8 w-14 rounded-full"
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
    >
      <motion.span className="aurora-social-toggle-thumb absolute left-1 top-1 h-6 w-6 rounded-full" />
    </motion.button>
  );
}
