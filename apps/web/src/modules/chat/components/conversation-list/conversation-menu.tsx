
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArchiveBoxIcon,
  BellSlashIcon,
  BookmarkIcon as PinIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import type { ConversationMenuProps } from './types';

export function ConversationMenu({ conversation, onAction }: ConversationMenuProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowDropdown(!showDropdown);
        }}
        className="rounded p-1 hover:bg-[var(--token-card-bg)/0.8]"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] py-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onAction('pin')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
            >
              <PinIcon className="h-4 w-4" />
              {conversation.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => onAction('mute')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
            >
              <BellSlashIcon className="h-4 w-4" />
              {conversation.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={() => onAction('archive')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[var(--token-card-bg)]"
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              Archive
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
