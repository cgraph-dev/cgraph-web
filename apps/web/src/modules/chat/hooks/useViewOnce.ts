/**
 * useViewOnce — Hook for view-once message interactions.
 *
 * Signal reference: ViewOnceMessageRepository.getMessage() flow
 * - Download media first
 * - Call open endpoint
 * - Show in full-screen viewer
 * - Clean up local blob after viewing
 */
import { useState, useCallback, useRef } from 'react';
import { http } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import { deriveViewOnceState } from '@cgraph-dev/shared-types';
import type { ViewOnceState } from '@cgraph-dev/shared-types';

interface UseViewOnceResult {
  readonly viewOnceState: ViewOnceState | null;
  readonly isOpening: boolean;
  readonly mediaBlobUrl: string | null;
  readonly openViewOnce: () => Promise<void>;
  readonly closeViewer: () => void;
  readonly isViewerOpen: boolean;
}

/** Manages view-once message lifecycle: media download, server open notification, and blob cleanup. */
export function useViewOnce(message: Message): UseViewOnceResult {
  const [isOpening, setIsOpening] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const blobRef = useRef<string | null>(null);

  const viewOnceState = deriveViewOnceState(
    message.isViewOnce ?? false,
    message.viewOnceOpenedAt ?? null,
    Boolean(message.metadata?.url),
    message.createdAt
  );

  const openViewOnce = useCallback(async () => {
    if (viewOnceState !== 'pending' || isOpening) return;

    setIsOpening(true);

    try {
      // Step 1: Download the media BEFORE marking as opened
      // Signal: ViewOnceMessageActivity gets URI before opening
      const mediaUrl = message.metadata?.url;
      if (typeof mediaUrl !== 'string') {
        logger.error('[view_once] no media URL available');
        return;
      }

      const response = await fetch(mediaUrl);
      if (!response.ok) {
        logger.error('[view_once] media download failed');
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      blobRef.current = objectUrl;
      setMediaBlobUrl(objectUrl);

      // Step 2: Mark as opened on server
      // Signal: ViewOnceMessageRepository -> setIncomingMessageViewed()
      await http.post(`/api/v1/messages/${message.id}/view-once/open`);

      // Step 3: Show viewer
      setIsViewerOpen(true);
    } catch {
      logger.error('[view_once] open failed', { messageId: message.id });
      // Clean up blob on failure
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
        setMediaBlobUrl(null);
      }
    } finally {
      setIsOpening(false);
    }
  }, [message.id, message.metadata?.url, viewOnceState, isOpening]);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);

    // Signal: ViewOnceMessageActivity.onStop() -> BlobProvider.delete(uri)
    // Clean up the local blob URL after viewer closes
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
      setMediaBlobUrl(null);
    }
  }, []);

  return {
    viewOnceState,
    isOpening,
    mediaBlobUrl,
    openViewOnce,
    closeViewer,
    isViewerOpen,
  };
}
