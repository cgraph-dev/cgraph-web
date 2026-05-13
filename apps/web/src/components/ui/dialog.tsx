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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: durationsSec.normal }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="dialog-content"
            className="relative z-50"
            initial={reducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
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
}
/** Dialog Content. */
export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div
      className={`mx-4 w-full max-w-md rounded-2xl border border-[var(--token-card-border)] p-6 shadow-card ${className} `}
      style={{
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        background: 'rgba(15, 19, 40, 0.92)',
      }}
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
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface DialogTitleProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Title. */
export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-textPrimary text-lg font-semibold ${className}`}>{children}</h2>;
}

interface DialogDescriptionProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Description. */
export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return <p className={`text-textMuted mt-1 text-sm ${className}`}>{children}</p>;
}

interface DialogFooterProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Dialog Footer. */
export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>;
}

export default Dialog;
