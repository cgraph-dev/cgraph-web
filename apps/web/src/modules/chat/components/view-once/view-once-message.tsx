/**
 * ViewOnceMessage — Renders a view-once message in the chat.
 *
 * Signal reference: ViewOnceMessageView
 * - Incoming + pending: blurred thumbnail + tap to reveal
 * - Incoming + viewed: "Viewed" text
 * - Outgoing + pending: "Photo" / "Video" text
 * - Outgoing + viewed: "Viewed" text with checkmark
 */
import type { ReactNode } from 'react';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import { useViewOnce } from '@/modules/chat/hooks/useViewOnce';
import { ViewOnceIndicator } from './view-once-indicator';
import { ViewOnceViewer } from './view-once-viewer';

interface ViewOnceMessageProps {
  readonly message: Message;
  readonly isOwn: boolean;
}

/** Renders a view-once message with blurred thumbnail, tap-to-reveal, and full-screen viewer. */
export function ViewOnceMessage(props: ViewOnceMessageProps): ReactNode {
  const { message, isOwn } = props;
  const { viewOnceState, isOpening, mediaBlobUrl, openViewOnce, closeViewer, isViewerOpen } =
    useViewOnce(message);

  if (!viewOnceState) return null;

  const canOpen = viewOnceState === 'pending' && !isOwn && !isOpening;

  return (
    <>
      <button
        type="button"
        onClick={canOpen ? openViewOnce : undefined}
        disabled={!canOpen}
        className={`relative overflow-hidden rounded-xl ${canOpen ? 'cursor-pointer hover:opacity-80 active:scale-[0.98]' : 'cursor-default'} transition-all duration-150`}
      >
        {/* Blurred thumbnail for pending incoming messages */}
        {viewOnceState === 'pending' && message.metadata?.thumbnailUrl && !isOwn && (
          <div className="relative h-48 w-48">
            <img
              src={
                typeof message.metadata.thumbnailUrl === 'string'
                  ? message.metadata.thumbnailUrl
                  : undefined
              }
              alt=""
              className="h-full w-full object-cover blur-xl brightness-50"
              draggable={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <ViewOnceIndicator
                state={viewOnceState}
                contentType={message.messageType}
                isOwn={isOwn}
                isOpening={isOpening}
              />
            </div>
          </div>
        )}

        {/* No thumbnail or viewed/expired state: text-only indicator */}
        {(viewOnceState !== 'pending' || !message.metadata?.thumbnailUrl || isOwn) && (
          <ViewOnceIndicator
            state={viewOnceState}
            contentType={message.messageType}
            isOwn={isOwn}
            isOpening={isOpening}
          />
        )}
      </button>

      {/* Full-screen viewer — Signal: ViewOnceMessageActivity */}
      {isViewerOpen && mediaBlobUrl && (
        <ViewOnceViewer
          blobUrl={mediaBlobUrl}
          contentType={message.messageType}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
