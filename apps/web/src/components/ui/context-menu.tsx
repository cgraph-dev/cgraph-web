/** Radix-based animated right-click menu. */
import { ReactNode } from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';

/* ─── Root ─────────────────────────────────────────────────────────────────── */

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuSub = ContextMenuPrimitive.Sub;

/* ─── Content ──────────────────────────────────────────────────────────────── */

interface ContextMenuContentProps {
  children: ReactNode;
  className?: string;
}

/** Context Menu Content component. */
export function ContextMenuContent({ children, className }: ContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          'z-[var(--z-popover,500)] min-w-[180px] max-w-[320px] overflow-hidden rounded-lg',
          'border border-[var(--token-border-default)] bg-[var(--token-bg-secondary)] backdrop-blur-xl',
          'p-1 shadow-[var(--shadow-lg)]',
          'animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          className
        )}
      >
        {children}
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
}

/* ─── Item ─────────────────────────────────────────────────────────────────── */

interface ContextMenuItemProps {
  children: ReactNode;
  icon?: ReactNode;
  /** Keyboard shortcut hint displayed right-aligned */
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
  className?: string;
}

/** Context Menu Item component. */
export function ContextMenuItem({
  children,
  icon,
  shortcut,
  disabled = false,
  destructive = false,
  onSelect,
  className,
}: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'group relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
        'text-[var(--token-text-primary)] transition-colors',
        'data-[highlighted]:bg-brand-purple/[0.25] data-[highlighted]:text-white',
        disabled && 'pointer-events-none opacity-40',
        destructive &&
          'text-red-400 data-[highlighted]:bg-red-500/[0.2] data-[highlighted]:text-red-300',
        className
      )}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--token-text-muted)] group-data-[highlighted]:text-[var(--token-text-secondary)]">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto pl-4 text-xs text-[var(--token-text-muted)] group-data-[highlighted]:text-[var(--token-text-muted)]">
          {shortcut}
        </span>
      )}
    </ContextMenuPrimitive.Item>
  );
}

/* ─── Label ────────────────────────────────────────────────────────────────── */

/** Context Menu Label component. */
export function ContextMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ContextMenuPrimitive.Label
      className={cn(
        'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--token-text-muted)]',
        className
      )}
    >
      {children}
    </ContextMenuPrimitive.Label>
  );
}

export function ContextMenuSeparator({ className }: { className?: string }) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn('my-1 h-px bg-[var(--token-border-default)]', className)}
    />
  );
}

export const ContextMenuSubTrigger = ({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) => (
  <ContextMenuPrimitive.SubTrigger
    className={cn(
      'group relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
      'data-[highlighted]:bg-brand-purple/[0.25] text-[var(--token-text-primary)] data-[highlighted]:text-white',
      className
    )}
  >
    {icon && (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--token-text-muted)]">
        {icon}
      </span>
    )}
    <span className="flex-1">{children}</span>
    <svg className="ml-auto h-4 w-4 text-[var(--token-text-muted)]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  </ContextMenuPrimitive.SubTrigger>
);

/** Context Menu Sub Content component. */
export function ContextMenuSubContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        className={cn(
          'z-[var(--z-popover,500)] min-w-[180px] overflow-hidden rounded-lg',
          'border border-[var(--token-border-default)] bg-[var(--token-bg-secondary)] backdrop-blur-xl',
          'p-1 shadow-[var(--shadow-lg)]',
          'animate-in fade-in slide-in-from-left-1',
          className
        )}
        sideOffset={2}
        alignOffset={-5}
      >
        {children}
      </ContextMenuPrimitive.SubContent>
    </ContextMenuPrimitive.Portal>
  );
}

export default ContextMenu;
