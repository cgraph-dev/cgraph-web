import { useState, useRef } from 'react';
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
import { RichMediaPickers } from './rich-media-pickers';
import { IconButton } from '@/components/ui/button';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/** Renders the group channel composer with text, attachments, reactions, and voice controls. */
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

    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }

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
      {replyTo && (
        <div className="cgraph-pane flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-[var(--token-interactive-primary)]" />
            <div>
              <p className="text-xs text-[var(--token-interactive-primary)]">
                Replying to {getDisplayName(replyTo.author.username, replyTo.author.displayName)}
              </p>
              <p className="max-w-md truncate text-sm text-[var(--token-text-muted)]">
                {replyTo.content}
              </p>
            </div>
          </div>
          <IconButton
            icon={<XMarkIcon />}
            label="Cancel reply"
            size="sm"
            onClick={onCancelReply}
          />
        </div>
      )}

      {attachment && (
        <div className="cgraph-pane flex items-center gap-3 border-t px-4 py-2">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt={attachment.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--product-surface-recessed)]">
              <PaperClipIcon className="h-6 w-6 text-[var(--token-text-muted)]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[var(--token-text-primary)]">{attachment.name}</p>
            <p className="text-xs text-[var(--token-text-muted)]">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <IconButton
            icon={<XMarkIcon />}
            label="Remove attachment"
            size="sm"
            onClick={handleClearAttachment}
          />
        </div>
      )}

      <RichMediaPickers
        showEmojiPicker={showEmojiPicker}
        showGifPicker={showGifPicker}
        showStickerPicker={showStickerPicker}
        onEmojiClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        onGifClose={() => setShowGifPicker(false)}
        onGifSelect={(gif) => {
          onGifSelect(gif);
          closeRichPickers();
        }}
        onStickerSelect={(sticker) => {
          onStickerSelect(sticker);
          closeRichPickers();
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      <div className="border-t border-[var(--product-line)] p-3 sm:p-4">
        <div className="cgraph-field flex flex-col gap-1 px-2 py-1 sm:flex-row sm:items-end">
          {isVoiceMode ? (
            <VoiceMessageRecorder
              onComplete={onVoiceComplete}
              onCancel={() => onVoiceModeChange(false)}
              maxDuration={120}
              className="min-w-0 flex-1"
            />
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder ?? `Message #${channelName}`}
                rows={1}
                className="max-h-32 min-h-10 w-full min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[var(--token-text-primary)] placeholder:text-[var(--token-text-muted)] focus:outline-none"
                style={{ minHeight: '24px' }}
              />

              <div className="flex shrink-0 items-center justify-between gap-0.5 sm:justify-start">
                <IconButton
                  icon={<PaperClipIcon />}
                  label="Attach file"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                />

                <IconButton
                  icon={<FaceSmileIcon />}
                  label="Open emoji picker"
                  size="sm"
                  variant={showEmojiPicker ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setShowEmojiPicker((prev) => !prev);
                    setShowGifPicker(false);
                    setShowStickerPicker(false);
                  }}
                  aria-pressed={showEmojiPicker}
                />

                <IconButton
                  icon={<FaceSmileIcon />}
                  label="Open sticker picker"
                  size="sm"
                  variant={showStickerPicker ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setShowStickerPicker((prev) => !prev);
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                  }}
                  aria-pressed={showStickerPicker}
                />

                <IconButton
                  icon={<SparklesIcon />}
                  label="Open GIF picker"
                  size="sm"
                  variant={showGifPicker ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setShowGifPicker((prev) => !prev);
                    setShowEmojiPicker(false);
                    setShowStickerPicker(false);
                  }}
                  aria-pressed={showGifPicker}
                />

                <IconButton
                  icon={<MicrophoneIcon />}
                  label="Record voice message"
                  size="sm"
                  onClick={() => {
                    closeRichPickers();
                    onVoiceModeChange(true);
                  }}
                  disabled={isSending}
                />

                <IconButton
                  icon={<PaperAirplaneIcon />}
                  label="Send message"
                  size="sm"
                  variant="primary"
                  onClick={onSend}
                  disabled={!canSend}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
