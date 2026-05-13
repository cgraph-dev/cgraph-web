/**
 * MarkReadButtons — "Mark Board Read" / "Mark All Forums Read" buttons
 *
 * Displayed in board headers and forum listings to let users mark
 * all threads as read in bulk.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';

interface MarkBoardReadButtonProps {
  boardId: string;
  onMarked?: () => void;
}

/**
 * MarkBoardReadButton component.
 */
export function MarkBoardReadButton({ boardId, onMarked }: MarkBoardReadButtonProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setIsMarking(true);
    try {
      await http.post(`/api/v1/boards/${boardId}/mark-read`);
      setDone(true);
      onMarked?.();
      setTimeout(() => setDone(false), 2000);
    } catch {
      // silently fail
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.95 }}
      disabled={isMarking}
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-lg bg-[var(--token-card-bg)] px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-[var(--token-hover)] hover:text-white disabled:opacity-50"
    >
      <CheckIcon className="h-3.5 w-3.5" />
      {done ? 'Marked!' : 'Mark Board Read'}
    </motion.button>
  );
}

interface MarkForumReadButtonProps {
  forumId: string;
  onMarked?: () => void;
}

/**
 * MarkForumReadButton component.
 */
export function MarkForumReadButton({ forumId, onMarked }: MarkForumReadButtonProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setIsMarking(true);
    try {
      await http.post(`/api/v1/forums/${forumId}/mark-all-read`);
      setDone(true);
      onMarked?.();
      setTimeout(() => setDone(false), 2000);
    } catch {
      // silently fail
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.95 }}
      disabled={isMarking}
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-lg bg-[var(--token-card-bg)] px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-[var(--token-hover)] hover:text-white disabled:opacity-50"
    >
      <CheckIcon className="h-3.5 w-3.5" />
      {done ? 'All Marked!' : 'Mark All Forums Read'}
    </motion.button>
  );
}
