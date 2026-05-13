/**
 * ConversationHeader Component
 *
 * Top bar for 1:1 DM conversations. Discord/Telegram-inspired layout:
 * [Avatar + Name/Status] ────────── [Action Buttons]
 *
 * - Avatar is properly sized (40px) to fit within the 56px header
 * - Buttons are grouped with consistent spacing
 * - Status shows typing, online, or last seen
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  FingerPrintIcon,
  BellIcon,
  BellSlashIcon,
} from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { ConnectionStatus } from '@/shared/components/connection-status';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { Conversation } from '@/modules/chat/store/chatStore.impl';
import { springs } from '@/lib/animation-presets';

interface ConversationHeaderProps {
  conversationName: string;
  otherParticipant: Conversation['participants'][0] | undefined;
  isOtherUserOnline: boolean;
  typing: string[];
  uiPreferences: {
    glassEffect: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
    enableGlow: boolean;
    enableHaptic: boolean;
  };
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onToggleSearch: () => void;
  onToggleInfoPanel: () => void;
  onToggleSettings: () => void;
  onToggleE2EETester: () => void;
  onVerifyIdentity: () => void;
  onToggleNotificationSettings?: () => void;
  isMuted?: boolean;
  showInfoPanel: boolean;
  showSettings: boolean;
  formatLastSeen: (lastSeenAt: string | null | undefined) => string;
}

/** Reusable header icon button */
function HeaderButton({
  onClick,
  title,
  isActive = false,
  children,
}: {
  onClick: () => void;
  title: string;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-500/20 text-primary-400'
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
      whileTap={{ scale: 0.9 }}
      title={title}
    >
      {children}
    </motion.button>
  );
}

function ConversationHeaderComponent({
  conversationName,
  otherParticipant,
  isOtherUserOnline,
  typing,
  uiPreferences,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleSearch,
  onToggleInfoPanel,
  onToggleSettings,
  onToggleE2EETester,
  onVerifyIdentity,
  onToggleNotificationSettings,
  isMuted,
  showInfoPanel,
  showSettings,
  formatLastSeen,
}: ConversationHeaderProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  return (
    <header className="z-10 flex h-14 flex-shrink-0 items-center border-b border-white/[0.06] bg-[rgba(12,14,20,0.85)] px-4 backdrop-blur-xl">
      {/* ── Left: Avatar + Name/Status ──────────────────────────── */}
      <div className="flex min-w-0 items-center gap-3">
        <UserProfileCard
          userId={otherParticipant?.user?.id || ''}
          trigger="both"
          className="cursor-pointer"
        >
          <motion.div
            className="relative flex-shrink-0"
            whileHover={{ opacity: 0.85 }}
            whileTap={{ scale: 0.95 }}
          >
            <ThemedAvatar
              src={otherParticipant?.user?.avatarUrl}
              alt={conversationName}
              size="medium"
              avatarBorderId={getAvatarBorderId(otherParticipant?.user)}
              className="h-10 w-10"
            />
            {/* Online status dot */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(12,14,20)] ${
                isOtherUserOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {isOtherUserOnline && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
          </motion.div>
        </UserProfileCard>

        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold leading-tight text-white">
            {conversationName}
          </h2>
          <p className="truncate text-xs leading-tight text-gray-400">
            {typing.length > 0 ? (
              <motion.span
                className="font-medium text-primary-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                typing...
              </motion.span>
            ) : isOtherUserOnline ? (
              <span className="font-medium text-green-400">Online</span>
            ) : (
              formatLastSeen(otherParticipant?.user?.lastSeenAt)
            )}
          </p>
        </div>
      </div>

      {/* ── Center spacer ───────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right: Action buttons ───────────────────────────────── */}
      <div className="flex items-center gap-1">
        <ConnectionStatus />

        {/* E2EE badge */}
        <motion.button
          onClick={() => {
            onToggleE2EETester();
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          className="mr-1 flex items-center gap-1 rounded-md border border-green-500/25 bg-green-500/10 px-2 py-0.5 transition-colors hover:bg-green-500/20"
          whileTap={{ scale: 0.92 }}
          title="E2E Encryption active"
        >
          <LockClosedIcon className="h-3 w-3 text-green-400" />
          <span className="text-[10px] font-bold tracking-wider text-green-400">E2EE</span>
        </motion.button>

        {/* Primary actions - always visible */}
        <HeaderButton onClick={onStartVoiceCall} title="Voice Call">
          <PhoneIcon className="h-[18px] w-[18px]" />
        </HeaderButton>

        <HeaderButton onClick={onStartVideoCall} title="Video Call">
          <VideoCameraIcon className="h-[18px] w-[18px]" />
        </HeaderButton>

        <HeaderButton onClick={onToggleSearch} title="Search Messages">
          <MagnifyingGlassIcon className="h-[18px] w-[18px]" />
        </HeaderButton>

        <HeaderButton onClick={onToggleInfoPanel} title="Chat Info" isActive={showInfoPanel}>
          <InformationCircleIcon className="h-[18px] w-[18px]" />
        </HeaderButton>

        {/* More menu (overflow for less common actions) */}
        <div className="relative">
          <HeaderButton onClick={() => setMoreMenuOpen((p) => !p)} title="More options">
            <EllipsisVerticalIcon className="h-[18px] w-[18px]" />
          </HeaderButton>

          <AnimatePresence>
            {moreMenuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={springs.snappy}
                  className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-xl"
                >
                  <MoreMenuItem
                    icon={<Cog6ToothIcon className="h-4 w-4" />}
                    label="UI Settings"
                    isActive={showSettings}
                    onClick={() => {
                      onToggleSettings();
                      setMoreMenuOpen(false);
                    }}
                  />
                  <MoreMenuItem
                    icon={<FingerPrintIcon className="h-4 w-4" />}
                    label="Verify Identity"
                    onClick={() => {
                      onVerifyIdentity();
                      setMoreMenuOpen(false);
                    }}
                  />
                  {onToggleNotificationSettings && (
                    <MoreMenuItem
                      icon={
                        isMuted ? (
                          <BellSlashIcon className="h-4 w-4" />
                        ) : (
                          <BellIcon className="h-4 w-4" />
                        )
                      }
                      label={isMuted ? 'Unmute' : 'Mute Notifications'}
                      isActive={isMuted}
                      onClick={() => {
                        onToggleNotificationSettings();
                        setMoreMenuOpen(false);
                      }}
                    />
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/** Dropdown menu item */
function MoreMenuItem({
  icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
        isActive
          ? 'bg-primary-500/10 text-primary-400'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export const ConversationHeader = memo(ConversationHeaderComponent);
