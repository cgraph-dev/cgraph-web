import { memo } from 'react';
import { motion } from 'motion/react';
import type { OptionToggleProps } from './types';
// COMPONENT
/**
 * Toggle switch with label and optional description
 */
export const OptionToggle = memo(function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: OptionToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        data-checked={checked}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 1 }}
        className="aurora-social-toggle relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        <motion.span className="aurora-social-toggle-thumb pointer-events-none absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full" />
      </motion.button>
    </label>
  );
});

export default OptionToggle;
