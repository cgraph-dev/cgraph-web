import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CircleDot,
  EllipsisVertical,
  Forward,
  Pencil,
  Pin,
  Reply,
  SquareCheckBig,
  Trash2,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import type { MessageActionMenuProps } from './types';

const MENU_WIDTH = 176;
const MENU_GAP = 4;

interface MenuPosition {
  top: number;
  left: number;
}

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
            data-cgraph-material="floating"
            data-cgraph-surface="card"
            className="fixed z-[1000] w-44 border p-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {onSelect && (
              <Button
                role="menuitem"
                onClick={onSelect}
                variant="ghost"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<SquareCheckBig />}
                className="min-h-9 justify-start rounded-md border-transparent px-2 shadow-none"
              >
                Select
              </Button>
            )}
            {isOwn && onEdit && (
              <Button
                role="menuitem"
                onClick={onEdit}
                variant="ghost"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<Pencil />}
                className="min-h-9 justify-start rounded-md border-transparent px-2 shadow-none"
              >
                Edit
              </Button>
            )}
            {onPin && (
              <Button
                role="menuitem"
                onClick={onPin}
                variant="ghost"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<Pin />}
                className="min-h-9 justify-start rounded-md border-transparent px-2 shadow-none"
              >
                Pin
              </Button>
            )}
            {onForward && (
              <Button
                role="menuitem"
                onClick={onForward}
                variant="ghost"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<Forward />}
                className="min-h-9 justify-start rounded-md border-transparent px-2 shadow-none"
              >
                Forward
              </Button>
            )}
            {!isOwn && dmTipping.enabled && onTip && (
              <Button
                role="menuitem"
                onClick={onTip}
                variant="secondary"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<CircleDot />}
                className="min-h-9 justify-start rounded-md px-2 shadow-none"
              >
                Tip
              </Button>
            )}
            {onDelete && (
              <Button
                role="menuitem"
                onClick={onDelete}
                variant="danger"
                size="sm"
                animated={false}
                fullWidth
                leftIcon={<Trash2 />}
                className="min-h-9 justify-start rounded-md px-2 shadow-none"
              >
                Delete
              </Button>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative flex items-center gap-1">
      <IconButton
        icon={<Reply />}
        label="Reply to message"
        size="sm"
        onClick={onReply}
        className="h-8 w-8 flex-none"
      />
      <IconButton
        ref={triggerRef}
        icon={<EllipsisVertical />}
        label="More message actions"
        size="sm"
        variant={isMenuOpen ? 'secondary' : 'ghost'}
        onClick={onToggleMenu}
        className="h-8 w-8 flex-none"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      />
      {menu}
    </div>
  );
}
