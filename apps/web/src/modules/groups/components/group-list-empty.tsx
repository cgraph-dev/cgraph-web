/**
 * GroupListEmpty — empty state for the groups list when user has no groups.
 */

import { useNavigate } from 'react-router-dom';
import { UsersIcon } from '@heroicons/react/24/outline';
import { EmptyState } from '@/shared/components/ui';

/**
 * Empty state shown when the user has no groups.
 * CTA navigates to discovery page to find Hubs and groups.
 */
export function GroupListEmpty(): React.ReactNode {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="No groups yet"
      message="Join or create a group to start collaborating with others."
      icon={<UsersIcon className="h-8 w-8 text-gray-500" />}
      action={{
        label: 'Discover Groups',
        onClick: () => navigate('/discovery'),
      }}
    />
  );
}
