/**
 * ViewOnceViewer — Full-screen one-time media viewer.
 *
 * Signal reference: ViewOnceMessageActivity
 * - Dark background, media centered
 * - Auto-closes when user navigates away (onStop -> finish())
 * - Deletes local blob on close (BlobProvider.delete())
 * - Close button + Escape to dismiss
 * - Video: loops forever with duration display
 */
import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ViewOnceViewerProps {
  readonly blobUrl: string;
  readonly contentType: string;
  readonly onClose: () => void;
}

/** Full-screen portal viewer that displays view-once media and auto-closes on tab switch. */
export function ViewOnceViewer(props: ViewOnceViewerProps): ReactNode {
  const { blobUrl, contentType, onClose } = props;

  // Signal: ViewOnceMessageActivity.onStop() -> finish()
  // Auto-close when page loses visibility (user switches tabs, minimizes, etc.)
  useEffect(() => {
    function handleVisibilityChange(): void {
      if (document.hidden) {
        onClose();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Prevent right-click (context menu) to discourage saving
  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
  }, []);

  const isVideo = contentType === 'video';

  const viewer = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
      onClick={onClose}
      onContextMenu={handleContextMenu}
      role="dialog"
      aria-modal="true"
      aria-label="View once media"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-6 w-6"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Media content — prevent click from bubbling to overlay */}
      <div
        className="max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        {isVideo ? (
          <video
            src={blobUrl}
            autoPlay
            loop
            playsInline
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
          />
        ) : (
          <img
            src={blobUrl}
            alt="View once media"
            className="max-h-[90vh] max-w-[90vw] select-none rounded-lg object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );

  return createPortal(viewer, document.body);
}
