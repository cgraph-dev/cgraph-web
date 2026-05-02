import { motion } from 'motion/react';
import type { ConfirmModalProps } from './types';
import { FADE_IN } from '@/lib/animations/transitions';

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-bold ${danger ? 'text-red-400' : 'text-white'} mb-2`}>
          {title}
        </h2>
        <p className="mb-6 text-gray-400">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[var(--token-card-bg)/0.6] py-3 text-gray-300 transition-colors hover:bg-[var(--token-card-bg)/0.8]"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 font-semibold ${
              danger ? 'bg-red-600 text-white' : 'bg-primary-600 text-white'
            }`}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
