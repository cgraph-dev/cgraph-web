import { motion, AnimatePresence } from 'motion/react';

interface SaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  errorMessage?: string | null;
  onSave: () => void;
  onReset: () => void;
}

/**
 * Save Bar component.
 */
export function SaveBar({ hasChanges, isSaving, errorMessage = null, onSave, onReset }: SaveBarProps) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 border-t border-[var(--token-border-muted)] bg-[var(--token-card-bg)]/90 p-4 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">You have unsaved changes</p>
              {errorMessage && (
                <p role="alert" className="mt-1 text-sm text-red-300">
                  {errorMessage}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] px-5 py-2.5 text-[13px] font-bold text-white/40 transition-all hover:bg-[var(--token-card-bg)/0.6] hover:text-white/80 hover:border-[var(--token-card-border)] active:scale-[0.98]"
              >
                Reset
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] px-8 py-2.5 text-[13px] font-bold text-[var(--color-brand-purple)] shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] border-t-[var(--color-brand-purple)]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
