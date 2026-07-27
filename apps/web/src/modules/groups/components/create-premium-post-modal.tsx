/**
 * CreatePremiumPostModal
 *
 * Modal dialog for creating a new premium (node-gated) post in a group.
 * Includes title, content, price, and preview-length inputs with the
 * 80/20 revenue split preview.
 *
 */

import { useState } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent ariaLabel="Create Premium Post" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Premium Post</DialogTitle>
          <DialogDescription>
            Set the preview and Node price before publishing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="mt-5 space-y-4">
            <label
              htmlFor="premium-title"
              className="block text-sm font-medium text-[var(--token-text-secondary)]"
            >
                  Title
              <input
                id="premium-title"
                type="text"
                maxLength={TITLE_MAX_LENGTH}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="cgraph-field mt-2 w-full"
                required
              />
              <span className="mt-1 block text-right text-xs text-[var(--token-text-muted)]">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </label>

            <label
              htmlFor="premium-content"
              className="block text-sm font-medium text-[var(--token-text-secondary)]"
            >
                  Content
              <textarea
                id="premium-content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your premium content..."
                className="cgraph-field mt-2 w-full resize-y"
                required
              />
            </label>

            <div className="cgraph-section-surface p-4" data-cgraph-material="recessed">
              <label
                htmlFor="premium-price"
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--token-text-secondary)]"
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
                className="cgraph-field mt-2 w-28"
              />
              <p className="mt-1.5 text-xs text-[var(--token-text-muted)]">
                You&apos;ll receive 80% ({creatorEarnings} Nodes)
              </p>
            </div>

            <label
              htmlFor="premium-preview-length"
              className="block text-sm font-medium text-[var(--token-text-secondary)]"
            >
              Preview length (characters)
              <input
                id="premium-preview-length"
                type="number"
                min={PREVIEW_MIN}
                max={PREVIEW_MAX}
                step={10}
                value={previewLength}
                onChange={handlePreviewLengthChange}
                className="cgraph-field mt-2 block w-28"
              />
              <span className="mt-1 block text-xs text-[var(--token-text-muted)]">
                Non-purchasers see the first {previewLength} characters as a preview.
              </span>
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="secondary" animated={false} onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              animated={false}
              disabled={!isValid}
              isLoading={isLoading}
            >
              Create Post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
