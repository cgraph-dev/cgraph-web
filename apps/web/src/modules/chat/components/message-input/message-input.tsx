/**
 * MessageInput Component
 *
 * Rich message input with multiple media types and features.
 * Features:
 * - Text input with auto-resize
 * - Emoji picker integration
 * - Sticker picker
 * - GIF search
 * - File attachments (images, docs)
 * - Voice message recording
 * - Reply preview
 * - Typing indicator
 * - @mentions with autocomplete
 * - Slash commands
 */

import { lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import { VideoMessageRecorder } from '@/components/media/video-message-recorder';

const GifPicker = lazy(() =>
  import('@/modules/chat/components/gif-picker').then((m) => ({ default: m.GifPicker }))
);
const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({ default: m.EmojiPicker }))
);
import { useMessageInput } from './useMessageInput';
import { ReplyPreview } from './reply-preview';
import { AttachmentsPreview } from './attachments-preview';
import { AttachmentMenu } from './attachment-menu';
import { InputToolbar } from './input-toolbar';
import { MentionAutocomplete } from './mention-autocomplete';
import { SlowModePill } from './slow-mode-pill';
import type { MessageInputProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';

const STICKERS = [
  { id: 'wave', packId: 'cgraph-default', label: 'Wave', emoji: '👋' },
  { id: 'thumbs-up', packId: 'cgraph-default', label: 'Thumbs up', emoji: '👍' },
  { id: 'fire', packId: 'cgraph-default', label: 'Fire', emoji: '🔥' },
  { id: 'party', packId: 'cgraph-default', label: 'Party', emoji: '🎉' },
  { id: 'heart', packId: 'cgraph-default', label: 'Heart', emoji: '💜' },
  { id: 'sparkles', packId: 'cgraph-default', label: 'Sparkles', emoji: '✨' },
] as const;

/** Rich message input with text, attachments, emoji, stickers, GIFs, voice, mentions, and view-once support. */
export function MessageInput({
  conversationId,
  channelId: _channelId,
  replyTo,
  onSend,
  onCancelReply,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  className = '',
  maxAttachments = 10,
  nodesPrice = null,
  onNodesPriceChange,
  slowModeSeconds,
  slowModeRetryAt,
  headerSlot,
}: MessageInputProps) {
  // Channel-scoped composer features are not yet wired; draft autosave is
  // conversation-scoped (Signal parity) and uses `conversationId` only.
  void _channelId;

  const {
    message,
    attachments,
    attachmentMode,
    isRecording,
    isVideoRecording,
    showMentions,
    mentionQuery,
    slowMode,
    inputRef,
    fileInputRef,
    handleChange,
    handleSend,
    handleKeyDown,
    handleFileSelect,
    handleDrop,
    removeAttachment,
    handleVoiceMessage,
    handleVideoMessage,
    handleStickerSelect,
    handleGifSelect,
    handleEmojiSelect,
    handleMentionSelect,
    toggleAttachmentMode,
    setIsRecording,
    setIsVideoRecording,
    setAttachmentMode,
    setShowMentions,
    isViewOnce,
    setIsViewOnce,
  } = useMessageInput({
    onSend,
    onTyping,
    replyTo,
    conversationId,
    slowModeSeconds,
    slowModeRetryAt,
    maxAttachments,
  });

  const hasContent = message.trim().length > 0 || attachments.length > 0;
  const canSend = hasContent && !slowMode.cooldownActive;
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {headerSlot}
      <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />
      {slowMode.cooldownActive && <SlowModePill remainingSeconds={slowMode.remainingSeconds} />}

      {/* Main Input Area */}
      <div
        data-testid="message-composer"
        className="flex min-h-12 flex-wrap items-end gap-1 rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-card-bg)]/95 p-1.5 shadow-sm"
      >
        <AttachmentMenu
          attachmentMode={attachmentMode}
          onToggle={toggleAttachmentMode}
          onFileSelect={() => fileInputRef.current?.click()}
          hasFile={attachments.length > 0}
          nodesPrice={nodesPrice}
          onNodesPriceChange={onNodesPriceChange}
        />

        {/* Text Input */}
        <div className="relative min-w-32 flex-1">
          <textarea
            ref={inputRef}
            data-testid="message-input"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isRecording || isVideoRecording}
            rows={1}
            className="min-h-9 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-5 text-white placeholder-white/35 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ maxHeight: '150px' }}
          />

          <AnimatePresence>
            {showMentions && (
              <MentionAutocomplete
                query={mentionQuery}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentions(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <InputToolbar
          attachmentMode={attachmentMode}
          isRecording={isRecording}
          isVideoRecording={isVideoRecording}
          canSend={canSend}
          disabled={disabled}
          isViewOnce={isViewOnce}
          hasAttachments={attachments.length > 0}
          emojiTriggerRef={emojiTriggerRef}
          onToggleMode={toggleAttachmentMode}
          onToggleRecording={() => {
            setIsVideoRecording(false);
            setIsRecording(!isRecording);
          }}
          onToggleVideoRecording={() => {
            setIsRecording(false);
            setIsVideoRecording(!isVideoRecording);
          }}
          onToggleViewOnce={() => setIsViewOnce(!isViewOnce)}
          onSend={handleSend}
        />
      </div>

      {/* Voice Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            {...FADE_UP}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[var(--token-card-bg)]/90 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm"
          >
            <VoiceMessageRecorder
              onComplete={handleVoiceMessage}
              onCancel={() => setIsRecording(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Note Recording UI */}
      <AnimatePresence>
        {isVideoRecording && (
          <motion.div
            {...FADE_UP}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[var(--token-card-bg)]/90 absolute inset-0 z-10 flex min-h-[24rem] items-center justify-center rounded-xl p-3 backdrop-blur-sm"
          >
            <VideoMessageRecorder
              onComplete={handleVideoMessage}
              onCancel={() => setIsVideoRecording(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker Picker */}
      <AnimatePresence>
        {attachmentMode === 'sticker' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            role="menu"
            aria-label="Sticker picker"
            className="bg-[var(--token-card-bg)]/95 absolute bottom-full left-0 mb-2 grid w-64 grid-cols-3 gap-2 rounded-xl border border-[var(--token-card-border)] p-3 shadow-2xl backdrop-blur-xl"
          >
            {STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                role="menuitem"
                onClick={() => handleStickerSelect(sticker)}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-2xl transition-colors hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={`Send sticker ${sticker.label}`}
                title={sticker.label}
              >
                {sticker.emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {attachmentMode === 'emoji' ? (
          <EmojiPicker
            isOpen
            anchorRef={emojiTriggerRef}
            onSelect={handleEmojiSelect}
            onClose={() => setAttachmentMode('none')}
          />
        ) : null}
      </Suspense>

      {/* GIF Picker — lazy-loaded */}
      <AnimatePresence>
        {attachmentMode === 'gif' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <Suspense fallback={null}>
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setAttachmentMode('none')}
                isOpen={attachmentMode === 'gif'}
                className="relative ml-auto"
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxAttachments !== 1}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default MessageInput;
