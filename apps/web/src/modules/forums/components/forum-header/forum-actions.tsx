/**
 * Forum Actions Component
 *
 * Action buttons for forum header (join, subscribe, menu)
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cog6ToothIcon,
  BellIcon,
  BellSlashIcon,
  ShareIcon,
  UserGroupIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import type { ForumActionsProps } from './types';

export const ForumActions = memo(function ForumActions({
  primaryColor,
  isMember,
  isSubscribed,
  canManage,
  isJoining,
  isSubscribing,
  showMoreMenu,
  onCreatePost,
  onJoin,
  onSubscribe,
  onSettings,
  onCopyLink,
  onToggleMenu,
}: ForumActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {onCreatePost && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onCreatePost}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="h-5 w-5" />
          Create Post
        </motion.button>
      )}

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onJoin}
        disabled={isJoining}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          isMember ? 'bg-[var(--token-card-bg)] text-gray-300 hover:bg-red-500/20 hover:text-red-400' : ''
        }`}
        style={!isMember ? { backgroundColor: primaryColor } : {}}
      >
        <UserGroupIcon className="h-5 w-5" />
        {isMember ? 'Leave' : 'Join'}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onSubscribe}
        disabled={isSubscribing}
        className={`rounded-lg p-2 transition-colors ${
          isSubscribed
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-[var(--token-card-bg)] text-gray-400 hover:text-white'
        }`}
        title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      >
        {isSubscribed ? <BellSlashIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
      </motion.button>

      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onToggleMenu}
          className="rounded-lg bg-[var(--token-card-bg)] p-2 text-gray-400 hover:text-white"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] py-1 shadow-xl"
            >
              <button
                onClick={onCopyLink}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
              {canManage && onSettings && (
                <button
                  onClick={onSettings}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[var(--token-card-bg)]"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Settings
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
