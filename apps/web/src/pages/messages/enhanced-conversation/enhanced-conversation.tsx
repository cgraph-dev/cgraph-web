/**
 * Enhanced Conversation Component
 *
 * Next-generation messaging UI with advanced animations, 3D effects,
 * theme-driven styling, and mobile-inspired interactions.
 */

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCloudConversationController } from '@/modules/chat/controllers/cloud-conversation';
import { ConversationHeader } from './conversation-header';
import { MessageInputArea } from './message-input-area';
import { LoadingSpinner } from './loading-spinner';
import { ConversationSurface, MessageList, DEFAULT_UI_PREFERENCES } from '@/modules/chat/components';
import { MessageRequestBanner } from '@/modules/chat/components/message-request-banner';
import { ForwardMessageModal } from '@/modules/chat/components/forward-message-modal';
import { NewMessagesBar } from '@/modules/chat/components/new-messages-bar';
import { ScrollToBottomButton } from '@/modules/chat/components/scroll-to-bottom-button';

/**
 * Enhanced Conversation component.
 */
export default function EnhancedConversation() {
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [manualScrollTarget, setManualScrollTarget] = useState<{
    messageId: string;
    requestKey: number;
  } | null>(null);
  const [consumedRouteScrollTarget, setConsumedRouteScrollTarget] = useState<string | null>(null);
  const {
    conversationId,
    conversation,
    conversationMessages,
    scrollToMessageId,
    typing,
    user,
    attachmentNodePrice,
    replyTo,
    messageRequest,
    isSending,
    setAttachmentNodePrice,
    setReplyTo,
    messagesEndRef,
    inputContainerRef,
    messagesScrollRef,
    callRecipientId,
    handleMessagesScroll,
    showScrollToLatest,
    newMessagesBelow,
    scrollToLatestMessages,
    handleTyping,
    handleComposerPayload,
    handleStartCall,
    handleMessageRequestAccepted,
    handleMessageRequestRejected,
    messageActions,
  } = useCloudConversationController();

  const pinnedMessages = conversationMessages.filter(
    (message) => message.isPinned && !message.deletedAt
  );
  const routeScrollTargetKey = scrollToMessageId ? `${conversationId}:${scrollToMessageId}` : null;

  const scrollToMessage = (messageId: string) => {
    if (routeScrollTargetKey) {
      setConsumedRouteScrollTarget(routeScrollTargetKey);
    }
    setManualScrollTarget((previous) => ({
      messageId,
      requestKey: (previous?.requestKey ?? 0) + 1,
    }));
    setShowPinnedMessages(false);
  };

  const routeScrollTarget =
    routeScrollTargetKey && consumedRouteScrollTarget !== routeScrollTargetKey
      ? scrollToMessageId
      : null;
  const activeScrollToMessageId = manualScrollTarget?.messageId ?? routeScrollTarget;
  const activeScrollRequestKey =
    manualScrollTarget?.requestKey ??
    (routeScrollTarget ? `${conversationId}:${routeScrollTarget}` : null);

  const handleScrollToMessageComplete = (messageId: string) => {
    if (manualScrollTarget?.messageId === messageId) {
      setManualScrollTarget(null);
    }
    if (routeScrollTargetKey && scrollToMessageId === messageId) {
      setConsumedRouteScrollTarget(routeScrollTargetKey);
    }
  };

  const handlePinMessage = (messageId: string) => {
    const message = conversationMessages.find((entry) => entry.id === messageId);
    if (!message) return;

    messageActions.handlePinMessage(message.id, message.conversationId);
  };

  const handleJumpToLatest = () => {
    const latestMessage = conversationMessages.at(-1);
    if (latestMessage) {
      scrollToMessage(latestMessage.id);
    }
    scrollToLatestMessages('auto');
  };

  if (!conversation) {
    return <LoadingSpinner />;
  }

  return (
    <ConversationSurface
      header={
        <ConversationHeader
          conversationName={conversation.name || 'Conversation'}
          isTyping={typing.length > 0}
          canStartCall={Boolean(callRecipientId)}
          pinnedCount={pinnedMessages.length}
          showPinnedMessages={showPinnedMessages}
          onTogglePinnedMessages={() => setShowPinnedMessages((value) => !value)}
          onStartVoiceCall={() => handleStartCall('audio')}
          onStartVideoCall={() => handleStartCall('video')}
        />
      }
      pinnedPanel={
        showPinnedMessages && pinnedMessages.length > 0 ? (
          <aside
            className="border-primary-500/20 absolute right-4 top-20 z-30 w-[min(22rem,calc(100%-2rem))] rounded-lg border bg-dark-900/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
            role="region"
            aria-label="Pinned messages"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Pinned Messages</h3>
              <button
                type="button"
                onClick={() => setShowPinnedMessages(false)}
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close pinned messages"
                title="Close pinned messages"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {pinnedMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => scrollToMessage(message.id)}
                  className="hover:border-primary-400/40 hover:bg-primary-500/10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label={`Jump to pinned message from ${
                    message.sender.displayName || message.sender.username || 'user'
                  }`}
                >
                  <span className="block truncate text-xs font-medium text-primary-200">
                    {message.sender.displayName || message.sender.username || 'Pinned message'}
                  </span>
                  <span className="mt-1 block truncate text-sm text-white/80">
                    {message.content || message.metadata?.filename || message.messageType}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null
      }
      requestBanner={
        conversationId && messageRequest ? (
          <MessageRequestBanner
            conversationId={conversationId}
            requesterName={messageRequest.requesterName}
            requesterAvatar={messageRequest.requesterAvatar}
            sharedGroupCount={messageRequest.sharedGroupCount}
            onAccepted={handleMessageRequestAccepted}
            onRejected={handleMessageRequestRejected}
          />
        ) : null
      }
      messagesScrollRef={messagesScrollRef}
      onMessagesScroll={handleMessagesScroll}
      messages={
        <>
          {newMessagesBelow > 0 ? (
            <NewMessagesBar count={newMessagesBelow} onJump={handleJumpToLatest} />
          ) : null}

          <MessageList
            messages={[...conversationMessages]}
            userId={user?.id}
            uiPreferences={DEFAULT_UI_PREFERENCES}
            typing={typing}
            onReply={setReplyTo}
            onEdit={messageActions.handleStartEdit}
            onDelete={messageActions.handleDeleteMessage}
            onPin={handlePinMessage}
            onForward={(message) => messageActions.handleOpenForward(message, true)}
            activeMessageMenu={messageActions.activeMessageMenu}
            onToggleMenu={messageActions.handleToggleMessageMenu}
            editingMessageId={messageActions.editingMessageId}
            editContent={messageActions.editContent}
            onEditContentChange={messageActions.setEditContent}
            onSaveEdit={messageActions.handleSaveEdit}
            onCancelEdit={messageActions.handleCancelEdit}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={messagesScrollRef}
            scrollToMessageId={activeScrollToMessageId}
            scrollToMessageRequestKey={activeScrollRequestKey}
            onScrollToMessageComplete={handleScrollToMessageComplete}
          />
        </>
      }
      scrollControl={
        <ScrollToBottomButton
          visible={showScrollToLatest}
          newCount={newMessagesBelow}
          onClick={handleJumpToLatest}
        />
      }
      composer={
        <MessageInputArea
          conversationId={conversationId}
          attachmentNodePrice={attachmentNodePrice}
          isSending={isSending}
          replyTo={replyTo}
          inputContainerRef={inputContainerRef}
          onTyping={handleTyping}
          onAttachmentNodePriceChange={setAttachmentNodePrice}
          onClearReply={() => setReplyTo(null)}
          onPayloadSend={handleComposerPayload}
        />
      }
      modalLayer={
        messageActions.showForwardModal && messageActions.messageToForward ? (
          <ForwardMessageModal
            isOpen={messageActions.showForwardModal}
            message={messageActions.messageToForward}
            onClose={messageActions.handleCloseForward}
            onForward={(conversationIds) =>
              messageActions.handleForwardMessage(conversationIds, true)
            }
          />
        ) : null
      }
    />
  );
}
