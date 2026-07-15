import { MessageInput, type MessagePayload } from '@/modules/chat/components/message-input';
import type { MessageInputAreaProps } from './types';

interface MessageInputAreaWithRefProps extends MessageInputAreaProps {
  readonly inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

function replyAuthor(replyTo: MessageInputAreaProps['replyTo']): string {
  return replyTo?.sender?.displayName || replyTo?.sender?.username || 'message';
}

function replyContent(replyTo: MessageInputAreaProps['replyTo']): string {
  return replyTo?.content || String(replyTo?.metadata?.filename || replyTo?.messageType || '');
}

/**
 * Route-owned adapter that mounts the shared chat composer in Cloud Chat.
 */
export function MessageInputArea({
  conversationId,
  attachmentNodePrice,
  isUploading,
  replyTo,
  inputContainerRef,
  onTyping,
  onAttachmentNodePriceChange,
  onClearReply,
  onPayloadSend,
}: MessageInputAreaWithRefProps) {
  const mappedReply = replyTo
    ? {
        id: replyTo.id,
        author: replyAuthor(replyTo),
        content: replyContent(replyTo),
      }
    : null;

  function handleSend(payload: MessagePayload): Promise<void> {
    return onPayloadSend(payload);
  }

  return (
    <div
      ref={inputContainerRef}
      className="relative z-40 flex-shrink-0 border-t border-[var(--token-border-muted)] bg-[var(--token-bg-primary)]/95 px-3 py-3 sm:px-5"
    >
      <MessageInput
        conversationId={conversationId}
        replyTo={mappedReply}
        onSend={handleSend}
        onCancelReply={onClearReply}
        onTyping={onTyping}
        disabled={isUploading}
        maxAttachments={1}
        nodesPrice={attachmentNodePrice}
        onNodesPriceChange={onAttachmentNodePriceChange}
        className="mx-auto w-full max-w-5xl"
      />
    </div>
  );
}
