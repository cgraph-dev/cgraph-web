/**
 * EditHistoryModal — View edit history for a forum post
 *
 * Fetches and displays a chronological list of edits with
 * editor name, timestamp, reason, and previous content preview.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { http } from '@/lib/api-client';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';

interface EditEntry {
  id: string;
  edited_by: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  previous_content: string;
  reason: string | null;
  edited_at: string;
}

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  postId: string;
  editCount: number;
}

export function EditHistoryModal({
  isOpen,
  onClose,
  threadId,
  postId,
  editCount,
}: EditHistoryModalProps) {
  const [entries, setEntries] = useState<EditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    http
      .get(`/api/v1/threads/${threadId}/posts/${postId}/edit-history`)
      .then((res: { data: { entries?: EditEntry[] } }) => {
        setEntries(res.data.entries ?? []);
      })
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, threadId, postId]);

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
            className="w-full max-w-lg rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <PencilSquareIcon className="h-4 w-4" />
                Edit History ({editCount} edit{editCount !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-[var(--token-hover)]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {isLoading && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}
              {!isLoading && entries.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No edit history available</p>
              )}
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <ThemedAvatar
                      src={entry.edited_by.avatar_url}
                      alt={entry.edited_by.display_name ?? entry.edited_by.username}
                      size="small"
                      className="!h-6 !w-6"
                    />
                    <span className="text-xs font-medium text-gray-200">
                      {entry.edited_by.display_name ?? entry.edited_by.username}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      Edit #{editCount - idx} — {formatTimeAgo(entry.edited_at)}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="mb-2 text-xs italic text-gray-400">Reason: {entry.reason}</p>
                  )}
                  <details className="group">
                    <summary className="cursor-pointer text-[11px] text-gray-500 group-open:mb-1">
                      Show previous content
                    </summary>
                    <div className="max-h-32 overflow-y-auto rounded bg-[var(--token-bg-secondary)] p-2 text-xs text-gray-400">
                      {entry.previous_content.slice(0, 500)}
                      {entry.previous_content.length > 500 && '...'}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
