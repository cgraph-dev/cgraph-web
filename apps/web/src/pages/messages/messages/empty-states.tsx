/**
 * Empty and loading states for the messages route.
 */

import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/ui/empty-state';
import type { EmptyStateProps } from './types';

/** Empty conversation-list state. */
export function EmptyConversationList({ searchQuery }: EmptyStateProps) {
  const { t } = useTranslation('messages');

  return (
    <EmptyState
      className="min-h-[240px] py-8"
      icon={<UserIcon className="h-7 w-7" />}
      title={searchQuery ? t('noConversationsFound') : t('noMessagesYet')}
      message={t('startNewConversation')}
    />
  );
}

/** Main-pane state shown until a conversation is selected. */
export function NoConversationSelected() {
  const { t } = useTranslation('messages');

  return (
    <EmptyState
      className="h-full"
      icon={<ChatBubbleLeftRightIcon className="h-7 w-7" />}
      title={t('yourMessages')}
      message={t('selectConversation')}
      meta={t('endToEndEncrypted')}
    />
  );
}
