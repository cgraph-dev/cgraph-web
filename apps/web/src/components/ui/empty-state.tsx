/**
 * Empty state placeholder component.
 */
import { motion } from 'motion/react';
import {
  InboxIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button } from './button';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty State — fallback UI for empty data states.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  message = 'No items to display.',
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      role="status"
      aria-label={title}
      className={`cgraph-empty-state ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cgraph-empty-icon">
        {icon || <InboxIcon className="h-7 w-7" />}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <Button
          className="mt-5"
          leftIcon={<PlusIcon />}
          onClick={action.onClick}
          animated={false}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Common empty state variants
/**
 */
/**
 * No Posts Empty — fallback UI for empty data states.
 */
export function NoPostsEmpty({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      title="No Posts Yet"
      message="Be the first to share something with the community!"
      icon={<DocumentTextIcon className="h-8 w-8 text-gray-500" />}
      action={onCreatePost ? { label: 'Create Post', onClick: onCreatePost } : undefined}
    />
  );
}

/**
 */
/**
 * No Comments Empty — fallback UI for empty data states.
 */
export function NoCommentsEmpty() {
  return (
    <EmptyState
      title="No Comments Yet"
      message="Start the conversation by leaving the first comment!"
      icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}

/**
 */
/**
 * No Members Empty — fallback UI for empty data states.
 */
export function NoMembersEmpty() {
  return (
    <EmptyState
      title="No Members"
      message="This community doesn't have any members yet."
      icon={<UsersIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}

/**
 */
/**
 * No Messages Empty — fallback UI for empty data states.
 */
export function NoMessagesEmpty({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      title="No Messages"
      message="You haven't started any conversations yet."
      icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-500" />}
      action={onStartChat ? { label: 'Start Chat', onClick: onStartChat } : undefined}
    />
  );
}

/**
 */
/**
 * No Friends Empty — fallback UI for empty data states.
 */
export function NoFriendsEmpty({ onAddFriend }: { onAddFriend?: () => void }) {
  return (
    <EmptyState
      title="No Friends Yet"
      message="Connect with others by adding friends."
      icon={<UsersIcon className="h-8 w-8 text-gray-500" />}
      action={onAddFriend ? { label: 'Add Friends', onClick: onAddFriend } : undefined}
    />
  );
}

/**
 */
/**
 * Search No Results component.
 */
export function SearchNoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      title="No Results Found"
      message={
        query
          ? `No results found for "${query}". Try a different search term.`
          : 'Try a different search term.'
      }
      icon={<InboxIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}
