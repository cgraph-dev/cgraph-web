/**
 * MemberItem Component - Individual member row with context menu actions
 */
import { motion } from 'motion/react';
import {
  UserPlusIcon,
  ShieldCheckIcon,
  ChatBubbleLeftIcon,
  UserMinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as CrownIcon } from '@heroicons/react/24/solid';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { GlassCard } from '@/shared/components/ui';
import { getAvatarBorderId } from '@/lib/utils';
import { chatLogger as logger } from '@/lib/logger';
import { statusColors, statusLabels } from './constants';
import { SCALE_IN, FADE_IN } from '@/lib/animations/transitions';
import type {
  StatusType,
  MemberItemProps,
  MemberContextMenuProps,
  RoleSectionProps,
} from './types';

function isStatusType(value: unknown): value is StatusType {
  return value === 'online' || value === 'idle' || value === 'dnd' || value === 'offline';
}

// Role Section Component
/**
 */
/**
 * Role Section section component.
 */
export function RoleSection({ role, members, onMemberClick }: RoleSectionProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider">
        <span style={{ color: role.color }}>{role.name}</span>
        <span className="text-gray-500">— {members.length}</span>
      </div>
      {members.map((member) => (
        <MemberItem
          key={member.id}
          member={member}
          roleColor={role.color}
          onClick={(e) => onMemberClick(member, e)}
        />
      ))}
    </div>
  );
}

// Member Item Component
/**
 */
/**
 * Member Item component.
 */
export function MemberItem({ member, roleColor, onClick }: MemberItemProps) {
  const status: StatusType = isStatusType(member.user.status) ? member.user.status : 'offline';
  const displayName = member.nickname || member.user.displayName || member.user.username;

  return (
    <motion.div
      whileHover={{ x: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5"
    >
      {/* Avatar with status */}
      <div className="relative">
        <ThemedAvatar
          src={member.user.avatarUrl}
          alt={displayName}
          size="small"
          avatarBorderId={getAvatarBorderId(member.user)}
        />
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-900 ${statusColors[status]}`}
          title={statusLabels[status]}
        />
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: roleColor || 'white' }}>
          {displayName}
        </p>
        {member.nickname && member.nickname !== member.user.username && (
          <p className="truncate text-xs text-gray-500">@{member.user.username}</p>
        )}
      </div>

      {/* Role badges */}
      {member.roles?.slice(0, 2).map((role) => (
        <div key={role.id} className="hidden group-hover:block" title={role.name}>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
        </div>
      ))}
    </motion.div>
  );
}

// Member Context Menu
/**
 */
/**
 * Member Context Menu component.
 */
export function MemberContextMenu({ member, position, isOwner, onClose }: MemberContextMenuProps) {
  const displayName = member.nickname || member.user.displayName || member.user.username;

  const menuItems = [
    {
      icon: ChatBubbleLeftIcon,
      label: 'Message',
      action: () => {
        logger.log('Opening DM with', member.userId);
        onClose();
      },
    },
    {
      icon: UserPlusIcon,
      label: 'View Profile',
      action: () => {
        logger.log('Viewing profile of', member.userId);
        onClose();
      },
    },
    { divider: true },
    {
      icon: ShieldCheckIcon,
      label: 'Manage Roles',
      action: () => {
        logger.log('Managing roles for', member.userId);
        onClose();
      },
      adminOnly: true,
    },
    {
      icon: UserMinusIcon,
      label: 'Kick',
      action: () => {
        logger.log('Kicking', member.userId);
        onClose();
      },
      adminOnly: true,
      danger: true,
    },
    {
      icon: NoSymbolIcon,
      label: 'Ban',
      action: () => {
        logger.log('Banning', member.userId);
        onClose();
      },
      adminOnly: true,
      danger: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        {...FADE_IN}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        {...SCALE_IN}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-50 min-w-[200px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
      >
        <GlassCard variant="frosted" className="overflow-hidden py-2">
          {/* Header */}
          <div className="border-b border-[var(--token-border-muted)] px-4 py-3">
            <div className="flex items-center gap-3">
              <ThemedAvatar
                src={member.user.avatarUrl}
                alt={displayName}
                size="medium"
                avatarBorderId={getAvatarBorderId(member.user)}
              />
              <div>
                <p className="font-semibold text-white">{displayName}</p>
                <p className="text-xs text-gray-400">@{member.user.username}</p>
              </div>
              {isOwner && <CrownIcon className="h-5 w-5 text-yellow-400" title="Server Owner" />}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              if ('divider' in item) {
                return (
                  <div key={`divider-${index}`} className="my-1 border-t border-[var(--token-border-muted)]" />
                );
              }

              return (
                <motion.button
                  key={item.label}
                  whileHover={{ x: 2 }}
                  onClick={item.action}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    item.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-gray-300 hover:bg-[var(--token-card-bg)] hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
}
