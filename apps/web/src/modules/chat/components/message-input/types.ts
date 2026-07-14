/**
 * Type definitions for MessageInput module
 */

export interface MessageInputProps {
  readonly conversationId?: string;
  readonly channelId?: string;
  readonly replyTo?: ReplyInfo | null;
  readonly onSend: (message: MessagePayload) => void | Promise<void>;
  readonly onCancelReply?: () => void;
  readonly onTyping?: (isTyping: boolean) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly maxAttachments?: number;
  readonly nodesPrice?: number | null;
  readonly onNodesPriceChange?: (price: number | null) => void;
  /**
   * Channel slow-mode window in seconds. When greater than 0 the
   * composer enforces a per-user cooldown surfaced as a countdown pill.
   * Server is authoritative — see `CGraph.Groups.SlowModeLimiter`.
   */
  readonly slowModeSeconds?: number;
  /**
   * ISO-8601 instant the cooldown lifts. Set when the server returns a
   * `slow_mode_active` 429 with `details.retry_at`. The composer
   * shortcuts new sends until this instant.
   */
  readonly slowModeRetryAt?: string | null;
  /**
   * Optional slot rendered above the composer card. Used by the paid-DM
   * gate (and any future gating UI) so the composer remains agnostic of
   * the peer's commerce settings.
   */
  readonly headerSlot?: React.ReactNode;
}

export interface ReplyInfo {
  id: string;
  content: string;
  author: string;
}

export interface MessagePayload {
  content: string;
  attachments?: File[];
  replyToId?: string;
  type?: 'text' | 'voice' | 'video' | 'sticker' | 'gif';
  metadata?: Record<string, unknown>;
  isViewOnce?: boolean;
}

export type AttachmentMode = 'none' | 'file' | 'emoji' | 'sticker' | 'gif' | 'voice' | 'video';

export interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export interface VoiceMessageData {
  blob: Blob;
  duration: number;
  waveform: number[];
}

export interface VideoMessageData {
  blob: Blob;
  duration: number;
}
