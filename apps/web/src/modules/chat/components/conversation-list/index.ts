/**
 * ConversationList module exports
 */

export { ConversationList, default } from './conversation-list';

// Components
export { ConversationListHeader } from './conversation-list-header';
export { ConversationItem } from './conversation-item';
export { ConversationSidebar } from './conversation-sidebar';
export { ConversationMenu } from './conversation-menu';
export { EmptyState } from './empty-state';
export { NewChatModal } from './new-chat-modal';
export { ConversationItem as RoutedConversationItem } from './routed-conversation-item';

// Hooks
export { useConversationList } from './useConversationList';

// Utils
export {
  getConversationName,
  getConversationAvatar,
  getConversationAvatarBorderId,
  getConversationOnlineStatus,
  formatMessageTime,
  filterConversations,
} from './utils';

export {
  applySpaceConversationPatch,
  conversationMatchesSpace,
  readConversationSpace,
  spaceConversationPatch,
} from './conversation-spaces';

// Types
export type {
  FilterType,
  ConversationListProps,
  ConversationItemProps,
  ConversationMenuProps,
  NewChatModalProps,
  MockUser,
  FilterOption,
  UseConversationListReturn,
} from './types';
export type {
  ConversationSidebarProps,
  ConversationSpace,
  EmptyStateProps,
  OnlineStatusMap,
  RoutedConversationItemProps,
} from './sidebar-types';

// Constants
export { FILTER_OPTIONS } from './constants';
