/**
 * ConversationInput Component
 *
 * Message input area with emoji, sticker, GIF pickers, voice recording,
 * and file attachment support.
 */

import { memo, RefObject, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  SparklesIcon,
  MicrophoneIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const GifPicker = lazy(() =>
  import('@/modules/chat/components/gif-picker').then((m) => ({ default: m.GifPicker }))
);
const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({ default: m.EmojiPicker }))
);
import type { Message } from '@/modules/chat/store/chatStore.impl';

interface ConversationInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  isSending: boolean;
  isVoiceMode: boolean;
  setIsVoiceMode: (value: boolean) => void;
  replyTo: Message | null;
  setReplyTo: (value: Message | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  showGifPicker: boolean;
  setShowGifPicker: (value: boolean) => void;
  uiPreferences: {
    enableHaptic: boolean;
  };
  onSend: () => void;
  onTyping: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gif: GifResult) => void;
  onVoiceComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScheduleClick: () => void;
  inputContainerRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
}

function ConversationInputComponent({
  messageInput,
  setMessageInput,
  isSending,
  isVoiceMode,
  setIsVoiceMode,
  replyTo,
  setReplyTo,
  showEmojiPicker,
  setShowEmojiPicker,
  showGifPicker,
  setShowGifPicker,
  uiPreferences,
  onSend,
  onTyping,
  onKeyPress,
  onEmojiSelect,
  onGifSelect,
  onVoiceComplete,
  onFileSelect,
  onScheduleClick,
  inputContainerRef,
  fileInputRef,
}: ConversationInputProps) {
  return (
    <div
      ref={inputContainerRef}
      className="bg-[var(--token-card-bg)]/80 flex-shrink-0 border-t border-[var(--token-card-border)] p-4 backdrop-blur-xl"
    >
      {/* Reply Preview */}
      {replyTo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-primary-500/10 mb-3 flex items-center gap-2 rounded-lg p-2"
        >
          <div className="h-10 w-1 rounded-full bg-primary-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary-400">
              Replying to {replyTo.sender?.displayName || 'User'}
            </p>
            <p className="truncate text-sm text-gray-400">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            aria-label="Cancel reply"
            className="rounded-full p-1 text-gray-500 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Picker Containers — lazy-loaded to reduce initial bundle */}
      <div className="relative">
        <Suspense fallback={null}>
          {showGifPicker && (
            <GifPicker
              isOpen={showGifPicker}
              onClose={() => setShowGifPicker(false)}
              onSelect={onGifSelect}
              className="bottom-16 left-0"
            />
          )}
          {showEmojiPicker && (
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={onEmojiSelect}
              className="bottom-16 left-0"
            />
          )}
        </Suspense>
      </div>

      {isVoiceMode ? (
        <VoiceMessageRecorder
          onComplete={onVoiceComplete}
          onCancel={() => {
            setIsVoiceMode(false);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          maxDuration={120}
          className="w-full"
        />
      ) : (
        <div className="flex items-end gap-3 p-2">
          {/* File Attachment Button */}
          <motion.button
            onClick={() => {
              fileInputRef.current?.click();
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className="hover:bg-primary-500/20 group rounded-xl p-2.5 text-gray-400 transition-all hover:text-primary-400"
            whileHover={{ rotate: -15 }}
            whileTap={{ scale: 0.88 }}
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)]" />
          </motion.button>

          {/* Message Input */}
          <div className="bg-[var(--token-card-bg)]/50 border-primary-500/20 focus-within:border-primary-500/50 flex-1 rounded-xl border transition-all">
            <textarea
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                onTyping();
              }}
              onKeyDown={onKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="max-h-32 w-full resize-none bg-transparent px-4 py-3 text-white placeholder-white/30 focus:outline-none"
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Emoji Button */}
          <motion.button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className={`group rounded-xl p-2.5 transition-all ${
              showEmojiPicker
                ? 'bg-primary-500/20 text-primary-400'
                : 'hover:bg-primary-500/20 text-gray-400 hover:text-primary-400'
            }`}
            whileHover={{ rotate: -10 }}
            whileTap={{ scale: 0.88 }}
            title="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)]" />
          </motion.button>

          {/* GIF Button */}
          <motion.button
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className={`group rounded-xl p-2.5 transition-all ${
              showGifPicker
                ? 'bg-primary-500/20 text-primary-400'
                : 'hover:bg-primary-500/20 text-gray-400 hover:text-primary-400'
            }`}
            whileHover={{ rotate: -15 }}
            whileTap={{ scale: 0.88 }}
            title="Send GIF"
          >
            <SparklesIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)]" />
          </motion.button>

          {/* Schedule Button (only when there's text) */}
          {messageInput.trim() && (
            <motion.button
              onClick={() => {
                onScheduleClick();
                if (uiPreferences.enableHaptic) HapticFeedback.medium();
              }}
              className="hover:bg-purple-500/20 group rounded-xl p-2.5 text-gray-400 transition-all hover:text-purple-400"
              whileHover={{ rotate: -10 }}
              whileTap={{ scale: 0.88 }}
              title="Schedule message"
            >
              <ClockIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </motion.button>
          )}

          {/* Voice / Send Button */}
          {messageInput.trim() ? (
            <motion.button
              onClick={onSend}
              disabled={isSending}
              className="hover:shadow-primary-500/30 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 p-2.5 text-white shadow-lg transition-all disabled:opacity-50"
              whileTap={{ scale: 0.88 }}
              title="Send message"
            >
              {isSending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => {
                setIsVoiceMode(true);
                if (uiPreferences.enableHaptic) HapticFeedback.medium();
              }}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-2.5 text-white shadow-lg transition-all hover:shadow-orange-500/30"
              whileTap={{ scale: 0.88 }}
              title="Record voice message"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

export const ConversationInput = memo(ConversationInputComponent);
