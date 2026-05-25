/**
 * useMessageInput hook - state and handlers for message input
 */

import { useState, useRef, useEffect } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import { useDraft } from '@/modules/chat/hooks/useDraft';
import type { MessagePayload, AttachmentMode, VoiceMessageData, ReplyInfo } from './types';
import { useSlowModeCountdown } from './useSlowModeCountdown';

interface UseMessageInputOptions {
  readonly onSend: (message: MessagePayload) => void;
  readonly onTyping?: (isTyping: boolean) => void;
  readonly replyTo?: ReplyInfo | null;
  /**
   * Conversation the composer is attached to. When provided, the input text
   * is autosaved to IndexedDB (Signal-style) and restored on reload.
   */
  readonly conversationId?: string | undefined;
  /** Channel slow-mode window in seconds; 0/undefined = disabled. */
  readonly slowModeSeconds?: number;
  /** ISO instant the slow-mode cooldown lifts (server-provided). */
  readonly slowModeRetryAt?: string | null;
  /** Maximum files this composer can own for one send. */
  readonly maxAttachments?: number;
}

interface StickerPayload {
  readonly id: string;
  readonly packId: string;
  readonly label: string;
  readonly emoji: string;
}

/** Manages message input state, attachments, mentions, typing indicators, and send logic. */
export function useMessageInput({
  onSend,
  onTyping,
  replyTo,
  conversationId,
  slowModeSeconds,
  slowModeRetryAt,
  maxAttachments = 10,
}: UseMessageInputOptions) {
  const { draftText, hydrated: draftHydrated, setDraftText, clearDraft } = useDraft(conversationId);
  const slowMode = useSlowModeCountdown({ slowModeSeconds, slowModeRetryAt });
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from persisted draft once IndexedDB returns.
  useEffect(() => {
    if (draftHydrated) {
      setMessage(draftText);
    }
  }, [draftHydrated, draftText, conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!onTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  };

  // Handle message change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setMessage(value);
    setDraftText(value);
    handleTyping();

    // Check for @mentions
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1 && lastAtSymbol >= value.lastIndexOf(' ')) {
      const query = value.slice(lastAtSymbol + 1);
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Handle send
  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (slowMode.cooldownActive) {
      HapticFeedback.error();
      return;
    }

    onSend({
      content: message.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyTo?.id,
      type: 'text',
      isViewOnce: attachments.length > 0 ? isViewOnce : false,
    });

    setMessage('');
    clearDraft();
    setAttachments([]);
    setIsViewOnce(false);
    if (onTyping) onTyping(false);
    HapticFeedback.light();
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (slowMode.cooldownActive) {
        HapticFeedback.error();
        return;
      }
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, maxAttachments));
    setAttachmentMode('none');
    e.target.value = '';
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files].slice(0, maxAttachments));
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    HapticFeedback.light();
  };

  // Handle voice message
  const handleVoiceMessage = (data: VoiceMessageData) => {
    onSend({
      content: '',
      type: 'voice',
      replyToId: replyTo?.id,
      metadata: {
        audio: data.blob,
        duration: data.duration,
        waveform: data.waveform,
      },
    });
    setIsRecording(false);
    HapticFeedback.success();
  };

  // Handle GIF select
  const handleGifSelect = (gif: GifResult) => {
    onSend({
      content: '',
      type: 'gif',
      replyToId: replyTo?.id,
      metadata: {
        gifId: gif.id,
        gifTitle: gif.title,
        gifUrl: gif.url,
        gifPreviewUrl: gif.previewUrl,
        gifWidth: gif.width,
        gifHeight: gif.height,
        gifSource: gif.source,
      },
    });
    setAttachmentMode('none');
    HapticFeedback.medium();
  };

  const handleStickerSelect = (sticker: StickerPayload) => {
    onSend({
      content: sticker.emoji,
      type: 'sticker',
      metadata: {
        stickerId: sticker.id,
        stickerPackId: sticker.packId,
        stickerLabel: sticker.label,
        stickerEmoji: sticker.emoji,
      },
      replyToId: replyTo?.id,
    });
    setAttachmentMode('none');
    HapticFeedback.medium();
  };

  // Handle mention select
  const handleMentionSelect = (username: string) => {
    const lastAtSymbol = message.lastIndexOf('@');
    setMessage(message.slice(0, lastAtSymbol) + `@${username} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // Toggle attachment mode
  const toggleAttachmentMode = (mode: AttachmentMode) => {
    setAttachmentMode((prev) => (prev === mode ? 'none' : mode));
  };

  return {
    // State
    message,
    attachments,
    attachmentMode,
    isRecording,
    showMentions,
    mentionQuery,
    isViewOnce,
    slowMode,
    // Refs
    inputRef,
    fileInputRef,
    // Handlers
    handleChange,
    handleSend,
    handleKeyDown,
    handleFileSelect,
    handleDrop,
    removeAttachment,
    handleVoiceMessage,
    handleStickerSelect,
    handleGifSelect,
    handleMentionSelect,
    toggleAttachmentMode,
    setIsRecording,
    setAttachmentMode,
    setShowMentions,
    setIsViewOnce,
  };
}
