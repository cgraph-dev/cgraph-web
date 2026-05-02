/**
 * Chat Module Hooks
 *
 * All chat-related hooks consolidated here.
 * This replaces hooks scattered in hooks/ directory.
 */

// Message hooks
export { useMessageActions } from './useMessageActions';
export { useConversationMedia } from './useConversationMedia';

// Typing indicator
export { useTypingIndicator } from './useTypingIndicator';

// View-once media (Signal ViewOnceMessageRepository pattern)
export { useViewOnce } from './useViewOnce';
