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

/** S3-compatible multipart uploads require every non-final part to be at least 5 MiB. */
export const MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES = 5 * 1024 * 1024;

/** Message attachments above this size should use the resumable multipart flow. */
export const MESSAGE_UPLOAD_MULTIPART_THRESHOLD_BYTES = MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES;

/** Keep browser upload pressure predictable while still allowing large files to move quickly. */
export const MESSAGE_UPLOAD_MAX_PARALLEL_PARTS = 3;

/** A server-issued direct-upload URL for one multipart part. */
export interface MultipartUploadPart {
  readonly part_number: number;
  readonly presigned_url: string;
}

/** The server-owned upload session returned by `/api/v1/uploads/start`. */
export interface MultipartUploadStart {
  readonly upload_id: string;
  readonly key: string;
  readonly parts: ReadonlyArray<MultipartUploadPart>;
  readonly expires_at: string;
}

/** A completed part submitted to `/api/v1/uploads/complete`. */
export interface MultipartUploadCompletedPart {
  readonly part_number: number;
  readonly etag: string;
}

/** The finalized object returned by `/api/v1/uploads/complete`. */
export interface MultipartUploadComplete {
  readonly upload_id: string;
  readonly key: string;
  readonly url: string;
}

/** True when a message attachment should use the multipart upload flow. */
export function shouldUseMultipartMessageUpload(
  fileSize: number,
  threshold = MESSAGE_UPLOAD_MULTIPART_THRESHOLD_BYTES
): boolean {
  return Number.isFinite(fileSize) && fileSize > threshold;
}

/** Computes aggregate upload progress from completed and currently uploading bytes. */
export function multipartUploadProgress(
  completedBytes: number,
  inFlightBytes: number,
  totalBytes: number
): number {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;

  const loaded = Math.max(0, completedBytes) + Math.max(0, inFlightBytes);
  return Math.min(100, Math.max(0, Math.round((loaded / totalBytes) * 100)));
}

export const MESSAGE_ATTACHMENT_CONTENT_TYPES = [
  'image',
  'video',
  'file',
  'audio',
  'voice',
] as const;

export type MessageAttachmentContentType = (typeof MESSAGE_ATTACHMENT_CONTENT_TYPES)[number];

/** Executable/script upload extensions blocked before bytes are accepted. */
export const MESSAGE_UPLOAD_BLOCKED_EXTENSIONS = [
  'exe',
  'scr',
  'bat',
  'com',
  'pif',
  'cmd',
  'cpl',
  'msi',
  'vbs',
  'vbe',
  'js',
  'jse',
  'wsf',
  'wsh',
  'ps1',
  'dll',
] as const;

/** Dangerous MIME types blocked before upload starts. */
export const MESSAGE_UPLOAD_BLOCKED_CONTENT_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'application/x-bat',
  'application/x-msi',
  'application/vnd.microsoft.portable-executable',
] as const;

export type MessageUploadBlockedExtension = (typeof MESSAGE_UPLOAD_BLOCKED_EXTENSIONS)[number];
export type MessageUploadBlockedContentType =
  (typeof MESSAGE_UPLOAD_BLOCKED_CONTENT_TYPES)[number];

export type MessageUploadBlockReason =
  | 'blocked_extension'
  | 'blocked_content_type';

const MESSAGE_UPLOAD_BLOCKED_EXTENSION_SET: ReadonlySet<string> = new Set(
  MESSAGE_UPLOAD_BLOCKED_EXTENSIONS
);

const MESSAGE_UPLOAD_BLOCKED_CONTENT_TYPE_SET: ReadonlySet<string> = new Set(
  MESSAGE_UPLOAD_BLOCKED_CONTENT_TYPES
);

function filenameExtension(filename: string): string {
  const safeName = filename.trim().toLowerCase().split(/[\\/]/u).pop() ?? '';
  const dot = safeName.lastIndexOf('.');
  if (dot < 0 || dot === safeName.length - 1) return '';
  return safeName.slice(dot + 1);
}

function baseContentType(contentType: string): string {
  return contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

/** Returns why a message upload is blocked before transfer, or null when allowed. */
export function getMessageUploadBlockReason(
  filename: string,
  contentType = ''
): MessageUploadBlockReason | null {
  const extension = filenameExtension(filename);
  if (MESSAGE_UPLOAD_BLOCKED_EXTENSION_SET.has(extension)) {
    return 'blocked_extension';
  }

  const normalizedType = baseContentType(contentType);
  if (MESSAGE_UPLOAD_BLOCKED_CONTENT_TYPE_SET.has(normalizedType)) {
    return 'blocked_content_type';
  }

  return null;
}

/** True when a message upload is safe enough to start client-side transfer. */
export function isAllowedMessageUpload(filename: string, contentType = ''): boolean {
  return getMessageUploadBlockReason(filename, contentType) === null;
}

/** Uploaded file data after `/api/v1/uploads` accepts a message attachment. */
export interface UploadedMessageAttachment {
  readonly uploadId?: string;
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
