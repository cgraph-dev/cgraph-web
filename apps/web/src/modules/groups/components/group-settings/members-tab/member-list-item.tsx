import { useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowRightStartOnRectangleIcon,
  EllipsisVerticalIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import type { GroupMember, MemberAction, MemberCapabilities } from './types';

interface MemberListItemProps {
  member: GroupMember;
  isOwner: boolean;
  isCurrentUser: boolean;
  capabilities: MemberCapabilities;
  isMenuOpen: boolean;
  isPending: boolean;
  onToggleMenu: (memberId: string | null) => void;
  onAction: (memberId: string, action: MemberAction) => void;
  onOpenRoleModal: (memberId: string) => void;
  onUnmute: (memberId: string) => void;
}

export function MemberListItem({
  member,
  isOwner,
  isCurrentUser,
  capabilities,
  isMenuOpen,
  isPending,
  onToggleMenu,
  onAction,
  onOpenRoleModal,
  onUnmute,
}: MemberListItemProps) {
  const displayName = member.displayName || member.username;
  const primaryRole = [...member.roles].sort(
    (left, right) => right.position - left.position || left.name.localeCompare(right.name)
  )[0];
  const menuRef = useRef<HTMLDivElement>(null);
  const hasActions =
    !isCurrentUser &&
    !isOwner &&
    (capabilities.canManageRoles ||
      capabilities.canMute ||
      capabilities.canKick ||
      capabilities.canBan);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !menuRef.current?.contains(target)) onToggleMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleMenu(null);
    };

    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen, onToggleMenu]);

  return (
    <li className="cgraph-list-row relative flex min-w-0 items-center justify-between gap-3 rounded-none border-0 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <ThemedAvatar
          src={member.avatarUrl}
          alt={displayName}
          size="small"
          avatarBorderId={getAvatarBorderId(member)}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[var(--token-text-primary)]">
              {displayName}
            </span>
            <RoleBadge
              label={isOwner ? 'Owner' : primaryRole?.name ?? 'Member'}
              color={isOwner ? 'var(--token-feedback-warning)' : primaryRole?.color}
            />
            {isCurrentUser && (
              <span className="rounded-full border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-2 py-0.5 text-xs text-[var(--token-text-secondary)]">
                You
              </span>
            )}
            {member.isMuted && (
              <span className="rounded-full border border-[var(--token-feedback-warning)] bg-[color-mix(in_srgb,var(--token-feedback-warning)_10%,transparent)] px-2 py-0.5 text-xs text-[var(--token-feedback-warning)]">
                Muted
              </span>
            )}
          </div>
          <span className="block truncate text-xs text-[var(--token-text-muted)]">
            @{member.username}
          </span>
        </div>
      </div>

      {hasActions && (
        <div ref={menuRef} className="relative shrink-0">
          <IconButton
            icon={<EllipsisVerticalIcon />}
            label={`Member actions for ${displayName}`}
            size="sm"
            disabled={isPending}
            aria-expanded={isMenuOpen}
            onClick={() => onToggleMenu(isMenuOpen ? null : member.id)}
          />
          {isMenuOpen && (
            <div
              role="menu"
              aria-label={`Actions for ${displayName}`}
              data-cgraph-material="floating"
              data-cgraph-surface="menu"
              className="cgraph-section-surface absolute right-0 top-full z-50 mt-1 w-48 p-1 shadow-card"
            >
              {capabilities.canManageRoles && (
                <MenuAction
                  icon={<ShieldCheckIcon />}
                  label="Change roles"
                  onClick={() => {
                    onToggleMenu(null);
                    onOpenRoleModal(member.id);
                  }}
                />
              )}
              {capabilities.canMute &&
                (member.isMuted ? (
                  <MenuAction
                    icon={<SpeakerXMarkIcon />}
                    label="Unmute"
                    onClick={() => {
                      onToggleMenu(null);
                      onUnmute(member.id);
                    }}
                  />
                ) : (
                  <MenuAction
                    icon={<SpeakerXMarkIcon />}
                    label="Mute"
                    onClick={() => {
                      onToggleMenu(null);
                      onAction(member.id, 'mute');
                    }}
                  />
                ))}
              {capabilities.canKick && (
                <MenuAction
                  icon={<ArrowRightStartOnRectangleIcon />}
                  label="Kick"
                  onClick={() => {
                    onToggleMenu(null);
                    onAction(member.id, 'kick');
                  }}
                />
              )}
              {capabilities.canBan && (
                <MenuAction
                  icon={<NoSymbolIcon />}
                  label="Ban"
                  danger
                  onClick={() => {
                    onToggleMenu(null);
                    onAction(member.id, 'ban');
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function RoleBadge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="rounded-full border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-2 py-0.5 text-xs font-medium"
      style={{
        color: color || 'var(--token-text-muted)',
      }}
    >
      {label}
    </span>
  );
}

function MenuAction({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      role="menuitem"
      variant={danger ? 'danger' : 'ghost'}
      size="sm"
      fullWidth
      animated={false}
      leftIcon={icon}
      onClick={onClick}
      className="justify-start"
    >
      {label}
    </Button>
  );
}
