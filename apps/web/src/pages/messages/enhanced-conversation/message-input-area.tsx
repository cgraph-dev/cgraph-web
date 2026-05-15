/**
 * MessageInputArea - message input with sticker picker and send button
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import type { MessageInputAreaProps } from './types';
import { tweens } from '@/lib/animation-presets';

interface MessageInputAreaWithRefProps extends MessageInputAreaProps {
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 */
/**
 * Message Input Area component.
 */
export function MessageInputArea({
  messageInput,
  attachment,
  isSending,
  isVoiceMode,
  replyTo,
  inputContainerRef: _inputContainerRef,
  onVoiceModeChange,
  onMessageChange,
  onFileSelect,
  onClearAttachment,
  onClearReply,
  onVoiceComplete,
  onSend,
}: MessageInputAreaWithRefProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const canSend = Boolean(messageInput.trim() || attachment) && !isSending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    onFileSelect(file);
    setImagePreviewUrl(isImageFile(file) ? URL.createObjectURL(file) : null);
    e.target.value = '';
  }

  function handleClearAttachment(): void {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    onClearAttachment();
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!attachment && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  }, [attachment, imagePreviewUrl]);

  return (
    <GlassCard
      variant="frosted"
      intensity="strong"
      className="flex-shrink-0 rounded-none border-t border-[var(--token-card-border)] p-4"
    >
      {attachment && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--token-card-border)] bg-white/[0.06] px-3 py-2">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt={attachment.name}
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/[0.08]">
              <PaperClipIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{attachment.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleClearAttachment}
            className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white"
            title="Remove attachment"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {replyTo && (
        <div className="border-primary-500/30 bg-primary-500/10 mb-3 flex items-center gap-3 rounded-lg border px-3 py-2">
          <div className="h-10 w-1 rounded-full bg-primary-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary-200">
              Replying to {replyTo.sender?.displayName || replyTo.sender?.username || 'message'}
            </p>
            <p className="truncate text-sm text-white/75">
              {replyTo.content || replyTo.metadata?.filename || replyTo.messageType}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white"
            title="Cancel reply"
            aria-label="Cancel reply"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      <div className="flex items-end gap-2">
        {isVoiceMode ? (
          <VoiceMessageRecorder
            onComplete={onVoiceComplete}
            onCancel={() => onVoiceModeChange(false)}
            maxDuration={120}
            className="min-w-0 flex-1"
          />
        ) : (
          <>
            <div className="flex-1 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.6] backdrop-blur-sm">
              <textarea
                value={messageInput}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full resize-none bg-transparent px-4 py-3 text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[var(--token-card-border)] bg-white/[0.06] p-2.5 text-gray-300 hover:text-white"
              whileTap={{ scale: 0.88 }}
              transition={tweens.smooth}
              title="Attach file"
              aria-label="Attach file"
            >
              <PaperClipIcon className="h-5 w-5" />
            </motion.button>

            {canSend ? (
              <motion.button
                type="button"
                onClick={onSend}
                disabled={isSending}
                className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 p-2.5 text-white disabled:opacity-50"
                whileTap={{ scale: 0.88 }}
                animate={isSending ? { rotate: 360 } : {}}
                transition={tweens.smooth}
                title="Send message"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => onVoiceModeChange(true)}
                disabled={isSending}
                className="rounded-lg border border-[var(--token-card-border)] bg-white/[0.06] p-2.5 text-gray-300 hover:text-white disabled:opacity-50"
                whileTap={{ scale: 0.88 }}
                transition={tweens.smooth}
                title="Record voice message"
                aria-label="Record voice message"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </motion.button>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
