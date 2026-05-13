/**
 * ConversationHeader - glassmorphic header with user info and actions
 */

import { motion } from 'motion/react';
import { PhoneIcon, ShieldCheckIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { GlassCardNeon } from '@/shared/components/ui';
import { ConnectionStatus } from '@/shared/components/connection-status';
import type { ConversationHeaderProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 */
/**
 * Conversation Header component.
 */
export function ConversationHeader({
  conversationName,
  isTyping,
  canStartCall = false,
  onStartVoiceCall,
  onStartVideoCall,
}: ConversationHeaderProps) {
  return (
    <GlassCardNeon className="border-primary-500/20 flex h-16 flex-shrink-0 items-center justify-between rounded-none border-b px-4">
      <motion.div
        className="flex items-center gap-3"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <motion.div
            className="ring-primary-500/50 h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ring-2"
            whileTap={{ scale: 0.88 }}
          >
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
              {(conversationName || 'U').charAt(0).toUpperCase()}
            </div>
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-900 bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={loop(tweens.ambient)}
          />
        </div>

        <div>
          <h2 className="font-semibold text-white">{conversationName || 'Conversation'}</h2>
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-3 w-3 text-green-400" />
            <p className="text-xs text-gray-400">
              {isTyping ? (
                <motion.span
                  className="text-primary-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={loop(tweens.verySlow)}
                >
                  typing...
                </motion.span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {canStartCall && (
          <>
            <motion.button
              type="button"
              onClick={onStartVoiceCall}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              whileTap={{ scale: 0.88 }}
              aria-label="Start voice call"
              title="Start voice call"
            >
              <PhoneIcon className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={onStartVideoCall}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              whileTap={{ scale: 0.88 }}
              aria-label="Start video call"
              title="Start video call"
            >
              <VideoCameraIcon className="h-5 w-5" />
            </motion.button>
          </>
        )}

        <ConnectionStatus />
      </motion.div>
    </GlassCardNeon>
  );
}
