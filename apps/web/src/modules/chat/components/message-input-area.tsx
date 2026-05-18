/**
 * Message composition input area.
 */
import { useRef, RefObject, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  SparklesIcon,
  ClockIcon,
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
import type { UIPreferences } from './message-bubble';
import { tweens, loop, springs } from '@/lib/animation-presets';

export interface MessageInputAreaProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  isSending: boolean;
  isVoiceMode: boolean;
  setIsVoiceMode: (value: boolean) => void;
  showGifPicker: boolean;
  setShowGifPicker: (value: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  uiPreferences: UIPreferences;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTyping: () => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onVoiceComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onGifSelect: (gif: GifResult) => void;
  onEmojiSelect: (emoji: string) => void;
  onScheduleClick?: () => void;
}

/**
 * MessageInputArea - The input area component for sending messages
 * Includes text input, emoji/sticker/GIF pickers, voice recorder, and send button
 */
export function MessageInputArea({
  messageInput,
  setMessageInput,
  isSending,
  isVoiceMode,
  setIsVoiceMode,
  showGifPicker,
  setShowGifPicker,
  showEmojiPicker,
  setShowEmojiPicker,
  uiPreferences,
  fileInputRef,
  onTyping,
  onSend,
  onKeyPress,
  onVoiceComplete,
  onGifSelect,
  onEmojiSelect,
  onScheduleClick,
}: MessageInputAreaProps) {
  const inputContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative z-10 px-4 pb-4 pt-2">
      {/* Outer glow border */}
      <div className="from-primary-500/20 via-purple-500/10 to-primary-500/20 rounded-2xl bg-gradient-to-r p-[1px] shadow-[0_-4px_20px_color-mix(in_srgb,var(--color-brand-purple)_8%,transparent)]">
        {/* Inner card */}
        <div className="bg-[var(--token-input-bg)]/95 rounded-2xl backdrop-blur-xl">
          {/* Sticker & GIF Pickers - lazy-loaded, positioned above input */}
          <div className="relative" ref={inputContainerRef}>
            <Suspense fallback={null}>
              {showGifPicker && (
                <GifPicker
                  isOpen={showGifPicker}
                  onClose={() => setShowGifPicker(false)}
                  onSelect={onGifSelect}
                  className="absolute bottom-16 left-0"
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
            <div className="flex items-end gap-2 px-3 py-2.5">
              {/* Attach file button */}
              <motion.button
                onClick={() => {
                  fileInputRef.current?.click();
                  if (uiPreferences.enableHaptic) HapticFeedback.light();
                }}
                className="group flex-shrink-0 rounded-lg p-2 text-gray-500 transition-all hover:bg-[var(--token-card-bg)/0.6] hover:text-primary-400"
                whileHover={{ rotate: -15 }}
                whileTap={{ scale: 0.88 }}
                title="Attach file"
              >
                <PaperClipIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)]" />
              </motion.button>

              {/* Text input */}
              <div className="focus-within:border-primary-500/40 flex-1 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)/0.3] transition-all focus-within:bg-[var(--token-bg-secondary)] focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)]">
                <textarea
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    onTyping();
                  }}
                  onKeyDown={onKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="max-h-32 w-full resize-none bg-transparent px-4 py-2.5 text-[14px] leading-relaxed text-white placeholder-white/30 focus:outline-none"
                  style={{ minHeight: '42px' }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-shrink-0 items-center gap-0.5">
                {/* Emoji Button */}
                <motion.button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowGifPicker(false);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className={`group rounded-lg p-2 transition-all ${
                    showEmojiPicker
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-500 hover:bg-[var(--token-card-bg)/0.6] hover:text-primary-400'
                  }`}
                  whileHover={{ rotate: -10 }}
                  whileTap={{ scale: 0.88 }}
                  title="Add emoji"
                >
                  <FaceSmileIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)]" />
                </motion.button>

                {/* GIF Button */}
                <motion.button
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowEmojiPicker(false);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className={`group rounded-lg p-2 transition-all ${
                    showGifPicker
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-500 hover:bg-[var(--token-card-bg)/0.6] hover:text-primary-400'
                  }`}
                  whileHover={{ rotate: -15 }}
                  whileTap={{ scale: 0.88 }}
                  title="Send GIF"
                >
                  <SparklesIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)]" />
                </motion.button>

                {/* Schedule Button */}
                {messageInput.trim() && onScheduleClick && (
                  <motion.button
                    onClick={() => {
                      onScheduleClick();
                      if (uiPreferences.enableHaptic) HapticFeedback.light();
                    }}
                    className="group rounded-lg p-2 text-gray-500 transition-all hover:bg-[var(--token-card-bg)/0.6] hover:text-purple-400"
                    whileHover={{ rotate: -10 }}
                    whileTap={{ scale: 0.88 }}
                    title="Schedule message"
                  >
                    <ClockIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]" />
                  </motion.button>
                )}

                {/* Morphing Send/Mic Button */}
                <AnimatePresence mode="wait">
                  {messageInput.trim() ? (
                    <motion.button
                      key="send"
                      onClick={() => {
                        onSend();
                        if (uiPreferences.enableHaptic) HapticFeedback.success();
                      }}
                      disabled={isSending}
                      className="shadow-primary-500/20 hover:shadow-primary-500/30 group relative ml-1 overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 p-2.5 text-white shadow-lg transition-all hover:from-primary-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={springs.bouncy}
                      whileTap={{ scale: 0.88 }}
                    >
                      {uiPreferences.enableGlow && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 transition-opacity group-hover:opacity-50"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={loop(tweens.ambient)}
                        />
                      )}
                      <PaperAirplaneIcon className="relative z-10 h-5 w-5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="mic"
                      onClick={() => {
                        setIsVoiceMode(true);
                        if (uiPreferences.enableHaptic) HapticFeedback.medium();
                      }}
                      disabled={isSending}
                      className="group ml-1 rounded-xl border border-[var(--token-border-muted)] p-2.5 text-gray-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                      title="Record voice message"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -180 }}
                      transition={springs.bouncy}
                      whileTap={{ scale: 0.88 }}
                    >
                      <MicrophoneIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageInputArea;
