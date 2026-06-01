/**
 * ConversationItem Component
 *
 * Single conversation item in the sidebar list.
 */

import { durations } from '@cgraph-dev/animation-constants';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  BellIcon,
  BellSlashIcon,
  CheckCircleIcon,
  CheckIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  FolderIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getConversationName, getConversationAvatar, getConversationAvatarBorderId } from './utils';
import type { RoutedConversationItemProps } from './sidebar-types';
import { conversationMatchesSpace } from './conversation-spaces';
import { tweens, loop, springs } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 */
/**
 * Conversation Item component.
 */
export function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onlineStatus,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onPin,
  onMute,
  spaces,
  onToggleSpace,
  showArchived,
}: RoutedConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const name = getConversationName(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const avatarBorderId = getConversationAvatarBorderId(conversation, currentUserId);
  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  // Use Phoenix Presence for real-time online status (single source of truth)
  const isOnline = otherParticipant
    ? onlineStatus[`${conversation.id}-${otherParticipant.userId}`] || false
    : false;

  function handleMarkAsRead(): void {
    if (conversation.unreadCount === 0) return;
    setIsMenuOpen(false);
    onMarkAsRead(conversation.id);
  }

  function handleMarkAsUnread(): void {
    setIsMenuOpen(false);
    onMarkAsUnread(conversation.id);
  }

  function handleArchive(): void {
    setIsMenuOpen(false);
    onArchive(conversation.id);
  }

  function handleUnarchive(): void {
    setIsMenuOpen(false);
    onUnarchive(conversation.id);
  }

  function handlePinToggle(): void {
    setIsMenuOpen(false);
    onPin(conversation.id, !conversation.isPinned);
  }

  function handleMuteToggle(): void {
    setIsMenuOpen(false);
    onMute(conversation.id, !conversation.isMuted);
  }

  function handleSpaceToggle(spaceId: string, shouldInclude: boolean): void {
    onToggleSpace(conversation.id, spaceId, shouldInclude);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        HapticFeedback.selection();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NavLink
        to={`/messages/${conversation.id}`}
        className={`group relative flex items-center gap-3 px-4 py-3 pr-12 transition-all duration-300 ${
          isActive
            ? 'bg-primary-500/10 border-primary-500/20 border-l shadow-[rgba(255,255,255,0.02)_0px_1px_1px_inset,0_4px_24px_rgba(0,0,0,0.2)]'
            : 'border-l border-transparent hover:bg-[var(--token-bg-primary)/0.3]'
        }`}
      >
        {/* Glow effect on hover */}
        {isHovered && !isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-transparent backdrop-blur-[2px]"
            {...FADE_IN}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Indicator Line */}
        <div
          className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-500 ${
            isActive
              ? 'h-full bg-primary-400 shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand-purple)_35%,transparent)]'
              : 'h-0 bg-transparent'
          }`}
        />

        {/* Avatar with subtle border */}
        <motion.div className="relative z-10 flex-shrink-0">
          <div
            className={`h-12 w-12 overflow-hidden rounded-full p-0.5 transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-br from-primary-500 to-violet-600'
                : isHovered
                  ? 'from-primary-500/50 to-violet-600/50 bg-gradient-to-br'
                  : 'bg-[var(--token-card-bg)/0.6]'
            }`}
          >
            {avatar ? (
              <ThemedAvatar
                src={avatar}
                alt={name}
                size="medium"
                className="h-full w-full"
                avatarBorderId={avatarBorderId}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-300 to-violet-300 bg-clip-text text-sm font-bold text-transparent">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {conversation.type === 'direct' && isOnline && (
            <motion.div
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-dark-900 bg-green-500 shadow-lg"
              animate={{
                boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 6px rgba(34, 197, 94, 0)'],
              }}
              transition={loop(tweens.ambient)}
            />
          )}
        </motion.div>

        {/* Content */}
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`flex min-w-0 items-center gap-1.5 truncate font-semibold transition-colors ${
                conversation.unreadCount > 0
                  ? 'text-white'
                  : isActive
                    ? 'font-bold text-white'
                    : 'text-white/70'
              }`}
            >
              {conversation.isPinned && <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="truncate">{name}</span>
              {conversation.isMuted && <BellSlashIcon className="h-3.5 w-3.5 flex-shrink-0" />}
            </span>
            {conversation.lastMessage && (
              <span
                className={`flex-shrink-0 text-xs transition-colors ${
                  isActive ? 'font-medium text-white/60' : 'text-gray-500/80'
                }`}
              >
                {formatTimeAgo(conversation.lastMessage.createdAt, { addSuffix: false })}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p
              className={`truncate text-sm transition-colors ${
                conversation.unreadCount > 0 ? 'font-medium text-white/80' : 'text-gray-500'
              }`}
            >
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
            <AnimatePresence>
              {conversation.unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: 0,
                  }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{
                    scale: {
                      duration: durations.loop.ms / 1000,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    rotate: springs.wobbly,
                  }}
                  className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.1] px-1.5 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.5),rgba(255,255,255,0.1)_0px_1px_1px_inset] backdrop-blur-md"
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </NavLink>

      <div
        className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 transition-opacity ${
          isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsMenuOpen((open) => !open);
          }}
          className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/50 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
          aria-label={`Open actions for ${name}`}
          title="Conversation actions"
        >
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={tweens.fast}
              className="bg-[var(--token-card-bg)]/95 absolute right-0 top-full mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-[var(--token-card-border)] py-1 shadow-xl backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={handleMarkAsRead}
                disabled={conversation.unreadCount === 0}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Mark as read
              </button>
              <button
                type="button"
                onClick={handleMarkAsUnread}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Mark as unread
              </button>
              <button
                type="button"
                onClick={handlePinToggle}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
              >
                <MapPinIcon className="h-4 w-4" />
                {conversation.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                type="button"
                onClick={handleMuteToggle}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
              >
                {conversation.isMuted ? (
                  <BellIcon className="h-4 w-4" />
                ) : (
                  <BellSlashIcon className="h-4 w-4" />
                )}
                {conversation.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={showArchived ? handleUnarchive : handleArchive}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
              >
                {showArchived ? (
                  <ArchiveBoxXMarkIcon className="h-4 w-4" />
                ) : (
                  <ArchiveBoxIcon className="h-4 w-4" />
                )}
                {showArchived ? 'Unarchive' : 'Archive'}
              </button>
              {spaces.length > 0 && (
                <div className="mt-1 border-t border-white/10 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
                    <FolderIcon className="h-3.5 w-3.5" />
                    Spaces
                  </div>
                  {spaces.map((space) => {
                    const isInSpace = conversationMatchesSpace(conversation, space);
                    return (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => handleSpaceToggle(space.id, !isInSpace)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
                      >
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                          {isInSpace ? (
                            <CheckIcon className="h-4 w-4 text-primary-300" />
                          ) : (
                            <FolderIcon className="h-4 w-4 text-white/35" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {space.emoji ? `${space.emoji} ` : ''}
                          {space.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
