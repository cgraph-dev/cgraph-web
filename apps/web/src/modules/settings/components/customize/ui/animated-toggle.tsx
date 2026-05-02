
import { memo } from 'react';
import { motion } from 'motion/react';

import { toggleSizeConfig } from './constants';
import type { AnimatedToggleProps } from './types';

export const AnimatedToggle = memo(function AnimatedToggle({
  enabled,
  onToggle,
  colorPreset = 'emerald',
  size = 'md',
  disabled = false,
}: AnimatedToggleProps) {
  const config = toggleSizeConfig[size];
  void colorPreset;

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={enabled}
      data-checked={enabled}
      className={`aurora-social-toggle relative ${size === 'sm' ? 'aurora-social-toggle--compact' : size === 'lg' ? 'aurora-social-toggle--large' : ''} ${config.track} rounded-full ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      onClick={() => !disabled && onToggle()}
      whileHover={disabled ? undefined : { scale: 1 }}
      whileTap={disabled ? undefined : { scale: 1 }}
    >
      <motion.span
        className={`aurora-social-toggle-thumb absolute left-0.5 top-0.5 ${config.dot} rounded-full`}
      />
    </motion.button>
  );
});
