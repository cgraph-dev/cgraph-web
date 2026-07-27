/**
 * Groups route content owner.
 */

import { useOutlet } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/ui/empty-state';
import type { ContentAreaProps } from './types';

function GroupSelectionState({
  title,
  description,
  status,
}: {
  readonly title: string;
  readonly description: string;
  readonly status: string;
}) {
  return (
    <EmptyState
      className="h-full"
      icon={<UserGroupIcon className="h-7 w-7" />}
      title={title}
      message={description}
      meta={status}
    />
  );
}

/** Active group outlet or the appropriate selection state. */
export function ContentArea({ activeGroup, groupId, channelId }: ContentAreaProps) {
  const outlet = useOutlet();

  if (outlet) return outlet;
  if (channelId) return null;

  if (groupId) {
    return (
      <GroupSelectionState
        title={activeGroup?.name ? `Welcome to ${activeGroup.name}` : 'Your Groups'}
        description="Select a channel to start chatting with this community."
        status="Community channels"
      />
    );
  }

  return (
    <GroupSelectionState
      title="Your Groups"
      description="Select a server from the sidebar or create a new one to get started."
      status="Group chat ready"
    />
  );
}
