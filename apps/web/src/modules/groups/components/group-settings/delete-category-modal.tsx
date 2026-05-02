import { motion, AnimatePresence } from 'motion/react';
import { FADE_IN } from '@/lib/animations/transitions';

interface DeleteCategoryModalProps {
  deleteConfirmId: string | null;
  onConfirm: (categoryId: string) => void;
  onCancel: () => void;
}

export function DeleteCategoryModal({
  deleteConfirmId,
  onConfirm,
  onCancel,
}: DeleteCategoryModalProps) {
  return (
    <AnimatePresence>
      {deleteConfirmId && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Delete Category</h3>
            <p className="text-sm text-gray-400">
              Channels in this category will become uncategorized. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirm(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
