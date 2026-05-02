/**
 * Move Thread Modal — Moderator UI to move a thread to a different board.
 * Shows a hierarchical board picker, redirect toggle, and redirect expiry.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightIcon, XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { http } from '@/modules/forums/store/forumStore.utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MoveThreadModal');

interface Board {
  id: string;
  name: string;
  slug: string;
  parent_board_id: string | null;
}

interface MoveThreadModalProps {
  threadId: string;
  threadTitle: string;
  currentBoardId: string;
  currentBoardName: string;
  forumId: string;
  onClose: () => void;
  onMoved: (targetBoardId: string, targetBoardName: string) => void;
}

const REDIRECT_DAYS_OPTIONS = [
  { value: 0, label: 'No expiry (permanent)' },
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

/** Modal for moving a thread to a different board. */
export function MoveThreadModal({
  threadId,
  threadTitle,
  currentBoardId,
  currentBoardName,
  forumId,
  onClose,
  onMoved,
}: MoveThreadModalProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [targetBoardId, setTargetBoardId] = useState('');
  const [leaveRedirect, setLeaveRedirect] = useState(true);
  const [redirectDays, setRedirectDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      const response = await http.get(`/api/v1/forums/${forumId}/boards`);
      const allBoards: Board[] = response.data?.data ?? [];
      // exclude current board
      setBoards(allBoards.filter((b) => b.id !== currentBoardId));
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchBoards');
    } finally {
      setLoading(false);
    }
  }, [forumId, currentBoardId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  async function handleMove() {
    if (!targetBoardId) return;
    setSaving(true);
    setError(null);

    try {
      await http.post(`/api/v1/threads/${threadId}/move`, {
        target_board_id: targetBoardId,
        leave_redirect: leaveRedirect,
        redirect_days: redirectDays,
      });
      const targetBoard = boards.find((b) => b.id === targetBoardId);
      onMoved(targetBoardId, targetBoard?.name ?? 'another board');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to move thread';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--token-text-primary)]">
                <ArrowsRightLeftIcon className="h-5 w-5" />
                Move Thread
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded p-1 text-[var(--token-text-secondary)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="mb-4 rounded-lg bg-[var(--token-bg-secondary)] p-3">
              <p className="text-sm text-[var(--token-text-secondary)]">Moving thread:</p>
              <p className="font-medium text-[var(--token-text-primary)]">{threadTitle}</p>
              <p className="mt-1 text-xs text-[var(--token-text-secondary)]">
                Current board: {currentBoardName}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[var(--token-text-secondary)]">
                  Destination Board
                </label>
                {loading ? (
                  <div className="h-10 animate-pulse rounded-lg bg-[var(--token-bg-secondary)]" />
                ) : (
                  <select
                    value={targetBoardId}
                    onChange={(e) => setTargetBoardId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  >
                    <option value="">Select a board...</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.parent_board_id ? '  └ ' : ''}
                        {board.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={leaveRedirect}
                    onChange={(e) => setLeaveRedirect(e.target.checked)}
                    className="rounded"
                  />
                  Leave redirect in original board
                </label>

                {leaveRedirect && (
                  <div className="ml-6">
                    <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                      Redirect expires after
                    </label>
                    <select
                      value={redirectDays}
                      onChange={(e) => setRedirectDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                    >
                      {REDIRECT_DAYS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-[var(--token-text-secondary)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMove}
                disabled={!targetBoardId || saving}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <ArrowRightIcon className="h-4 w-4" />
                {saving ? 'Moving...' : 'Move Thread'}
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
