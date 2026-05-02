import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  error?: string | null;
  label?: string;
  successLabel?: string;
  className?: string;
}

/**
 * Unified Save Button with a "game-like" success animation.
 * Transitions from Idle -> Saving (Loader) -> Success (Checkmark + Label).
 */
export function SaveButton({
  onSave,
  isSaving,
  error,
  label = 'Save Changes',
  successLabel = 'Saved!',
  className,
}: SaveButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Watch for isSaving turning from true to false to trigger success state
  useEffect(() => {
    if (!isSaving && !error) {
      // Logic for assumed success could go here if needed
    }
  }, [isSaving, error]);

  // We'll let the parent manage the "success" pulse if they want,
  // but for the "game-like" feel, we trigger it locally when isSaving finishes.
  const [prevIsSaving, setPrevIsSaving] = useState(isSaving);

  useEffect(() => {
    if (prevIsSaving && !isSaving && !error) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevIsSaving(isSaving);
    return undefined;
  }, [isSaving, prevIsSaving, error]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        variant={showSuccess ? 'success' : 'primary'}
        onClick={onSave}
        disabled={isSaving || showSuccess}
        animated={false}
        className={cn(
          'relative min-w-[140px] overflow-hidden transition-all duration-300',
          showSuccess && 'border-primary-500/40 bg-primary-500/10 text-primary-300'
        )}
      >
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Saving...</span>
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <CheckIcon className="h-5 w-5" />
              </motion.div>
              <span className="font-bold">{successLabel}</span>
            </motion.div>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
