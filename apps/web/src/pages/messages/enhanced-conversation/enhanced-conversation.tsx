/**
 * Enhanced Conversation Component
 *
 * Next-generation messaging UI with advanced animations, 3D effects,
 * theme-driven styling, and mobile-inspired interactions.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEnhancedConversation } from './useEnhancedConversation';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { ConversationHeader } from './conversation-header';
import { MessageInputArea } from './message-input-area';
import { TypingIndicator } from './typing-indicator';
import { LoadingSpinner } from './loading-spinner';
import { MessageRequestBanner } from '@/modules/chat/components/message-request-banner';
import { ForwardMessageModal } from '@/modules/chat/components/forward-message-modal';
import { NewMessagesBar } from '@/modules/chat/components/new-messages-bar';
import { ScrollToBottomButton } from '@/modules/chat/components/scroll-to-bottom-button';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 * Enhanced Conversation component.
 */
export default function EnhancedConversation() {
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const {
    conversationId,
    conversation,
    conversationMessages,
    typing,
    user,
    messageInput,
    attachment,
    attachmentNodePrice,
    isVoiceMode,
    replyTo,
    messageRequest,
    handleMessageChange,
    isSending,
    setAttachment,
    setAttachmentNodePrice,
    clearAttachment,
    setIsVoiceMode,
    setReplyTo,
    messagesEndRef,
    inputContainerRef,
    messagesScrollRef,
    callRecipientId,
    handleMessagesScroll,
    showScrollToLatest,
    newMessagesBelow,
    scrollToLatestMessages,
    handleSend,
    handleGifSelect,
    handleStickerSelect,
    handleVoiceComplete,
    handleAvatarClick,
    handleStartCall,
    handleMessageRequestAccepted,
    handleMessageRequestRejected,
    messageActions,
  } = useEnhancedConversation();

  const pinnedMessages = conversationMessages.filter(
    (message) => message.isPinned && !message.deletedAt
  );

  const scrollToMessage = (messageId: string) => {
    document.getElementById(`message-${messageId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setShowPinnedMessages(false);
  };

  if (!conversation) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Main Container */}
      <motion.div
        className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden"
        {...FADE_IN}
        transition={tweens.smooth}
      >
        {/* Header */}
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

        {showPinnedMessages && pinnedMessages.length > 0 && (
          <motion.aside
            className="border-primary-500/20 absolute right-4 top-20 z-30 w-[min(22rem,calc(100%-2rem))] rounded-lg border bg-dark-900/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
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
          </motion.aside>
        )}

        {conversationId && messageRequest && (
          <MessageRequestBanner
            conversationId={conversationId}
            requesterName={messageRequest.requesterName}
            requesterAvatar={messageRequest.requesterAvatar}
            sharedGroupCount={messageRequest.sharedGroupCount}
            onAccepted={handleMessageRequestAccepted}
            onRejected={handleMessageRequestRejected}
          />
        )}

        {/* Messages Area */}
        <div
          ref={messagesScrollRef}
          onScroll={handleMessagesScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
          aria-label="Conversation messages"
        >
          {newMessagesBelow > 0 && (
            <NewMessagesBar count={newMessagesBelow} onJump={() => scrollToLatestMessages()} />
          )}

          {conversationMessages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const prevMessage = conversationMessages[index - 1];
            const showAvatar =
              !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onReply={() => setReplyTo(message)}
                onEdit={() => messageActions.handleStartEdit(message)}
                onDelete={() => messageActions.handleDeleteMessage(message.id)}
                onPin={() => messageActions.handlePinMessage(message.id, message.conversationId)}
                onForward={() => messageActions.handleOpenForward(message, true)}
                isMenuOpen={messageActions.activeMessageMenu === message.id}
                onToggleMenu={() => messageActions.handleToggleMessageMenu(message.id)}
                isEditing={messageActions.editingMessageId === message.id}
                editContent={messageActions.editContent}
                onEditContentChange={messageActions.setEditContent}
                onSaveEdit={messageActions.handleSaveEdit}
                onCancelEdit={messageActions.handleCancelEdit}
                index={index}
                onAvatarClick={handleAvatarClick}
              />
            );
          })}

          {/* Typing indicator */}
          <TypingIndicator isVisible={typing.length > 0} />

          <div ref={messagesEndRef} />
        </div>

        <ScrollToBottomButton
          visible={showScrollToLatest}
          newCount={newMessagesBelow}
          onClick={() => scrollToLatestMessages()}
        />

        {/* Input Area */}
        <MessageInputArea
          messageInput={messageInput}
          attachment={attachment}
          attachmentNodePrice={attachmentNodePrice}
          isSending={isSending}
          isVoiceMode={isVoiceMode}
          replyTo={replyTo}
          inputContainerRef={inputContainerRef}
          onVoiceModeChange={setIsVoiceMode}
          onMessageChange={handleMessageChange}
          onFileSelect={setAttachment}
          onClearAttachment={clearAttachment}
          onAttachmentNodePriceChange={setAttachmentNodePrice}
          onClearReply={() => setReplyTo(null)}
          onGifSelect={handleGifSelect}
          onStickerSelect={handleStickerSelect}
          onVoiceComplete={handleVoiceComplete}
          onSend={handleSend}
        />

        {messageActions.showForwardModal && messageActions.messageToForward && (
          <ForwardMessageModal
            isOpen={messageActions.showForwardModal}
            message={messageActions.messageToForward}
            onClose={messageActions.handleCloseForward}
            onForward={(conversationIds) =>
              messageActions.handleForwardMessage(conversationIds, true)
            }
          />
        )}
      </motion.div>
    </>
  );
}
