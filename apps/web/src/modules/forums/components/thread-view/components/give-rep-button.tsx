/**
 * GiveRepButton — MyBB-style +Rep / -Rep button with comment modal
 *
 * Displayed per post, allows users to give +1 or -1 reputation to the
 * post author with an optional comment. Prevents self-rep on the client side.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HandThumbUpIcon, HandThumbDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { http } from '@/lib/api-client';

interface GiveRepButtonProps {
  forumId: string;
  postId: string;
  postAuthorId: string;
  currentUserId: string;
}

/**
 * GiveRepButton component.
 */
export function GiveRepButton({
  forumId,
  postId,
  postAuthorId,
  currentUserId,
}: GiveRepButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  // Don't show for own posts
  if (currentUserId === postAuthorId) return null;

  async function handleGiveRep(value: 1 | -1) {
    setIsSubmitting(true);
    setResult(null);

    try {
      await http.post(`/api/v1/forums/${forumId}/reputation`, {
        post_id: postId,
        value,
        comment: comment.trim() || undefined,
      });
      setResult('success');
      setTimeout(() => {
        setIsOpen(false);
        setResult(null);
        setComment('');
      }, 1500);
    } catch {
      setResult('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 rounded-lg bg-[var(--token-card-bg)] px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-[var(--token-hover)] hover:text-green-400"
      >
        <HandThumbUpIcon className="h-3.5 w-3.5" />
        Give Rep
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={springs.snappy}
              className="w-full max-w-sm rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Give Reputation</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-[var(--token-hover)]"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment (e.g. 'Helpful post!', 'Great answer')"
                maxLength={255}
                rows={2}
                className="mb-4 w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary-500 focus:outline-none"
              />

              {result === 'success' && (
                <p className="mb-3 text-center text-xs text-green-400">Reputation given!</p>
              )}
              {result === 'error' && (
                <p className="mb-3 text-center text-xs text-red-400">
                  Failed — you may have already given rep for this post.
                </p>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  onClick={() => handleGiveRep(1)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600/20 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 disabled:opacity-50"
                >
                  <HandThumbUpIcon className="h-4 w-4" />
                  +Rep
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  onClick={() => handleGiveRep(-1)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600/20 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                >
                  <HandThumbDownIcon className="h-4 w-4" />
                  -Rep
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
