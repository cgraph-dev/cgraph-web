/**
 * CreatePremiumPostModal
 *
 * Modal dialog for creating a new premium (node-gated) post in a group.
 * Includes title, content, price, and preview-length inputs with the
 * 80/20 revenue split preview.
 *
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { createPremiumPost } from '@/modules/groups/services/premium-post-api';
import type { PremiumPost } from '@/modules/groups/types/premium-post';

const logger = createLogger('CreatePremiumPostModal');

interface CreatePremiumPostModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly groupId: string;
  readonly onCreated: (post: PremiumPost) => void;
}

const MIN_PRICE = 10;
const CREATOR_SHARE = 0.8;
const TITLE_MAX_LENGTH = 200;
const PREVIEW_MIN = 50;
const PREVIEW_MAX = 500;
const PREVIEW_DEFAULT = 200;

/** Create Premium Post Modal. */
export function CreatePremiumPostModal({
  isOpen,
  onClose,
  groupId,
  onCreated,
}: CreatePremiumPostModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceNodes, setPriceNodes] = useState(MIN_PRICE);
  const [previewLength, setPreviewLength] = useState(PREVIEW_DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorEarnings = Math.floor(priceNodes * CREATOR_SHARE);
  const isValid = title.trim().length > 0 && content.trim().length > 0 && priceNodes >= MIN_PRICE;

  function resetForm(): void {
    setTitle('');
    setContent('');
    setPriceNodes(MIN_PRICE);
    setPreviewLength(PREVIEW_DEFAULT);
    setError(null);
  }

  function handleClose(): void {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = Number(e.target.value);
    setPriceNodes(Math.max(MIN_PRICE, Math.round(raw)));
  }

  function handlePreviewLengthChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = Number(e.target.value);
    setPreviewLength(Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, Math.round(raw))));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const post = await createPremiumPost(groupId, {
        title: title.trim(),
        content: content.trim(),
        mediaUrls: [],
        priceNodes,
        previewLength,
      });
      onCreated(post);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create post. Please try again.';
      setError(message);
      logger.error('Failed to create premium post:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl border border-dark-700 bg-dark-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-700 px-5 py-4">
              <h2 className="text-lg font-bold text-white">Create Premium Post</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
              {/* Title */}
              <div className="mb-4">
                <label
                  htmlFor="premium-title"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Title
                </label>
                <input
                  id="premium-title"
                  type="text"
                  maxLength={TITLE_MAX_LENGTH}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title"
                  className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {title.length}/{TITLE_MAX_LENGTH}
                </p>
              </div>

              {/* Content */}
              <div className="mb-4">
                <label
                  htmlFor="premium-content"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Content
                </label>
                <textarea
                  id="premium-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your premium content..."
                  className="w-full resize-y rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Price */}
              <div className="mb-4 rounded-lg border border-dark-700 bg-dark-900/50 p-3">
                <label
                  htmlFor="premium-price"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300"
                >
                  <CurrencyDollarIcon className="h-4 w-4 text-amber-400" />
                  Price (Nodes)
                </label>
                <input
                  id="premium-price"
                  type="number"
                  min={MIN_PRICE}
                  step={1}
                  value={priceNodes}
                  onChange={handlePriceChange}
                  className="w-28 rounded-md border border-dark-600 bg-dark-900 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  You&apos;ll receive 80% ({creatorEarnings} Nodes)
                </p>
              </div>

              {/* Preview Length */}
              <div className="mb-5">
                <label
                  htmlFor="premium-preview-length"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Preview length (characters)
                </label>
                <input
                  id="premium-preview-length"
                  type="number"
                  min={PREVIEW_MIN}
                  max={PREVIEW_MAX}
                  step={10}
                  value={previewLength}
                  onChange={handlePreviewLengthChange}
                  className="w-28 rounded-md border border-dark-600 bg-dark-900 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Non-purchasers see the first {previewLength} characters as a preview.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
