/**
 * Message Action Menu Component
 *
 * Dropdown menu for message actions (edit, pin, forward, delete).
 */

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { MessageActionMenuProps } from './types';
import { ReplyIcon, EditIcon, PinIcon, ForwardIcon, DeleteIcon } from './icons';

/**
 * Message Action Menu component.
 */
export function MessageActionMenu({
  onReply,
  onEdit,
  onPin,
  onForward,
  onDelete,
  onTip,
  isMenuOpen,
  onToggleMenu,
  isOwn,
}: MessageActionMenuProps) {
  const dmTipping = useFeatureFlag('nodes.dm_tipping');

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={onReply}
        className="rounded p-1 text-gray-500 hover:bg-[var(--token-card-bg)] hover:text-white"
        title="Reply"
        aria-label="Reply to message"
      >
        <ReplyIcon />
      </button>
      <button
        onClick={onToggleMenu}
        className="rounded p-1 text-gray-500 hover:bg-[var(--token-card-bg)] hover:text-white"
        title="More"
        aria-label="More message actions"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          aria-label="Message actions"
          className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg bg-[var(--token-card-bg)/0.4] py-1 shadow-lg ring-1 ring-white/10"
        >
          <button
            role="menuitem"
            onClick={onEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
          >
            <EditIcon />
            Edit
          </button>
          <button
            role="menuitem"
            onClick={onPin}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
          >
            <PinIcon />
            Pin
          </button>
          <button
            role="menuitem"
            onClick={onForward}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
          >
            <ForwardIcon />
            Forward
          </button>
          {!isOwn && dmTipping.enabled && onTip && (
            <button
              role="menuitem"
              onClick={onTip}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-purple-400 hover:bg-[var(--token-card-bg)]"
            >
              <span className="flex h-4 w-4 items-center justify-center text-sm">{'\u2115'}</span>
              Tip
            </button>
          )}
          <button
            role="menuitem"
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--token-card-bg)]"
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
