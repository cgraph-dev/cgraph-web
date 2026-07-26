/**
 * Chat Module Components
 *
 * All chat, conversation, and messaging components consolidated here.
 * This replaces the scattered components in:
 * - components/chat/
 * - components/conversation/
 * - components/messages/
 * - components/messaging/
 */
// Core Message Components
// Message display
export {
  MessageBubble,
  DEFAULT_UI_PREFERENCES,
  type MessageBubbleProps,
  type UIPreferences,
} from './message-bubble';
export { MessageList } from './message-list';
export { MessageSearch } from './message-search';
export { default as MessageReactions } from './message-reactions';

// Message content types
export { FileMessage } from './file-message';
export { GifMessage } from './gif-message';
export { ContactCardMessage } from './contact-card-message';
export { MediaAlbum } from './media-album';
export { default as RichMediaEmbed } from './rich-media-embed';

// Reply
export { ReplyPreview, type ReplyPreviewProps } from './reply-preview';
// Conversation Components
export { ConversationSurface, default as ConversationSurfaceDefault } from './conversation-surface';
export type { ConversationSurfaceProps } from './conversation-surface';
export {
  CloudConversation,
  EnhancedConversation,
  LoadingSpinner as CloudConversationLoadingSpinner,
} from './cloud-conversation';
export { TypingIndicator } from './typing-indicator';
// Animation Components
export { AnimatedMessageWrapper } from './animated-message-wrapper';
export { AnimatedReactionBubble } from './animated-reaction-bubble';
export { AmbientBackground, type AmbientBackgroundProps } from './ambient-background';
// UI Customization
export { UISettingsPanel, type UISettingsPanelProps } from './ui-settings-panel';
export { default as ChatInfoPanel } from './chat-info-panel';
// Pickers
export { EmojiPicker } from './emoji-picker';
export { GifPicker, type GifResult } from './gif-picker';
// Forward Modal
export { ForwardMessageModal } from './forward-message-modal';
// Messaging Components
export { ConversationList } from './conversation-list';
export { MessageInput } from './message-input';
