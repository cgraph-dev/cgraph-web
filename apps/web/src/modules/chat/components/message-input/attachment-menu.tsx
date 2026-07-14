/**
 * AttachmentMenu — dropdown menu for attachment options with optional
 * per-file Node pricing.
 *
 * When a file is selected, the menu expands to show a {@link FilePriceInput}
 * toggle so the sender can lock the attachment behind a Node paywall.
 *
 */

import { motion, AnimatePresence } from 'motion/react';
import { PlusCircleIcon, PhotoIcon, DocumentIcon, GifIcon } from '@heroicons/react/24/outline';
import { FilePriceInput } from './file-price-input';
import type { AttachmentMode } from './types';

interface AttachmentMenuProps {
  readonly attachmentMode: AttachmentMode;
  readonly onToggle: (mode: AttachmentMode) => void;
  readonly onFileSelect: () => void;
  /** Whether a file has been selected for attachment. */
  readonly hasFile?: boolean;
  /** Current Node price for the selected file (null = free). */
  readonly nodesPrice?: number | null;
  /** Called when the user changes the Node price (null = free). */
  readonly onNodesPriceChange?: (price: number | null) => void;
}

/**
 * Attachment menu for the chat message input.
 *
 * Shows file/photo/GIF picker buttons in a popover. When a file is
 * already attached, an inline {@link FilePriceInput} appears so the
 * sender can optionally lock the file behind a Node price.
 */
export function AttachmentMenu({
  attachmentMode,
  onToggle,
  onFileSelect,
  hasFile = false,
  nodesPrice = null,
  onNodesPriceChange,
}: AttachmentMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle('file')}
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        aria-pressed={attachmentMode === 'file'}
        aria-label="Attach file"
        title="Attach file"
      >
        <PlusCircleIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {attachmentMode === 'file' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="menu"
            aria-label="Attachment options"
            className="absolute bottom-full left-0 mb-2 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-2 shadow-xl"
          >
            <div className="flex gap-2">
              <button
                type="button"
                role="menuitem"
                onClick={onFileSelect}
                className="flex h-10 w-10 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Attach photo or video"
                title="Photo or video"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onFileSelect}
                className="flex h-10 w-10 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Attach document"
                title="Document"
              >
                <DocumentIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => onToggle('gif')}
                className="flex h-10 w-10 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Open GIF picker"
                title="GIF"
              >
                <GifIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Per-file Node pricing (visible when a file is attached) */}
            {hasFile && onNodesPriceChange && (
              <div className="mt-2">
                <FilePriceInput nodesPrice={nodesPrice ?? null} onChange={onNodesPriceChange} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
