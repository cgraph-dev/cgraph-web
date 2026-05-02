/**
 * MessageStatusIndicator — animated checkmark icons showing delivery status.
 *
 * States: sending (⏳) → sent (✓) → delivered (✓✓) → read (✓✓ blue)
 *
 */

import { motion, AnimatePresence } from 'motion/react';
import { tweens, springs, loop } from '@/lib/animation-presets';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusIndicatorProps {
  status: MessageDeliveryStatus;
}

const CHECK_PATH = 'M5 13l4 4L19 7';

function SingleCheck({ color }: { color: string }) {
  return (
    <motion.svg
      key="single"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 1], opacity: 1 }}
      transition={springs.bouncy}
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={CHECK_PATH} />
    </motion.svg>
  );
}

function DoubleCheck({ color }: { color: string }) {
  return (
    <motion.svg
      key="double"
      className="h-4 w-4"
      viewBox="0 0 28 24"
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* First check */}
      <motion.path
        d={CHECK_PATH}
        stroke={color}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={tweens.brisk}
      />
      {/* Second check offset */}
      <motion.path
        d="M10 13l4 4L24 7"
        stroke={color}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...tweens.brisk, delay: 0.15 }}
      />
    </motion.svg>
  );
}

export function MessageStatusIndicator({ status }: MessageStatusIndicatorProps) {
  return (
    <span className="inline-flex items-center">
      <AnimatePresence mode="wait">
        {status === 'sending' && (
          <motion.span
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={loop(tweens.slow)}
            className="text-[10px] text-gray-400"
          >
            ⏳
          </motion.span>
        )}

        {status === 'sent' && <SingleCheck color="#9ca3af" />}
        {status === 'delivered' && <DoubleCheck color="#9ca3af" />}
        {status === 'read' && <DoubleCheck color="#3b82f6" />}

        {status === 'failed' && (
          <motion.svg
            key="failed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            transition={springs.bouncy}
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
}

export default MessageStatusIndicator;
