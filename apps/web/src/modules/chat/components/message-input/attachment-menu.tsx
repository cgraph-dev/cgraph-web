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
      <motion.button
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggle('file')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
        aria-label="Attach file"
        title="Attach file"
      >
        <PlusCircleIcon className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {attachmentMode === 'file' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] p-2 shadow-xl"
          >
            <div className="flex gap-2">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.9 }}
                onClick={onFileSelect}
                className="rounded-xl bg-blue-500/20 p-3 text-blue-400 hover:bg-blue-500/30"
                aria-label="Attach photo or video"
                title="Photo or video"
              >
                <PhotoIcon className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.9 }}
                onClick={onFileSelect}
                className="rounded-xl bg-green-500/20 p-3 text-green-400 hover:bg-green-500/30"
                aria-label="Attach document"
                title="Document"
              >
                <DocumentIcon className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggle('gif')}
                className="bg-purple-500/20 hover:bg-purple-500/30 rounded-xl p-3 text-purple-400"
                aria-label="Open GIF picker"
                title="GIF"
              >
                <GifIcon className="h-6 w-6" />
              </motion.button>
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
