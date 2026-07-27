/**
 * Context menu for quick-enable/disable of notification profiles.
 *
 * Shown on right-click or long-press of a profile card. Provides
 * Signal's duration picker: "1 hour", "8 hours", "Until tomorrow", "Indefinitely".
 */
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ClockIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { tweens } from '@/lib/animation-presets';
import type { NotificationProfile } from '@cgraph-dev/shared-types';

const DURATION_OPTIONS = [
  { label: 'Enable for 1 hour', minutes: 60 },
  { label: 'Enable for 8 hours', minutes: 480 },
  { label: 'Enable until tomorrow', minutes: minutesUntilTomorrow() },
  { label: 'Enable indefinitely', minutes: null },
] as const;

function minutesUntilTomorrow(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return Math.max(60, Math.ceil((tomorrow.getTime() - now.getTime()) / 60000));
}

interface NotificationProfilesMenuProps {
  readonly profile: NotificationProfile;
  readonly position: { readonly x: number; readonly y: number };
  readonly isActive: boolean;
  readonly disabled: boolean;
  readonly onQuickEnable: (durationMinutes: number | null) => void;
  readonly onDeactivate: () => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}

/** Context menu for quick-enable/disable duration picker. */
export function NotificationProfilesMenu({
  profile,
  position,
  isActive,
  disabled,
  onQuickEnable,
  onDeactivate,
  onDelete,
  onClose,
}: NotificationProfilesMenuProps): React.ReactNode {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();

    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
      />

      {/* Menu */}
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={tweens.fast}
        className="aurora-social-panel fixed z-50 w-64 overflow-hidden rounded-xl border border-[var(--token-border)] bg-[var(--token-surface)] shadow-xl"
        role="menu"
        aria-label={`Actions for ${profile.name}`}
        aria-busy={disabled}
        style={{
          left: Math.min(position.x, window.innerWidth - 280),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
      >
        <div className="border-b border-[var(--token-border)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--token-text-primary)]">
            {profile.emoji ? `${profile.emoji} ` : ''}
            {profile.name}
          </p>
        </div>

        <div className="p-1.5">
          {isActive ? (
            <button
              type="button"
              role="menuitem"
              onClick={onDeactivate}
              disabled={disabled}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--token-text-primary)] hover:bg-[var(--token-surface-hover)] disabled:cursor-wait disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4 text-[var(--token-text-muted)]" />
              Disable profile
            </button>
          ) : (
            DURATION_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                role="menuitem"
                onClick={() => onQuickEnable(option.minutes)}
                disabled={disabled}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--token-text-primary)] hover:bg-[var(--token-surface-hover)] disabled:cursor-wait disabled:opacity-50"
              >
                <ClockIcon className="h-4 w-4 text-[var(--token-text-muted)]" />
                {option.label}
              </button>
            ))
          )}

          <div className="my-1 border-t border-[var(--token-border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            disabled={disabled}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete profile
          </button>
        </div>
      </motion.div>
    </>
  );
}
