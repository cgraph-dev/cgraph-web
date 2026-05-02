/**
 * Enhanced Conversation Component
 *
 * Next-generation messaging UI with advanced animations, 3D effects,
 * theme-driven styling, and mobile-inspired interactions.
 */

import { motion } from 'motion/react';
import { useEnhancedConversation } from './useEnhancedConversation';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { ConversationHeader } from './conversation-header';
import { MessageInputArea } from './message-input-area';
import { TypingIndicator } from './typing-indicator';
import { LoadingSpinner } from './loading-spinner';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

export default function EnhancedConversation() {
  const {
    conversation,
    conversationMessages,
    typing,
    user,
    messageInput,
    setMessageInput,
    isSending,
    setReplyTo,
    messagesEndRef,
    inputContainerRef,
    callRecipientId,
    handleSend,
    handleAvatarClick,
    handleStartCall,
  } = useEnhancedConversation();

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
          onGenerateTheme={() => {}}
          canStartCall={Boolean(callRecipientId)}
          onStartVoiceCall={() => handleStartCall('audio')}
          onStartVideoCall={() => handleStartCall('video')}
        />

        {/* Messages Area */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
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
                index={index}
                onAvatarClick={handleAvatarClick}
              />
            );
          })}

          {/* Typing indicator */}
          <TypingIndicator isVisible={typing.length > 0} />

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <MessageInputArea
          messageInput={messageInput}
          isSending={isSending}
          inputContainerRef={inputContainerRef}
          onMessageChange={setMessageInput}
          onSend={handleSend}
        />
      </motion.div>
    </>
  );
}
