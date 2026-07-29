import type { ReactNode } from 'react';
import { FileText, Inbox, MessageCircle, Plus, Users } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly icon?: ReactNode;
  readonly meta?: ReactNode;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  readonly className?: string;
}

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'No items to display.',
  icon,
  meta,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={`cgraph-empty-state ${className}`}
    >
      <div className="cgraph-empty-icon" aria-hidden="true">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {meta ? <div className="cgraph-empty-meta">{meta}</div> : null}
      {action && (
        <Button
          className="mt-5"
          leftIcon={<Plus />}
          onClick={action.onClick}
          animated={false}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoPostsEmpty({ onCreatePost }: { readonly onCreatePost?: () => void }) {
  return (
    <EmptyState
      title="No Posts Yet"
      message="Be the first to share something with the community!"
      icon={<FileText className="h-7 w-7" />}
      action={onCreatePost ? { label: 'Create Post', onClick: onCreatePost } : undefined}
    />
  );
}

export function NoCommentsEmpty() {
  return (
    <EmptyState
      title="No Comments Yet"
      message="Start the conversation by leaving the first comment!"
      icon={<MessageCircle className="h-7 w-7" />}
    />
  );
}

export function NoMembersEmpty() {
  return (
    <EmptyState
      title="No Members"
      message="This community doesn't have any members yet."
      icon={<Users className="h-7 w-7" />}
    />
  );
}

export function NoMessagesEmpty({ onStartChat }: { readonly onStartChat?: () => void }) {
  return (
    <EmptyState
      title="No Messages"
      message="You haven't started any conversations yet."
      icon={<MessageCircle className="h-7 w-7" />}
      action={onStartChat ? { label: 'Start Chat', onClick: onStartChat } : undefined}
    />
  );
}

export function NoFriendsEmpty({ onAddFriend }: { readonly onAddFriend?: () => void }) {
  return (
    <EmptyState
      title="No Friends Yet"
      message="Connect with others by adding friends."
      icon={<Users className="h-7 w-7" />}
      action={onAddFriend ? { label: 'Add Friends', onClick: onAddFriend } : undefined}
    />
  );
}

export function SearchNoResults({ query }: { readonly query?: string }) {
  return (
    <EmptyState
      title="No Results Found"
      message={
        query
          ? `No results found for "${query}". Try a different search term.`
          : 'Try a different search term.'
      }
      icon={<Inbox className="h-7 w-7" />}
    />
  );
}
