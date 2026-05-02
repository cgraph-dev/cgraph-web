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
