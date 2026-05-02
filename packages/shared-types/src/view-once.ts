/**
 * View-once / self-destructing media types.
 *
 * Signal reference: ViewOnceUtil state machine (isViewable / isViewed)
 * View-once messages allow sending a photo/video that can only be viewed once.
 * After opening, the attachment is permanently deleted server-side.
 */

/**
 * The lifecycle state of a view-once message.
 * Mirrors Signal's ViewOnceUtil.isViewable() / isViewed() state machine.
 */
export type ViewOnceState =
  | 'pending' // Attachment exists, not yet opened (isViewable = true)
  | 'viewed' // Opened by recipient, attachment deleted (isViewed = true)
  | 'expired'; // Past 30-day MAX_LIFESPAN without being opened

/**
 * Fields added to messages when is_view_once is true.
 */
export interface ViewOnceFields {
  /** Whether this message is view-once */
  readonly isViewOnce: boolean;
  /** ISO 8601 timestamp when the recipient first opened the media. null = not opened */
  readonly viewOnceOpenedAt: string | null;
  /** User ID of who opened it */
  readonly viewOnceOpenedById: string | null;
}

/**
 * Request to open a view-once message.
 * Client must have already downloaded the media before calling this.
 */
export interface ViewOnceOpenRequest {
  /** The message ID to mark as opened */
  readonly messageId: string;
}

/**
 * Response from opening a view-once message.
 */
export interface ViewOnceOpenResponse {
  readonly id: string;
  readonly conversationId: string;
  readonly isViewOnce: true;
  readonly viewOnceOpenedAt: string;
  readonly viewOnceOpenedById: string;
}

/**
 * WebSocket event: view-once message opened.
 * Broadcast on conversation channel when a view-once message is opened.
 */
export interface ViewOnceOpenedEvent {
  readonly message_id: string;
  readonly opened_by_id: string;
  readonly opened_at: string;
}

/**
 * WebSocket event: multi-device sync for view-once open.
 * Broadcast on user channel to sync view-once state across devices.
 * Mirrors Signal's MultiDeviceViewedUpdateJob / Desktop ViewOnceOpenSyncs.
 */
export interface ViewOnceSyncEvent {
  readonly message_id: string;
  readonly conversation_id: string;
  readonly opened_at: string;
}

/** Signal: ViewOnceUtil.MAX_LIFESPAN = 30 days in milliseconds */
const MAX_LIFESPAN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Derive the view-once state from message fields.
 * Mirrors Signal's ViewOnceUtil.isViewable() / isViewed() logic.
 *
 * @param isViewOnce - Whether the message is view-once
 * @param viewOnceOpenedAt - When it was opened (null = not opened)
 * @param hasAttachment - Whether attachment data still exists
 * @param messageCreatedAt - ISO 8601 creation timestamp
 */
export function deriveViewOnceState(
  isViewOnce: boolean,
  viewOnceOpenedAt: string | null,
  hasAttachment: boolean,
  messageCreatedAt: string
): ViewOnceState | null {
  if (!isViewOnce) return null;

  if (viewOnceOpenedAt !== null) return 'viewed';

  const createdAt = new Date(messageCreatedAt).getTime();
  const now = Date.now();

  if (now - createdAt > MAX_LIFESPAN_MS) return 'expired';
  if (!hasAttachment) return 'viewed';

  return 'pending';
}
