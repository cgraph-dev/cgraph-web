import type { ReactNode } from 'react';
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
  const hasActions =
    !isCurrentUser &&
    !isOwner &&
    (capabilities.canManageRoles ||
      capabilities.canMute ||
      capabilities.canKick ||
      capabilities.canBan);

  return (
    <li className="relative flex min-w-0 items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <ThemedAvatar
          src={member.avatarUrl}
          alt={displayName}
          size="small"
          avatarBorderId={getAvatarBorderId(member)}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-white">{displayName}</span>
            <RoleBadge
              label={isOwner ? 'Owner' : primaryRole?.name ?? 'Member'}
              color={isOwner ? '#eab308' : primaryRole?.color ?? '#94a3b8'}
            />
            {isCurrentUser && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">You</span>
            )}
            {member.isMuted && (
              <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs text-orange-300">
                Muted
              </span>
            )}
          </div>
          <span className="block truncate text-xs text-gray-500">@{member.username}</span>
        </div>
      </div>

      {hasActions && (
        <div className="relative shrink-0">
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
              className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-1 shadow-card"
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

function RoleBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: `${color}66`,
        backgroundColor: `${color}1a`,
        color,
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
