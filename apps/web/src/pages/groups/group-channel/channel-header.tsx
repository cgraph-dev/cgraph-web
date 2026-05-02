/**
 * ChannelHeader Component
 *
 * Header bar with channel info and actions.
 */

import { motion } from 'motion/react';
import {
  HashtagIcon,
  BellIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { ChannelHeaderProps } from './types';

export function ChannelHeader({
  channelName,
  channelTopic,
  showMembers,
  onToggleMembers,
  showPinnedMessages,
  onTogglePinnedMessages,
  pinnedCount,
}: ChannelHeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4">
      <div className="flex items-center gap-2">
        <HashtagIcon className="h-5 w-5 text-gray-400" />
        <span className="font-semibold text-white">{channelName}</span>
        {channelTopic && (
          <>
            <div className="mx-2 h-5 w-px bg-white/[0.08]" />
            <span className="max-w-md truncate text-sm text-gray-400">{channelTopic}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.88 }}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <BellIcon className="h-5 w-5" />
        </motion.button>
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
        <div className="relative mx-2">
          <input
            type="text"
            placeholder="Search"
            className="peer w-36 rounded-xl bg-[var(--token-card-bg)] py-1 pl-8 pr-2 text-sm text-white placeholder-white/30 transition-all focus:placeholder:text-transparent focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 z-10 transition-opacity duration-200 peer-focus:opacity-0" />
        </div>
      </div>
    </header>
  );
}
