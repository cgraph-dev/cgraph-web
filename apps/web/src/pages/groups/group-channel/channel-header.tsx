/**
 * ChannelHeader Component
 *
 * Header bar with channel info and actions.
 */

import { motion } from 'motion/react';
import {
  HashtagIcon,
  BookmarkIcon,
  BellIcon,
  BellSlashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { ChannelHeaderProps } from './types';

const channelIcons = {
  text: HashtagIcon,
  announcement: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
} as const;

/**
 */
/**
 * Channel Header component.
 */
export function ChannelHeader({
  channelName,
  channelTopic,
  channelType = 'text',
  channelLabel,
  isSearchOpen,
  onToggleSearch,
  notificationLevel = 'mentions',
  isSavingNotifications,
  onToggleNotifications,
  showMembers,
  onToggleMembers,
  showPinnedMessages,
  onTogglePinnedMessages,
  pinnedCount,
}: ChannelHeaderProps) {
  const Icon = channelIcons[channelType] ?? HashtagIcon;
  const NotificationIcon = notificationLevel === 'none' ? BellSlashIcon : BellIcon;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-2 sm:px-4 lg:h-12">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-5 w-5 text-gray-400" />
        <span className="truncate font-semibold text-white">{channelName}</span>
        {channelLabel && (
          <span className="hidden rounded bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60 sm:inline">
            {channelLabel}
          </span>
        )}
        {channelTopic && (
          <div className="hidden min-w-0 items-center sm:flex">
            <div className="mx-2 h-5 w-px bg-white/[0.08]" />
            <span className="max-w-md truncate text-sm text-gray-400">{channelTopic}</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        {onToggleSearch && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onToggleSearch}
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:h-8 lg:w-8 ${
              isSearchOpen
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Search Messages"
            aria-pressed={isSearchOpen}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </motion.button>
        )}
        {onToggleNotifications && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onToggleNotifications}
            disabled={isSavingNotifications}
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors disabled:cursor-wait disabled:opacity-60 lg:h-8 lg:w-8 ${
              notificationLevel === 'none'
                ? 'bg-white/[0.08] text-red-300'
                : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
            }`}
            title={notificationLevel === 'none' ? 'Unmute Channel' : 'Mute Channel'}
            aria-pressed={notificationLevel === 'none'}
          >
            <NotificationIcon className="h-5 w-5" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onTogglePinnedMessages}
          className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:h-8 lg:w-8 ${
            showPinnedMessages
              ? 'bg-white/[0.08] text-white'
              : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
          }`}
          title="Pinned Messages"
        >
          <BookmarkIcon className="h-5 w-5" />
          {(pinnedCount ?? 0) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
              {pinnedCount}
            </span>
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onToggleMembers}
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:h-8 lg:w-8 ${
            showMembers
              ? 'bg-white/[0.08] text-white'
              : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          <UserGroupIcon className="h-5 w-5" />
        </motion.button>
      </div>
    </header>
  );
}
