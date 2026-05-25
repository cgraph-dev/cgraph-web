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
  isSending,
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

  function handleSend(payload: MessagePayload): void {
    void onPayloadSend(payload);
  }

  return (
    <div
      ref={inputContainerRef}
      className="flex-shrink-0 border-t border-[var(--token-card-border)] p-4"
    >
      <MessageInput
        conversationId={conversationId}
        replyTo={mappedReply}
        onSend={handleSend}
        onCancelReply={onClearReply}
        onTyping={onTyping}
        disabled={isSending}
        maxAttachments={1}
        nodesPrice={attachmentNodePrice}
        onNodesPriceChange={onAttachmentNodePriceChange}
        className="mx-auto max-w-5xl"
      />
    </div>
  );
}
