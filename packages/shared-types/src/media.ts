/**
 * Media processing types shared across web, mobile, and desktop.
 *
 * Covers media variants (image/video/audio quality tiers), processing status,
 * adaptive quality selection, and client-side compression options.
 */

/** A single processed variant of an uploaded media file. */
export interface MediaVariant {
  /** Variant identifier: "original", "thumbnail", "webp", "480p", "720p", "1080p", "poster", "waveform" */
  readonly variant_type: string;
  /** CDN or S3 URL to the processed file. */
  readonly url: string;
  /** MIME type of the variant (e.g. "image/webp", "video/mp4"). */
  readonly content_type: string;
  /** File size in bytes. */
  readonly size: number;
  /** Width in pixels (images and videos). */
  readonly width?: number;
  /** Height in pixels (images and videos). */
  readonly height?: number;
  /** Duration in seconds (video and audio). */
  readonly duration?: number;
  /** Arbitrary metadata (waveform bars, blur hash, codec info). */
  readonly metadata?: Record<string, unknown>;
}

/** Processing lifecycle status for an upload. */
export type MediaProcessingStatus = 'uploading' | 'processing' | 'completed' | 'failed';

/** Connection quality tiers for adaptive media selection. */
export type ConnectionQuality = 'slow' | 'medium' | 'fast';

/** Options for client-side image pre-compression. */
export interface CompressOptions {
  /** Maximum pixel dimension on longest edge (default 4096). */
  readonly maxDimension?: number;
  /** Compression quality 0-1 (default 0.85). */
  readonly quality?: number;
  /** Target output format (default "webp" with "jpeg" fallback). */
  readonly format?: 'webp' | 'jpeg';
}

/** Result of client-side image compression. */
export interface CompressedImage {
  /** Compressed image data. */
  readonly blob: Blob;
  /** Width in pixels after compression. */
  readonly width: number;
  /** Height in pixels after compression. */
  readonly height: number;
  /** Original file size in bytes (before compression). */
  readonly originalSize: number;
  /** Compressed file size in bytes. */
  readonly compressedSize: number;
}

/** Channel event payload for media processing status updates. */
export interface MediaProcessingEvent {
  readonly upload_id: string;
  readonly status: MediaProcessingStatus;
}

/** Channel event payload when a single variant is ready. */
export interface MediaVariantReadyEvent {
  readonly upload_id: string;
  readonly variant_type: string;
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly blur_hash?: string;
}

/** Channel event payload when all processing is complete. */
export interface MediaCompleteEvent {
  readonly upload_id: string;
  readonly variants: ReadonlyArray<{
    readonly type: string;
    readonly url: string;
    readonly width?: number;
    readonly height?: number;
  }>;
}

/** Channel event payload on processing failure. */
export interface MediaFailedEvent {
  readonly upload_id: string;
  readonly error: string;
}

/** Upload lifecycle state managed by the use-media-upload hook. */
export interface MediaUploadState {
  /** Upload progress percentage (0-100). */
  readonly uploadProgress: number;
  /** Current processing status. */
  readonly processingStatus: MediaProcessingStatus;
  /** Available variants after processing. */
  readonly variants: ReadonlyArray<MediaVariant>;
  /** Error message if processing failed. */
  readonly error: string | null;
  /** The upload identifier returned by the server. */
  readonly uploadId: string | null;
}

export const MESSAGE_ATTACHMENT_CONTENT_TYPES = [
  'image',
  'video',
  'file',
  'audio',
  'voice',
] as const;

export type MessageAttachmentContentType = (typeof MESSAGE_ATTACHMENT_CONTENT_TYPES)[number];

/** Uploaded file data after `/api/v1/uploads` accepts a message attachment. */
export interface UploadedMessageAttachment {
  readonly url: string;
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly thumbnailUrl: string | null;
}

/** Canonical metadata persisted on DM and group message attachments. */
export interface MessageAttachmentMetadata extends Record<string, unknown> {
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileMimeType: string;
  readonly url: string;
  readonly filename: string;
  readonly size: number;
  readonly mimeType: string;
  readonly thumbnailUrl?: string;
}

/** Canonical upload-first payload for routed DM and group message sends. */
export interface MessageAttachmentSendPayload {
  readonly contentType: MessageAttachmentContentType;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileMimeType: string;
  readonly thumbnailUrl: string | null;
  readonly metadata: MessageAttachmentMetadata;
}

/**
 * Maps an uploaded attachment MIME type to the message content type.
 */
export function messageContentTypeForMime(
  mimeType: string,
  filename = ''
): MessageAttachmentContentType {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = filename.toLowerCase();

  if (normalizedMime.startsWith('image/')) return 'image';
  if (normalizedMime.startsWith('video/')) return 'video';
  if (normalizedMime.startsWith('audio/')) return 'audio';
  if (/\.(png|jpe?g|gif|webp|avif)$/u.test(normalizedName)) return 'image';
  if (/\.(mp4|mov|webm|mkv)$/u.test(normalizedName)) return 'video';
  if (/\.(mp3|m4a|ogg|opus|wav|webm)$/u.test(normalizedName)) return 'audio';
  return 'file';
}

/**
 * Builds the persisted attachment metadata used by both DM and group messages.
 */
export function buildMessageAttachmentMetadata(
  uploaded: UploadedMessageAttachment
): MessageAttachmentMetadata {
  const metadata: MessageAttachmentMetadata = {
    fileUrl: uploaded.url,
    fileName: uploaded.filename,
    fileSize: uploaded.size,
    fileMimeType: uploaded.contentType,
    url: uploaded.url,
    filename: uploaded.filename,
    size: uploaded.size,
    mimeType: uploaded.contentType,
  };

  if (uploaded.thumbnailUrl) {
    return { ...metadata, thumbnailUrl: uploaded.thumbnailUrl };
  }

  return metadata;
}

/**
 * Builds the complete upload-first send payload for a routed message composer.
 */
export function buildMessageAttachmentSendPayload(
  uploaded: UploadedMessageAttachment,
  contentType = messageContentTypeForMime(uploaded.contentType, uploaded.filename)
): MessageAttachmentSendPayload {
  return {
    contentType,
    fileUrl: uploaded.url,
    fileName: uploaded.filename,
    fileSize: uploaded.size,
    fileMimeType: uploaded.contentType,
    thumbnailUrl: uploaded.thumbnailUrl,
    metadata: buildMessageAttachmentMetadata(uploaded),
  };
}
