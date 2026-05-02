/**
 * MessageInputArea - message input with sticker picker and send button
 */

import { motion } from 'motion/react';
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { MessageInputAreaProps } from './types';
import { tweens } from '@/lib/animation-presets';

interface MessageInputAreaWithRefProps extends MessageInputAreaProps {
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageInputArea({
  messageInput,
  isSending,
  inputContainerRef: _inputContainerRef,
  onMessageChange,
  onSend,
}: MessageInputAreaWithRefProps) {
  return (
    <GlassCard
      variant="frosted"
      intensity="strong"
      className="flex-shrink-0 rounded-none border-t border-[var(--token-card-border)] p-4"
    >
      <div className="flex items-end gap-2">
        <motion.button
          className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          whileTap={{ scale: 0.88 }}
        >
          <PaperClipIcon className="h-5 w-5" />
        </motion.button>

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

        {messageInput.trim() ? (
          <motion.button
            onClick={onSend}
            disabled={isSending}
            className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 p-2.5 text-white disabled:opacity-50"
            whileTap={{ scale: 0.88 }}
            animate={isSending ? { rotate: 360 } : {}}
            transition={tweens.smooth}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.button
            className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-primary-400"
            whileTap={{ scale: 0.88 }}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
}
