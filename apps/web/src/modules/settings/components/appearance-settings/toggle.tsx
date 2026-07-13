/**
 * Toggle Component
 *
 * Animated toggle switch with label and description.
 */

import { motion } from 'motion/react';

import type { ToggleProps } from './types';

// COMPONENT

/**
 */
/**
 * Toggle component.
 */
export function Toggle({ enabled, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <div
      className={`aurora-social-option flex items-center justify-between rounded-xl p-4 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={enabled ? 'text-primary-500' : 'text-[var(--token-text-muted)]'}>
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium text-[var(--token-text-primary)]">{label}</h4>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--token-text-muted)]">{description}</p>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onChange}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        data-checked={enabled}
        className={`aurora-social-toggle relative h-6 w-11 rounded-full ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}
      >
        <motion.span className="aurora-social-toggle-thumb absolute top-1 h-4 w-4 rounded-full" />
      </motion.button>
    </div>
  );
}

export default Toggle;
