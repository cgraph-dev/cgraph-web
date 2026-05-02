/**
 * Upload progress indicator for media attachments.
 *
 * Displays contextual UI for each stage of the upload/processing lifecycle:
 * - Uploading: progress bar with percentage and file size
 * - Processing: spinner with media type indicator
 * - Complete: thumbnail preview with checkmark
 * - Failed: error message with retry button
 *
 * Uses motion/react for smooth transitions between states.
 */

import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

import type { MediaProcessingStatus, MediaVariant } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UploadProgressIndicatorProps {
  /** Current processing status. */
  readonly status: MediaProcessingStatus;
  /** Upload progress percentage (0-100). */
  readonly progress: number;
  /** Available variants (shown on complete). */
  readonly variants: ReadonlyArray<MediaVariant>;
  /** Error message (shown on failure). */
  readonly error: string | null;
  /** File size in bytes (shown during upload). */
  readonly fileSize?: number;
  /** Media type label (shown during processing). */
  readonly mediaType?: 'image' | 'video' | 'audio';
  /** Called when the user clicks retry after failure. */
  readonly onRetry?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Renders upload progress and processing status for media attachments. */
function UploadProgressIndicator(props: UploadProgressIndicatorProps): ReactNode {
  const { status, progress, variants, error, fileSize, mediaType, onRetry } = props;

  return (
    <div className="bg-surface-secondary relative flex items-center gap-3 rounded-lg px-3 py-2">
      <AnimatePresence mode="wait">
        {status === 'uploading' && (
          <UploadingState key="uploading" progress={progress} fileSize={fileSize} />
        )}
        {status === 'processing' && <ProcessingState key="processing" mediaType={mediaType} />}
        {status === 'completed' && <CompletedState key="completed" variants={variants} />}
        {status === 'failed' && <FailedState key="failed" error={error} onRetry={onRetry} />}
      </AnimatePresence>
    </div>
  );
}

export { UploadProgressIndicator };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const FADE_TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;

function UploadingState(props: {
  readonly progress: number;
  readonly fileSize?: number;
}): ReactNode {
  const { progress, fileSize } = props;
  const sizeLabel = fileSize ? formatBytes(fileSize) : '';

  return (
    <motion.div
      className="flex w-full items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_TRANSITION}
    >
      {/* Progress bar */}
      <div className="flex-1">
        <div className="text-text-secondary mb-1 flex justify-between text-xs">
          <span>Uploading{sizeLabel ? ` (${sizeLabel})` : ''}</span>
          <span>{progress}%</span>
        </div>
        <div className="bg-surface-tertiary h-1.5 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ProcessingState(props: { readonly mediaType?: 'image' | 'video' | 'audio' }): ReactNode {
  const { mediaType } = props;

  const LABEL_MAP: Record<string, string> = {
    image: 'Processing image...',
    video: 'Transcoding video...',
    audio: 'Generating waveform...',
  };

  const label = mediaType ? LABEL_MAP[mediaType] : 'Processing...';

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_TRANSITION}
    >
      {/* Spinner */}
      <motion.div
        className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <span className="text-text-secondary text-sm">{label}</span>
    </motion.div>
  );
}

function CompletedState(props: { readonly variants: ReadonlyArray<MediaVariant> }): ReactNode {
  const { variants } = props;
  const thumbnail = variants.find(
    (v) => v.variant_type === 'thumbnail' || v.variant_type === 'poster'
  );

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_TRANSITION}
    >
      {thumbnail?.url && (
        <img src={thumbnail.url} alt="Upload preview" className="h-8 w-8 rounded object-cover" />
      )}
      {/* Checkmark */}
      <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-text-secondary text-sm">
        {variants.length} variant{variants.length !== 1 ? 's' : ''} ready
      </span>
    </motion.div>
  );
}

function FailedState(props: {
  readonly error: string | null;
  readonly onRetry?: () => void;
}): ReactNode {
  const { error, onRetry } = props;

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_TRANSITION}
    >
      {/* Error icon */}
      <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="flex-1 text-sm text-red-500">{error ?? 'Processing failed'}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="hover:bg-surface-tertiary rounded px-2 py-1 text-xs font-medium text-primary"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
