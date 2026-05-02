import { motion, AnimatePresence } from 'motion/react';
import {
  EllipsisVerticalIcon,
  ShieldCheckIcon,
  SpeakerXMarkIcon,
  NoSymbolIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { entranceVariants } from '@/lib/animation-presets';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import type { GroupMember, MemberAction } from './types';
import { ROLE_COLORS } from './types';

interface MemberListItemProps {
  member: GroupMember;
  index: number;
  isMenuOpen: boolean;
  onToggleMenu: (memberId: string | null) => void;
  onAction: (memberId: string, action: MemberAction) => void;
  onOpenRoleModal: (memberId: string) => void;
  onUnmute: (memberId: string) => void;
}

export function MemberListItem({
  member,
  index,
  isMenuOpen,
  onToggleMenu,
  onAction,
  onOpenRoleModal,
  onUnmute,
}: MemberListItemProps) {
  return (
    <motion.div
      key={member.id}
      variants={entranceVariants.fadeUp}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ delay: index * 0.03 }}
      className="relative flex items-center justify-between px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <ThemedAvatar
          src={member.avatarUrl}
          alt={member.displayName || member.username}
          size="small"
          avatarBorderId={getAvatarBorderId(member)}
        />
        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{member.displayName || member.username}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}
            >
              {member.role}
            </span>
            {member.isMuted && (
              <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs text-orange-400">
                muted
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">@{member.username}</span>
        </div>
      </div>

      {/* Actions Menu */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleMenu(isMenuOpen ? null : member.id)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] shadow-xl"
            >
              <button
                onClick={() => {
                  onToggleMenu(null);
                  onOpenRoleModal(member.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Change Role
              </button>
              {member.isMuted ? (
                <button
                  onClick={() => {
                    onToggleMenu(null);
                    onUnmute(member.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-400 hover:bg-[var(--token-card-bg)]"
                >
                  <SpeakerXMarkIcon className="h-4 w-4" />
                  Unmute
                </button>
              ) : (
                <button
                  onClick={() => {
                    onToggleMenu(null);
                    onAction(member.id, 'mute');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-400 hover:bg-[var(--token-card-bg)]"
                >
                  <SpeakerXMarkIcon className="h-4 w-4" />
                  Mute
                </button>
              )}
              <button
                onClick={() => {
                  onToggleMenu(null);
                  onAction(member.id, 'kick');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-yellow-400 hover:bg-[var(--token-card-bg)]"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Kick
              </button>
              <button
                onClick={() => {
                  onToggleMenu(null);
                  onAction(member.id, 'ban');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--token-card-bg)]"
              >
                <NoSymbolIcon className="h-4 w-4" />
                Ban
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
