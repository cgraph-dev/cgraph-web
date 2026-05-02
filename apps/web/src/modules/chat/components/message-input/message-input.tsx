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

import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';

const GifPicker = lazy(() =>
  import('@/modules/chat/components/gif-picker').then((m) => ({ default: m.GifPicker }))
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
  slowModeSeconds,
  slowModeRetryAt,
  headerSlot,
}: MessageInputProps) {
  // Channel-scoped composer features are not yet wired; draft autosave is
  // conversation-scoped (Signal parity) and uses `conversationId` only.
  void _channelId;

  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const {
    message,
    attachments,
    attachmentMode,
    isRecording,
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
    handleGifSelect,
    handleMentionSelect,
    toggleAttachmentMode,
    setIsRecording,
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
  });

  const hasContent = message.trim().length > 0 || attachments.length > 0;
  const canSend = hasContent && !slowMode.cooldownActive;

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
      <GlassCard variant="frosted" className="p-2">
        <div className="flex items-end gap-2">
          <AttachmentMenu
            attachmentMode={attachmentMode}
            onToggle={toggleAttachmentMode}
            onFileSelect={() => fileInputRef.current?.click()}
          />

          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              data-testid="message-input"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className="focus:border-primary-500/50 w-full resize-none rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4 py-2 text-white placeholder-white/30 focus:outline-none"
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
            canSend={canSend}
            disabled={disabled}
            primaryColor={colors.primary}
            isViewOnce={isViewOnce}
            hasAttachments={attachments.length > 0}
            onToggleMode={toggleAttachmentMode}
            onToggleRecording={() => setIsRecording(!isRecording)}
            onToggleViewOnce={() => setIsViewOnce(!isViewOnce)}
            onSend={handleSend}
          />
        </div>
      </GlassCard>

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
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default MessageInput;
