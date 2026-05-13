/**
 * ChannelHeader Component
 *
 * Header bar with channel info and actions.
 */

import { motion } from 'motion/react';
import {
  HashtagIcon,
  BookmarkIcon,
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
  showMembers,
  onToggleMembers,
  showPinnedMessages,
  onTogglePinnedMessages,
  pinnedCount,
}: ChannelHeaderProps) {
  const Icon = channelIcons[channelType] ?? HashtagIcon;

  return (
    <header className="flex h-12 items-center justify-between border-b border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-400" />
        <span className="font-semibold text-white">{channelName}</span>
        {channelLabel && (
          <span className="rounded bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
            {channelLabel}
          </span>
        )}
        {channelTopic && (
          <>
            <div className="mx-2 h-5 w-px bg-white/[0.08]" />
            <span className="max-w-md truncate text-sm text-gray-400">
              {channelTopic}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onTogglePinnedMessages}
          className={`relative rounded p-1.5 transition-colors ${
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
          className={`rounded p-1.5 transition-colors ${
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
