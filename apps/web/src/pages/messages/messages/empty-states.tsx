/**
 * Empty and loading states for the messages route.
 */

import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
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

/** Stable conversation-list loading geometry. */
export function LoadingSpinner() {
  return (
    <div
      className="space-y-2 px-3 py-4"
      role="status"
      aria-label="Loading conversations"
      aria-busy="true"
    >
      <span className="sr-only">Loading conversations</span>
      <Skeleton shape="message" count={4} />
    </div>
  );
}
