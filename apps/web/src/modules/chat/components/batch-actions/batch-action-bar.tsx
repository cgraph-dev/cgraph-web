/**
 * Floating action bar for batch message operations.
 *
 * Shows at the bottom of the conversation when multi-select mode is
 * active. Buttons: Forward, Delete, Copy, Cancel. Each button reflects
 * whether the operation is allowed given the current selection count
 * and per-operation limits.
 *
 * Follows Signal's multi-select action bar pattern.
 */
import { type ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type { BatchOperation } from '@cgraph-dev/shared-types';
import { MAX_BATCH_COPY, MAX_BATCH_FORWARD, MAX_BATCH_DELETE } from '@cgraph-dev/shared-types';

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BatchActionBarProps {
  /** Whether multi-select mode is active. */
  readonly isSelecting: boolean;
  /** Number of messages currently selected. */
  readonly selectedCount: number;
  /** Check if a specific operation is allowed. */
  readonly isOperationAllowed: (op: BatchOperation) => boolean;
  /** Handler for forward action. */
  readonly onForward?: () => void;
  /** Handler for delete action. */
  readonly onDelete: () => void;
  /** Handler for copy action. */
  readonly onCopy: () => void;
  /** Handler for cancelling selection. */
  readonly onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  readonly label: string;
  readonly icon: string;
  readonly disabled: boolean;
  readonly variant?: 'default' | 'danger';
  readonly onClick: () => void;
  readonly maxCount?: number;
  readonly currentCount: number;
}

function ActionButton(props: ActionButtonProps): ReactNode {
  const { label, icon, disabled, variant = 'default', onClick, maxCount, currentCount } = props;

  const baseClass =
    'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors';
  const enabledClass =
    variant === 'danger'
      ? 'text-red-400 hover:bg-red-500/20'
      : 'text-text-primary hover:bg-surface-tertiary';
  const disabledClass = 'text-text-tertiary cursor-not-allowed opacity-40';

  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [disabled, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClass} ${disabled ? disabledClass : enabledClass}`}
      title={maxCount ? `Max ${maxCount} (${currentCount} selected)` : undefined}
    >
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Floating batch action bar that slides in from the bottom.
 *
 * Renders Forward, Delete, Copy, and Cancel buttons with live counts.
 * Disables buttons when selection exceeds their operation limit.
 */
function BatchActionBar(props: BatchActionBarProps): ReactNode {
  const { isSelecting, selectedCount, isOperationAllowed, onForward, onDelete, onCopy, onCancel } =
    props;

  const handleCopy = useCallback(() => {
    onCopy();
    logger.info('[BatchActions] Copy initiated', { count: selectedCount });
  }, [onCopy, selectedCount]);

  return (
    <AnimatePresence>
      {isSelecting && (
        <motion.div
          key="batch-action-bar"
          role="toolbar"
          aria-label={`${selectedCount} selected message${selectedCount === 1 ? '' : 's'}`}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="border-border bg-surface-primary/95 fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border px-2 py-1 shadow-xl backdrop-blur-md"
        >
          {/* Selection count badge */}
          <div className="border-border flex items-center gap-1.5 border-r px-3 py-1">
            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {selectedCount}
            </div>
            <span className="text-text-secondary text-xs">selected</span>
          </div>

          {/* Action buttons */}
          {onForward ? (
            <ActionButton
              label="Forward"
              icon="↗"
              disabled={!isOperationAllowed('forward')}
              onClick={onForward}
              maxCount={MAX_BATCH_FORWARD}
              currentCount={selectedCount}
            />
          ) : null}
          <ActionButton
            label="Copy"
            icon="📋"
            disabled={!isOperationAllowed('copy')}
            onClick={handleCopy}
            maxCount={MAX_BATCH_COPY}
            currentCount={selectedCount}
          />
          <ActionButton
            label="Delete"
            icon="🗑"
            disabled={!isOperationAllowed('delete')}
            variant="danger"
            onClick={onDelete}
            maxCount={MAX_BATCH_DELETE}
            currentCount={selectedCount}
          />

          {/* Cancel */}
          <div className="border-border border-l pl-1">
            <button
              type="button"
              onClick={onCancel}
              className="text-text-secondary hover:bg-surface-tertiary rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { BatchActionBar };
export type { BatchActionBarProps };
