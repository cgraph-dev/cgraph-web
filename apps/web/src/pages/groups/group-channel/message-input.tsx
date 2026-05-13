/**
 * MessageInput Component
 *
 * Message input area with attachments, emoji picker, and reply preview.
 */

import { useState, useRef, lazy, Suspense } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { MessageInputProps } from './types';
import { getDisplayName } from './utils';

const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({
    default: m.EmojiPicker,
  })),
);

/**
 * Formats a file size in bytes to a human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks whether a file has an image MIME type.
 */
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Message Input component.
 */
export function MessageInput({
  channelName,
  placeholder,
  messageInput,
  isSending,
  replyTo,
  attachment,
  onInputChange,
  onKeyDown,
  onSend,
  onCancelReply,
  onEmojiSelect,
  onFileSelect,
  onClearAttachment,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleEmojiSelect(emoji: string): void {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = messageInput.slice(0, start);
      const after = messageInput.slice(end);
      onInputChange(before + emoji + after);
      // Restore cursor position after emoji insertion
      requestAnimationFrame(() => {
        const newPos = start + emoji.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();
      });
    } else {
      onInputChange(messageInput + emoji);
    }
    onEmojiSelect(emoji);
    setShowEmojiPicker(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelect(file);

    // Generate image preview
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleClearAttachment(): void {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    onClearAttachment();
  }

  return (
    <>
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between border-t border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-primary-500" />
            <div>
              <p className="text-xs text-primary-400">
                Replying to{' '}
                {getDisplayName(
                  replyTo.author.username,
                  replyTo.author.displayName,
                )}
              </p>
              <p className="max-w-md truncate text-sm text-gray-400">
                {replyTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center gap-3 border-t border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4 py-2">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt={attachment.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/[0.08]">
              <PaperClipIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{attachment.name}</p>
            <p className="text-xs text-gray-400">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <button
            onClick={handleClearAttachment}
            className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white"
            title="Remove attachment"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      <Suspense fallback={null}>
        {showEmojiPicker && (
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleEmojiSelect}
          />
        )}
      </Suspense>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      {/* Input */}
      <div className="border-t border-[var(--token-border-muted)] p-4">
        <div className="flex items-end gap-2 rounded-lg bg-[var(--token-card-bg)/0.6] px-4 py-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-gray-400 transition-colors hover:text-white"
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={messageInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder ?? `Message #${channelName}`}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-white placeholder-white/30 focus:outline-none"
            style={{ minHeight: '24px' }}
          />

          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-1 transition-colors ${
              showEmojiPicker
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onSend}
            disabled={(!messageInput.trim() && !attachment) || isSending}
            className="p-1 text-primary-400 transition-colors hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Close icon SVG component
 */
function CloseIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
