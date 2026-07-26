/**
 * InputToolbar component - emoji, sticker, voice, send buttons
 */

import { Eye, FileImage, Mic, Send, Smile, Sticker, Video } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
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
  return (
    <div role="toolbar" aria-label="Message tools" className="flex shrink-0 items-center gap-0.5">
      <IconButton
        icon={<Smile />}
        label="Open emoji picker"
        size="sm"
        variant={attachmentMode === 'emoji' ? 'secondary' : 'ghost'}
        onClick={() => onToggleMode('emoji')}
        disabled={disabled}
        className="h-9 w-9 flex-none"
        aria-pressed={attachmentMode === 'emoji'}
      />

      <IconButton
        icon={<Sticker />}
        label="Open sticker picker"
        size="sm"
        variant={attachmentMode === 'sticker' ? 'secondary' : 'ghost'}
        onClick={() => onToggleMode('sticker')}
        disabled={disabled}
        className="h-9 w-9 flex-none"
        aria-pressed={attachmentMode === 'sticker'}
      />

      {hasAttachments && (
        <IconButton
          icon={<Eye />}
          label={isViewOnce ? 'Disable view once' : 'Enable view once'}
          size="sm"
          variant={isViewOnce ? 'secondary' : 'ghost'}
          onClick={onToggleViewOnce}
          disabled={disabled}
          className="h-9 w-9 flex-none"
          aria-pressed={isViewOnce}
        />
      )}

      <IconButton
        icon={<FileImage />}
        label="Open GIF picker"
        size="sm"
        variant={attachmentMode === 'gif' ? 'secondary' : 'ghost'}
        onClick={() => onToggleMode('gif')}
        disabled={disabled}
        className="h-9 w-9 flex-none"
        aria-pressed={attachmentMode === 'gif'}
      />

      <IconButton
        icon={<Mic />}
        label={isRecording ? 'Voice recorder active' : 'Record voice message'}
        size="sm"
        variant={isRecording ? 'danger' : 'ghost'}
        onClick={onToggleRecording}
        disabled={disabled}
        className="h-9 w-9 flex-none"
        aria-pressed={isRecording}
      />

      <IconButton
        icon={<Video />}
        label={isVideoRecording ? 'Video note recorder active' : 'Record video note'}
        size="sm"
        variant={isVideoRecording ? 'danger' : 'ghost'}
        onClick={onToggleVideoRecording}
        disabled={disabled}
        className="h-9 w-9 flex-none"
        aria-pressed={isVideoRecording}
      />

      <IconButton
        icon={<Send />}
        label="Send message"
        size="sm"
        variant={canSend && !disabled ? 'primary' : 'ghost'}
        onClick={onSend}
        disabled={disabled || !canSend}
        className="h-9 w-9 flex-none"
      />
    </div>
  );
}
