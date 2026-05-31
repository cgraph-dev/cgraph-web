/**
 * Message Action Menu Component
 *
 * Dropdown menu for message actions (edit, pin, forward, delete).
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { MessageActionMenuProps } from './types';
import { ReplyIcon, EditIcon, PinIcon, ForwardIcon, DeleteIcon, SelectIcon } from './icons';

const MENU_WIDTH = 128;
const MENU_GAP = 4;

interface MenuPosition {
  top: number;
  left: number;
}

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
  onSelect,
  isMenuOpen,
  onToggleMenu,
  isOwn,
}: MessageActionMenuProps) {
  const dmTipping = useFeatureFlag('nodes.dm_tipping');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const left = Math.min(
      Math.max(MENU_GAP, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - MENU_GAP
    );

    setMenuPosition({
      top: rect.bottom + MENU_GAP,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition(null);
      return undefined;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isMenuOpen, updateMenuPosition]);

  const menu =
    isMenuOpen && menuPosition && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="menu"
            aria-label="Message actions"
            className="fixed z-[1000] w-32 rounded-lg bg-[var(--token-card-bg)] py-1 shadow-lg ring-1 ring-white/10"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {onSelect && (
              <button
                role="menuitem"
                onClick={onSelect}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
              >
                <SelectIcon />
                Select
              </button>
            )}
            {isOwn && onEdit && (
              <button
                role="menuitem"
                onClick={onEdit}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
              >
                <EditIcon />
                Edit
              </button>
            )}
            {onPin && (
              <button
                role="menuitem"
                onClick={onPin}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
              >
                <PinIcon />
                Pin
              </button>
            )}
            {onForward && (
              <button
                role="menuitem"
                onClick={onForward}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
              >
                <ForwardIcon />
                Forward
              </button>
            )}
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
            {onDelete && (
              <button
                role="menuitem"
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--token-card-bg)]"
              >
                <DeleteIcon />
                Delete
              </button>
            )}
          </div>,
          document.body
        )
      : null;

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
        ref={triggerRef}
        onClick={onToggleMenu}
        className="rounded p-1 text-gray-500 hover:bg-[var(--token-card-bg)] hover:text-white"
        title="More"
        aria-label="More message actions"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {menu}
    </div>
  );
}
