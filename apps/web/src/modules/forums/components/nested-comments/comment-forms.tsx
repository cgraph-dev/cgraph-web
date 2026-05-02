import { motion } from 'motion/react';
import type { ReplyFormProps, EditFormProps } from './types';

export function ReplyForm({
  authorUsername,
  content,
  onContentChange,
  onSubmit,
  onCancel,
}: ReplyFormProps) {
  return (
    <motion.div
      className="mt-3 space-y-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={`Reply to ${authorUsername}...`}
        className="min-h-[80px] w-full resize-none rounded-lg border border-primary-500/30 bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={!content.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-500 disabled:bg-[var(--token-card-bg)] disabled:text-gray-500"
        >
          Reply
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-[var(--token-card-bg)] px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-[var(--token-card-bg)]"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

export function EditForm({ content, onContentChange, onSubmit, onCancel }: EditFormProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="min-h-[100px] w-full resize-none rounded-lg border border-primary-500/30 bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-500"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-[var(--token-card-bg)] px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-[var(--token-card-bg)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
