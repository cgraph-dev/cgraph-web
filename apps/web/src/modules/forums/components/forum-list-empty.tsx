/**
 * ForumListEmpty — empty state for the forums list when no forums exist.
 */

import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { EmptyState } from '@/shared/components/ui';

/**
 * Empty state shown when the user has no forums.
 * CTA navigates to forum discovery.
 */
export function ForumListEmpty(): React.ReactNode {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="No forums yet"
      message="Browse forums to find communities and discussions."
      icon={<ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-gray-500" />}
      action={{
        label: 'Browse Forums',
        onClick: () => navigate('/forums'),
      }}
    />
  );
}
