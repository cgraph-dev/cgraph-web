import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

interface SaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  canSave?: boolean;
  errorMessage?: string | null;
  onSave: () => void;
  onReset: () => void;
}

/**
 * Save Bar component.
 */
export function SaveBar({
  hasChanges,
  isSaving,
  canSave = true,
  errorMessage = null,
  onSave,
  onReset,
}: SaveBarProps) {
  const content = (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          role="region"
          aria-label="Unsaved group settings"
          className="cgraph-dialog-content fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 p-4 lg:bottom-3 lg:left-auto lg:right-3 lg:w-[min(42rem,calc(100vw-1.5rem))]"
          data-cgraph-material="floating"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm text-[var(--token-text-muted)]">You have unsaved changes</p>
              {errorMessage && (
                <p role="alert" className="mt-1 text-sm text-red-300">
                  {errorMessage}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Button
                variant="secondary"
                animated={false}
                onClick={onReset}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button
                animated={false}
                onClick={onSave}
                disabled={!canSave}
                isLoading={isSaving}
              >
                Save changes
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
