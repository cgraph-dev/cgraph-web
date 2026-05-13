/**
 * InputToolbar component - emoji, sticker, voice, send buttons
 */

import { motion } from 'motion/react';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  GifIcon,
} from '@heroicons/react/24/outline';
import type { AttachmentMode } from './types';

interface InputToolbarProps {
  attachmentMode: AttachmentMode;
  isRecording: boolean;
  canSend: boolean;
  disabled?: boolean;
  primaryColor: string;
  isViewOnce: boolean;
  hasAttachments: boolean;
  onToggleMode: (mode: AttachmentMode) => void;
  onToggleRecording: () => void;
  onToggleViewOnce: () => void;
  onSend: () => void;
}

/** Input Toolbar component with emoji, sticker, GIF, view-once, voice, and send buttons. */
export function InputToolbar({
  attachmentMode: _attachmentMode,
  isRecording,
  canSend,
  disabled = false,
  primaryColor,
  isViewOnce,
  hasAttachments,
  onToggleMode,
  onToggleRecording,
  onToggleViewOnce,
  onSend,
}: InputToolbarProps) {
  return (
    <>
      {/* Emoji Button */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('emoji')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-yellow-400"
      >
        <FaceSmileIcon className="h-6 w-6" />
      </motion.button>

      {/* Sticker Button */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('sticker')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-purple-400"
      >
        <span className="text-lg">🎨</span>
      </motion.button>

      {/* View-once toggle — Signal: camera icon with "1" badge */}
      {hasAttachments && (
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleViewOnce}
          className={`rounded-lg p-2 transition-colors ${
            isViewOnce
              ? 'bg-primary-600/20 text-primary-400'
              : 'text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white'
          }`}
          title={isViewOnce ? 'View once enabled' : 'Enable view once'}
          aria-pressed={isViewOnce}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="1.5" />
            <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Z" />
            <text x="18" y="8" fontSize="9" fill="currentColor" stroke="none" fontWeight="bold">
              1
            </text>
          </svg>
        </motion.button>
      )}

      {/* GIF Button */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('gif')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-green-400"
      >
        <GifIcon className="h-6 w-6" />
      </motion.button>

      {/* Voice Message Button */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleRecording}
        className={`rounded-lg p-2 transition-colors ${
          isRecording
            ? 'bg-red-500 text-white'
            : 'text-gray-400 hover:bg-[var(--token-card-bg)] hover:text-white'
        }`}
      >
        <MicrophoneIcon className="h-6 w-6" />
      </motion.button>

      {/* Send Button */}
      <motion.button
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSend}
        disabled={disabled || !canSend}
        className="rounded-xl bg-primary-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        <PaperAirplaneIcon className="h-6 w-6" />
      </motion.button>
    </>
  );
}
