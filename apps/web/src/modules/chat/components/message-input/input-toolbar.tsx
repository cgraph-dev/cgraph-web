/**
 * InputToolbar component - emoji, sticker, voice, send buttons
 */

import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  GifIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Sticker } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttachmentMode } from './types';

interface InputToolbarProps {
  attachmentMode: AttachmentMode;
  isRecording: boolean;
  isVideoRecording: boolean;
  canSend: boolean;
  disabled?: boolean;
  isViewOnce: boolean;
  hasAttachments: boolean;
  onToggleMode: (mode: AttachmentMode) => void;
  onToggleRecording: () => void;
  onToggleVideoRecording: () => void;
  onToggleViewOnce: () => void;
  onSend: () => void;
}

/** Input Toolbar component with emoji, sticker, GIF, view-once, voice, and send buttons. */
export function InputToolbar({
  attachmentMode,
  isRecording,
  isVideoRecording,
  canSend,
  disabled = false,
  isViewOnce,
  hasAttachments,
  onToggleMode,
  onToggleRecording,
  onToggleVideoRecording,
  onToggleViewOnce,
  onSend,
}: InputToolbarProps) {
  const controlClass =
    'flex h-9 w-9 flex-none items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div role="toolbar" aria-label="Message tools" className="flex shrink-0 items-center gap-0.5">
      {/* Emoji Button */}
      <button
        type="button"
        onClick={() => onToggleMode('emoji')}
        disabled={disabled}
        className={cn(controlClass, attachmentMode === 'emoji' && 'bg-white/10 text-white')}
        aria-pressed={attachmentMode === 'emoji'}
        aria-label="Open emoji picker"
        title="Emoji"
      >
        <FaceSmileIcon className="h-5 w-5" />
      </button>

      {/* Sticker Button */}
      <button
        type="button"
        onClick={() => onToggleMode('sticker')}
        disabled={disabled}
        className={cn(controlClass, attachmentMode === 'sticker' && 'bg-white/10 text-white')}
        aria-pressed={attachmentMode === 'sticker'}
        aria-label="Open sticker picker"
        title="Sticker"
      >
        <Sticker className="h-5 w-5" />
      </button>

      {/* View-once toggle — Signal: camera icon with "1" badge */}
      {hasAttachments && (
        <button
          type="button"
          onClick={onToggleViewOnce}
          disabled={disabled}
          className={cn(controlClass, isViewOnce && 'bg-primary-600/20 text-primary-300')}
          title={isViewOnce ? 'View once enabled' : 'Enable view once'}
          aria-label={isViewOnce ? 'Disable view once' : 'Enable view once'}
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
        </button>
      )}

      {/* GIF Button */}
      <button
        type="button"
        onClick={() => onToggleMode('gif')}
        disabled={disabled}
        className={cn(controlClass, attachmentMode === 'gif' && 'bg-white/10 text-white')}
        aria-pressed={attachmentMode === 'gif'}
        aria-label="Open GIF picker"
        title="GIF"
      >
        <GifIcon className="h-5 w-5" />
      </button>

      {/* Voice Message Button */}
      <button
        type="button"
        onClick={onToggleRecording}
        disabled={disabled}
        className={cn(controlClass, isRecording && 'bg-red-500 text-white')}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Voice recorder active' : 'Record voice message'}
        title={isRecording ? 'Voice recorder active' : 'Record voice message'}
      >
        <MicrophoneIcon className="h-5 w-5" />
      </button>

      {/* Video Note Button */}
      <button
        type="button"
        onClick={onToggleVideoRecording}
        disabled={disabled}
        className={cn(controlClass, isVideoRecording && 'bg-red-500 text-white')}
        aria-pressed={isVideoRecording}
        aria-label={isVideoRecording ? 'Video note recorder active' : 'Record video note'}
        title={isVideoRecording ? 'Video note recorder active' : 'Record video note'}
      >
        <VideoCameraIcon className="h-5 w-5" />
      </button>

      {/* Send Button */}
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !canSend}
        className={cn(
          controlClass,
          canSend && !disabled
            ? 'bg-primary-600 text-white hover:bg-primary-500'
            : 'bg-white/[0.04] text-gray-600'
        )}
        aria-label="Send message"
        title="Send message"
      >
        <PaperAirplaneIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
