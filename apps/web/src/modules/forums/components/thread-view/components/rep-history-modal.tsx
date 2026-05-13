/**
 * RepHistoryModal — View reputation history for a forum member
 *
 * Fetches and displays a list of reputation entries (who gave, value,
 * comment, when) for a specific user in a forum.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { http } from '@/lib/api-client';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';

interface RepEntry {
  id: string;
  value: number;
  comment: string | null;
  from_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  post_id: string | null;
  created_at: string;
}

interface RepHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  forumId: string;
  userId: string;
  username: string;
}

/**
 * RepHistoryModal component.
 */
export function RepHistoryModal({
  isOpen,
  onClose,
  forumId,
  userId,
  username,
}: RepHistoryModalProps) {
  const [entries, setEntries] = useState<RepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    http
      .get(`/api/v1/forums/${forumId}/reputation/${userId}`)
      .then((res: { data: { entries?: RepEntry[] } }) => {
        setEntries(res.data.entries ?? []);
      })
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, forumId, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={springs.snappy}
            className="w-full max-w-md rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Reputation History — {username}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-[var(--token-hover)]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {isLoading && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}
              {!isLoading && entries.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No reputation entries yet</p>
              )}
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-3"
                >
                  <ThemedAvatar
                    src={entry.from_user.avatar_url}
                    alt={entry.from_user.display_name ?? entry.from_user.username}
                    size="small"
                    className="!h-7 !w-7"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-200">
                        {entry.from_user.display_name ?? entry.from_user.username}
                      </span>
                      <span
                        className={
                          entry.value > 0
                            ? 'flex items-center gap-0.5 text-xs font-bold text-green-400'
                            : 'flex items-center gap-0.5 text-xs font-bold text-red-400'
                        }
                      >
                        {entry.value > 0 ? (
                          <HandThumbUpIcon className="h-3 w-3" />
                        ) : (
                          <HandThumbDownIcon className="h-3 w-3" />
                        )}
                        {entry.value > 0 ? '+1' : '-1'}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {formatTimeAgo(entry.created_at)}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="mt-0.5 text-xs text-gray-400">{entry.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
