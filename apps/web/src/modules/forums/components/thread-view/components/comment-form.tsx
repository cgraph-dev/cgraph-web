
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CommentFormProps {
  isOpen: boolean;
  content: string;
  setContent: (content: string) => void;
  isSubmitting: boolean;
  primaryColor: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CommentForm({
  isOpen,
  content,
  setContent,
  isSubmitting,
  primaryColor,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const textareaStyle: React.CSSProperties & { '--tw-ring-color': string } = {
    '--tw-ring-color': primaryColor,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 overflow-hidden"
          id="comment-form"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-3 focus:border-primary focus:outline-none"
            rows={4}
            style={textareaStyle}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Cancel
            </button>
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSubmit}
              disabled={!content.trim() || isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: primaryColor,
                color: 'white',
              }}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
