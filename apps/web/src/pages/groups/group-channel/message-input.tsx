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
  MicrophoneIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { MessageInputProps } from './types';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import { getDisplayName } from './utils';

const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({
    default: m.EmojiPicker,
  }))
);
const GifPicker = lazy(() =>
  import('@/modules/chat/components/gif-picker').then((m) => ({ default: m.GifPicker }))
);

const STICKERS = [
  { id: 'wave', packId: 'cgraph-default', label: 'Wave', emoji: '👋' },
  { id: 'thumbs-up', packId: 'cgraph-default', label: 'Thumbs up', emoji: '👍' },
  { id: 'fire', packId: 'cgraph-default', label: 'Fire', emoji: '🔥' },
  { id: 'party', packId: 'cgraph-default', label: 'Party', emoji: '🎉' },
  { id: 'heart', packId: 'cgraph-default', label: 'Heart', emoji: '💜' },
  { id: 'sparkles', packId: 'cgraph-default', label: 'Sparkles', emoji: '✨' },
] as const;

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
  isVoiceMode,
  onInputChange,
  onKeyDown,
  onSend,
  onVoiceModeChange,
  onCancelReply,
  onEmojiSelect,
  onGifSelect,
  onStickerSelect,
  onVoiceComplete,
  onFileSelect,
  onClearAttachment,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(messageInput.trim() || attachment) && !isSending;

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

  function closeRichPickers(): void {
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowStickerPicker(false);
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
                Replying to {getDisplayName(replyTo.author.username, replyTo.author.displayName)}
              </p>
              <p className="max-w-md truncate text-sm text-gray-400">{replyTo.content}</p>
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
            <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
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

      {/* Rich media pickers */}
      <Suspense fallback={null}>
        {showEmojiPicker && (
          <div className="fixed bottom-24 left-36 z-50">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={handleEmojiSelect}
            />
          </div>
        )}

        {showGifPicker && (
          <div className="fixed bottom-24 left-36 z-50">
            <GifPicker
              isOpen={showGifPicker}
              onClose={() => setShowGifPicker(false)}
              onSelect={(gif) => {
                onGifSelect(gif);
                closeRichPickers();
              }}
              className="relative"
            />
          </div>
        )}
      </Suspense>

      {showStickerPicker && (
        <div
          role="menu"
          aria-label="Sticker picker"
          className="bg-[var(--token-card-bg)]/95 fixed bottom-24 left-36 z-50 grid w-64 grid-cols-3 gap-2 rounded-xl border border-[var(--token-card-border)] p-3 shadow-2xl backdrop-blur-xl"
        >
          {STICKERS.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onStickerSelect(sticker);
                closeRichPickers();
              }}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-2xl transition-colors hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Send sticker ${sticker.label}`}
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
        </div>
      )}

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
          {isVoiceMode ? (
            <VoiceMessageRecorder
              onComplete={onVoiceComplete}
              onCancel={() => onVoiceModeChange(false)}
              maxDuration={120}
              className="min-w-0 flex-1"
            />
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-gray-400 transition-colors hover:text-white"
                title="Attach file"
                aria-label="Attach file"
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
                onClick={() => {
                  setShowEmojiPicker((prev) => !prev);
                  setShowGifPicker(false);
                  setShowStickerPicker(false);
                }}
                className={`p-1 transition-colors ${
                  showEmojiPicker ? 'text-primary-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Add emoji"
                aria-label="Open emoji picker"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  setShowStickerPicker((prev) => !prev);
                  setShowEmojiPicker(false);
                  setShowGifPicker(false);
                }}
                className={`p-1 transition-colors ${
                  showStickerPicker ? 'text-primary-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Send sticker"
                aria-label="Open sticker picker"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  setShowGifPicker((prev) => !prev);
                  setShowEmojiPicker(false);
                  setShowStickerPicker(false);
                }}
                className={`p-1 transition-colors ${
                  showGifPicker ? 'text-primary-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Send GIF"
                aria-label="Open GIF picker"
              >
                <SparklesIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  closeRichPickers();
                  onVoiceModeChange(true);
                }}
                disabled={isSending}
                className="p-1 text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                title="Record voice message"
                aria-label="Record voice message"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>

              <button
                onClick={onSend}
                disabled={!canSend}
                className="p-1 text-primary-400 transition-colors hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
                title="Send message"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </>
          )}
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
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
