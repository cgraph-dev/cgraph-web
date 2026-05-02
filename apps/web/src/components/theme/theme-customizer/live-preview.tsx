/**
 * Live Preview Component
 *
 * Real-time preview panel for theme changes.
 */

import { motion } from 'motion/react';
import { ThemedAvatar } from '../themed-avatar';

// TYPES

interface LivePreviewProps {
  isVisible: boolean;
}

// COMPONENT

export function LivePreview({ isVisible }: LivePreviewProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="overflow-hidden border-l border-gray-700/50 p-6"
    >
      <h4 className="mb-4 text-sm font-semibold text-gray-400">Live Preview</h4>

      {/* Avatar Preview */}
      <div className="mb-6">
        <p className="mb-2 text-xs text-gray-500">Avatar</p>
        <div className="flex justify-center">
          <ThemedAvatar src="/placeholder-avatar.jpg" alt="Preview" size="xlarge" />
        </div>
      </div>
    </motion.div>
  );
}

export default LivePreview;
