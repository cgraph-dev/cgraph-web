/**
 * Switch Component
 *
 * Toggle switch for boolean settings with spring physics.
 */

import { motion } from 'motion/react';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/** Toggle a boolean setting. */
export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id,
  ariaLabel,
}: SwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      data-checked={checked}
      data-cgraph-material="control"
      data-cgraph-surface="control"
      data-cgraph-state={disabled ? 'disabled' : 'idle'}
      data-cgraph-variant="secondary"
      whileTap={{ scale: 0.95 }}
      className={`aurora-social-toggle focus:ring-offset-background focus:ring-primary/50 relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className} `}
    >
      <motion.span className="aurora-social-toggle-thumb absolute left-1 top-1 inline-block h-4 w-4 rounded-full" />
    </motion.button>
  );
}

export default Switch;
