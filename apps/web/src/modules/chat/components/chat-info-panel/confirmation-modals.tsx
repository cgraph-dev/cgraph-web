/**
 * ConfirmationModals - block and report confirmation modals
 */

import { motion, AnimatePresence } from 'motion/react';
import { FADE_IN } from '@/lib/animations/transitions';

interface BlockConfirmModalProps {
  isOpen: boolean;
  userName: string;
  isBlocking: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BlockConfirmModal({
  isOpen,
  userName,
  isBlocking,
  onConfirm,
  onCancel,
}: BlockConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-white">Block {userName}?</h3>
            <p className="mb-4 text-sm text-gray-400">
              They won't be able to message you or see your content. You can unblock them later from
              settings.
            </p>
            <div className="flex gap-3">
              <motion.button
                onClick={onCancel}
                className="flex-1 rounded-lg bg-[var(--token-card-bg)/0.6] px-4 py-2 text-gray-300 hover:bg-[var(--token-card-bg)/0.8]"
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={isBlocking}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {isBlocking ? 'Blocking...' : 'Block'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ReportModalProps {
  isOpen: boolean;
  userName: string;
  isReporting: boolean;
  reportReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReportModal({
  isOpen,
  userName,
  isReporting,
  reportReason,
  onReasonChange,
  onConfirm,
  onCancel,
}: ReportModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-white">Report {userName}</h3>
            <p className="mb-4 text-sm text-gray-400">
              Please describe why you're reporting this user.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Describe the issue..."
              className="mb-4 h-24 w-full resize-none rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.6] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <motion.button
                onClick={onCancel}
                className="flex-1 rounded-lg bg-[var(--token-card-bg)/0.6] px-4 py-2 text-gray-300 hover:bg-[var(--token-card-bg)/0.8]"
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={isReporting || !reportReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {isReporting ? 'Sending...' : 'Report'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
