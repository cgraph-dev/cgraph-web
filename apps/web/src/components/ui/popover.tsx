import React, { ReactNode, createContext, use, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

interface PopoverProps {
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}
/** Popover. */
export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  readonly children: ReactNode;
  readonly asChild?: boolean;
}
/** Popover Trigger. */
export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const ctx = use(PopoverContext);

  const handleClick = () => {
    ctx?.setIsOpen(!ctx.isOpen);
  };

  if (asChild && React.isValidElement<{ onClick?: () => void }>(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    });
  }
  return (
    <button type="button" onClick={handleClick} className="inline-flex">
      {children}
    </button>
  );
}

interface PopoverContentProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly sideOffset?: number;
}
/** Popover Content. */
export function PopoverContent({
  children,
  className = '',
  align = 'center',
  sideOffset = 4,
}: PopoverContentProps) {
  const ctx = use(PopoverContext);
  const reducedMotion = useReducedMotion();

  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align];

  return (
    <AnimatePresence>
      {ctx?.isOpen && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={
            reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }
          }
          className={`absolute top-full mt-${sideOffset} z-50 ${alignClass} min-w-[200px] rounded-xl border border-[var(--token-card-border)] p-4 shadow-card backdrop-blur-xl ${className} `}
          style={{
            background: 'rgba(13, 17, 23, 0.92)',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Popover;
