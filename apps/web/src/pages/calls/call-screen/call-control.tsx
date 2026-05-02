/**
 * CallControl component - single control button
 */

import { motion } from 'motion/react';
import type { CallControlProps } from './types';

export function CallControl({ icon, label, onClick, active, danger, disabled }: CallControlProps) {
  return (
    <motion.button
      whileHover={{ opacity: disabled ? 1 : 0.9 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors ${
        danger
          ? 'bg-red-500 text-white hover:bg-red-600'
          : active
            ? 'bg-primary-500 text-white'
            : 'bg-[var(--token-card-bg)] text-gray-300 hover:bg-[var(--token-card-bg)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}
