/**
 * Hook managing the media upload and server-side processing lifecycle.
 *
 * Flow: client-side compress -> upload via FileTransfer -> listen for channel
 * events (media:processing, media:variant_ready, media:complete, media:failed).
 *
 * Exposes reactive state for upload progress, processing status, available
 * variants, and errors.
 */

import { useCallback, useRef, useState } from 'react';

import type {
  CompressedImage,
  MediaProcessingStatus,
  MediaVariant,
  MediaVariantReadyEvent,
  MediaCompleteEvent,
  MediaFailedEvent,
} from '@cgraph/shared-types';
import { logger } from '@/lib/logger';

import { compressImage, shouldCompress } from '../components/media/client-image-compressor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadEntry {
  readonly uploadId: string | null;
  readonly uploadProgress: number;
  readonly processingStatus: MediaProcessingStatus;
  readonly variants: ReadonlyArray<MediaVariant>;
  readonly error: string | null;
}

interface UseMediaUploadReturn {
  /** Initiate upload for one or more files. */
  readonly uploadMedia: (files: File[]) => Promise<void>;
  /** Cancel an in-progress upload. */
  readonly cancelUpload: (uploadId: string) => void;
  /** Current upload progress (0-100). */
  readonly progress: number;
  /** Processing status. */
  readonly status: MediaProcessingStatus;
  /** Available variants after processing. */
  readonly variants: ReadonlyArray<MediaVariant>;
  /** Error message if failed. */
  readonly error: string | null;
  /** Server-assigned upload ID. */
  readonly uploadId: string | null;
}

const INITIAL_STATE: UploadEntry = {
  uploadId: null,
  uploadProgress: 0,
  processingStatus: 'uploading',
  variants: [],
  error: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the full media upload lifecycle: client-side compression, upload
 * progress tracking, and server-side processing status via channel events.
 */
export function useMediaUpload(conversationId: string): UseMediaUploadReturn {
  const [state, setState] = useState<UploadEntry>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const uploadMedia = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Process only the first file for now (batch support is additive)
      const file = files[0];
      if (!file) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setState({ ...INITIAL_STATE, processingStatus: 'uploading' });

      try {
        // Client-side pre-compression for images
        let uploadBlob: Blob = file;
        let fileName = file.name;

        if (file.type.startsWith('image/') && (await shouldCompress(file))) {
          const compressed: CompressedImage = await compressImage(file);
          uploadBlob = compressed.blob;
          // Keep original extension but note compression happened
          const ext = compressed.blob.type === 'image/webp' ? '.webp' : '.jpg';
          fileName = file.name.replace(/\.[^.]+$/, ext);
        }

        // Build FormData for upload
        const formData = new FormData();
        formData.append('file', uploadBlob, fileName);
        formData.append('conversation_id', conversationId);

        // Upload with progress tracking
        const uploadResponse = await uploadWithProgress(
          formData,
          (pct) => setState((prev) => ({ ...prev, uploadProgress: pct })),
          controller.signal
        );

        const uploadId = uploadResponse.upload_id;
        setState((prev) => ({
          ...prev,
          uploadId,
          uploadProgress: 100,
          processingStatus: 'processing',
        }));

        // Subscribe to channel events for processing status
        subscribeToProcessingEvents(conversationId, uploadId, (event) => {
          handleProcessingEvent(event, setState);
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        const message = err instanceof Error ? err.message : 'Upload failed';
        logger.error('media_upload_failed', { error: message });
        setState((prev) => ({
          ...prev,
          processingStatus: 'failed',
          error: message,
        }));
      }
    },
    [conversationId]
  );

  const cancelUpload = useCallback((_uploadId: string) => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return {
    uploadMedia,
    cancelUpload,
    progress: state.uploadProgress,
    status: state.processingStatus,
    variants: state.variants,
    error: state.error,
    uploadId: state.uploadId,
  };
}

// ---------------------------------------------------------------------------
// Internal — upload with XMLHttpRequest for progress
// ---------------------------------------------------------------------------

interface UploadResponse {
  readonly upload_id: string;
}

function uploadWithProgress(
  formData: FormData,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/uploads');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: UploadResponse = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          reject(new Error('Invalid response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    signal.addEventListener('abort', () => xhr.abort());

    xhr.send(formData);
  });
}

// ---------------------------------------------------------------------------
// Internal — channel event subscription
// ---------------------------------------------------------------------------

type ProcessingEvent =
  | { type: 'variant_ready'; payload: MediaVariantReadyEvent }
  | { type: 'complete'; payload: MediaCompleteEvent }
  | { type: 'failed'; payload: MediaFailedEvent };

function subscribeToProcessingEvents(
  conversationId: string,
  uploadId: string,
  callback: (event: ProcessingEvent) => void
): void {
  // Listen on the conversation channel for media events targeting this upload.
  // The actual Phoenix channel subscription is managed by the app's socket layer.
  // Here we use a simple window event bridge pattern.
  const handler = (e: Event) => {
    if (!(e instanceof CustomEvent)) return;
    const detail = e.detail;
    if (detail?.upload_id !== uploadId) return;

    const eventType = String(detail.event_type);

    if (eventType === 'media:variant_ready') {
      callback({ type: 'variant_ready', payload: detail });
    } else if (eventType === 'media:complete') {
      callback({ type: 'complete', payload: detail });
    } else if (eventType === 'media:failed') {
      callback({ type: 'failed', payload: detail });
    }
  };

  window.addEventListener(`media:${conversationId}`, handler);
}

function handleProcessingEvent(
  event: ProcessingEvent,
  setState: React.Dispatch<React.SetStateAction<UploadEntry>>
): void {
  switch (event.type) {
    case 'variant_ready': {
      const { variant_type, url, width, height } = event.payload;
      const variant: MediaVariant = {
        variant_type,
        url,
        content_type: '',
        size: 0,
        width,
        height,
      };
      setState((prev) => ({
        ...prev,
        variants: [...prev.variants, variant],
      }));
      break;
    }
    case 'complete':
      setState((prev) => ({
        ...prev,
        processingStatus: 'completed',
      }));
      break;
    case 'failed':
      setState((prev) => ({
        ...prev,
        processingStatus: 'failed',
        error: event.payload.error,
      }));
      break;
  }
}
