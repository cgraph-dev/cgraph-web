import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { durationsSec } from '@/lib/animation-presets';

interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
}
/** Dialog. */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            key="dialog-backdrop"
            data-testid="dialog-backdrop"
            className="cgraph-dialog-backdrop fixed inset-0"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: durationsSec.normal }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="dialog-content"
            className="relative z-50 flex w-full justify-center"
            initial={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 26 }
            }
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface DialogContentProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly ariaLabelledBy?: string;
  readonly ariaDescribedBy?: string;
}
/** Dialog Content. */
export function DialogContent({
  children,
  className = '',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: DialogContentProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={`cgraph-dialog-content mx-4 w-full max-w-md p-5 ${className}`}
      data-cgraph-material="floating"
      data-cgraph-surface="dialog"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Header. */
export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return (
    <div className={`border-b border-[var(--product-line)] pb-4 ${className}`}>{children}</div>
  );
}

interface DialogTitleProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Title. */
export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-[var(--token-text-primary)] ${className}`}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Description. */
export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p className={`mt-1 text-sm text-[var(--token-text-muted)] ${className}`}>{children}</p>
  );
}

interface DialogFooterProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Footer. */
export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div
      className={`mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--product-line)] pt-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default Dialog;
