/**
 * More Options Menu Component
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  PencilIcon,
  TrashIcon,
  FlagIcon,
  MapPinIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import type { Post } from '@/modules/forums/store';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  canEdit: boolean;
  canModerate: boolean;
  onEdit?: () => void;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
}

/**
 */
/**
 * More Menu component.
 */
export function MoreMenu({
  isOpen,
  onClose,
  post,
  canEdit,
  canModerate,
  onEdit,
  onPin,
  onLock,
  onDelete,
  onReport,
}: MoreMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] py-1 shadow-xl"
        >
          {canEdit && (
            <button
              onClick={() => {
                onEdit?.();
                onClose();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
          {canModerate && (
            <>
              <button
                onClick={() => {
                  onPin?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
              >
                <MapPinIcon className="h-4 w-4" />
                {post.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => {
                  onLock?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
              >
                <LockClosedIcon className="h-4 w-4" />
                {post.isLocked ? 'Unlock' : 'Lock'}
              </button>
              <hr className="my-1 border-[var(--token-card-border)]" />
              <button
                onClick={() => {
                  onDelete?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--token-card-bg)]"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => {
              onReport?.();
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
          >
            <FlagIcon className="h-4 w-4" />
            Report
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
